import type {SlackMessage} from './slack';

interface Prompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const OpenAI = (token: string) => {
  const convertMessages = (
    threadMessages: SlackMessage[],
    slackBotId: string,
    maxReferMessage: number
  ): Prompt[] => {
    const m = threadMessages
      .reduce((acc, message) => {
        const mention = `<@${slackBotId}>`;
        const content = message.text?.replace(/<@[0-9a-zA-Z]+>/g, '').trim();

        // NOTE: メンションされたメッセージを抽出
        if (message.text?.includes(mention) && content != null) {
          const role = 'user' as const;
          return [...acc, {role, content}];
        }

        // NOTE: Botのメッセージを抽出
        if (message.user === slackBotId && content != null) {
          const role = 'assistant' as const;
          return [...acc, {role, content}];
        }

        return acc;
      }, [] as Prompt[])
      // NOTE: 会話ログは最新のn件までに制限
      .slice(-maxReferMessage);

    return m;
  };

  const getResponse = async (
    prompt: string,
    messages: Prompt[],
    model: string
  ): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages: [{role: 'system', content: prompt}, ...messages],
      }),
    });
    const data = (await response.json()) as any;
    return data.choices[0].message.content.trim();
  };

  return {convertMessages, getResponse};
};
