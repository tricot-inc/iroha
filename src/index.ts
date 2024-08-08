import {Hono} from 'hono';
import {env} from 'hono/adapter';
import {OpenAI} from './libs/openai';
import {Slack} from './libs/slack';

export const sleep = (msec: number) =>
  new Promise((resolve) => setTimeout(resolve, msec));

type Env = {
  Bindings: {
    // OpenAI
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    OPENAI_PROMPT: string;
    OPENAI_MAX_REFER_MESSAGES: number;
    // Slack
    SLACK_TOKEN: string;
    SLACK_SIGNING_SECRET: string;
    SLACK_APP_TOKEN: string;
    SLACK_BOT_ID: string;
    SLACK_TEMP_MESSAGE: string;
    SLACK_BOT_ERROR_MESSAGE: string;
  };
};

const app = new Hono<Env>();

app.get('/health', async (c) => c.text('ok!'));

app.post('/slack/events', async (c) => {
  const {
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_PROMPT,
    OPENAI_MAX_REFER_MESSAGES,
    SLACK_TOKEN,
    SLACK_SIGNING_SECRET,
    // SLACK_APP_TOKEN,
    SLACK_BOT_ID,
    SLACK_TEMP_MESSAGE,
    SLACK_BOT_ERROR_MESSAGE,
  } = env(c);
  const slack = Slack(SLACK_TOKEN);
  const openai = OpenAI(OPENAI_API_KEY);

  // NOTE: 3秒以内にレスポンスを返さないとSlack側が再送してくるので無視する
  if (c.req.header('X-Slack-Retry-Num') != null) {
    return c.text('Retry request', 200);
  }

  const requestBody = await c.req.text();
  const headerTimestamp = Number(c.req.header('X-Slack-Request-Timestamp'));
  const headerSignature = c.req.header('x-slack-signature') as string;

  // NOTE: リクエストの検証
  const isValid = await slack.isValidRequest(
    SLACK_SIGNING_SECRET,
    headerTimestamp,
    requestBody,
    headerSignature,
    Math.floor(Date.now() / 1000)
  );
  if (!isValid) return c.text('Invalid request');

  const body = await c.req.json();

  // NOTE: SlackにRequest URLを設定する際の検証用レスポンス
  if (body.type === 'url_verification') {
    return c.json({challenge: body.challenge});
  }

  // NOTE: メンションされたメッセージに対して返信を行う
  if (body.event && body.event.type === 'app_mention') {
    const channel = body.event.channel;
    const threadTs = body.event.thread_ts;
    const ts = body.event.ts;

    const tempMessageRes = await slack.postMessage(
      channel,
      ts,
      SLACK_TEMP_MESSAGE
    );
    const targetTs = tempMessageRes.ts;

    const replies = await slack.fetchReplies(channel, threadTs);
    const threadMessages = replies?.messages ?? [];

    const messages = openai.convertMessages(
      threadMessages,
      SLACK_BOT_ID,
      OPENAI_MAX_REFER_MESSAGES
    );

    try {
      const resMessage = await openai.getResponse(
        OPENAI_PROMPT,
        messages,
        OPENAI_MODEL
      );

      await slack.updateMessage(channel, targetTs, resMessage);
    } catch (_e) {
      await slack.updateMessage(channel, targetTs, SLACK_BOT_ERROR_MESSAGE);
    }

    return c.text('Event received');
  }

  return c.text('Not found', 404);
});

export default app;
