export interface SlackMessage {
  type: string;
  user: string;
  text: string;
  thread_ts: string;
  reply_count: number;
  subscribed: boolean;
  last_read: string;
  unread_count: number;
  ts: string;
}

type SlackRepliesResponse =
  | {
      messages: SlackMessage[];
      has_more: boolean;
      ok: true;
      response_metadata: {next_cursor: string};
    }
  | {ok: false; error: string};

type SlackPostMessageResponse =
  | {
      ok: true;
      channel: string;
      ts: string;
      message: {
        text: string;
        username: string;
        bot_id: string;
        attachments: [{text: string; id: number; fallback: string}];
        type: string;
        subtype: string;
        ts: string;
      };
    }
  | {ok: false; error: string};

type SlackUpdateMessageResponse =
  | {
      ok: true;
      channel: string;
      ts: string;
      text: string;
      message: {text: string; user: string};
    }
  | {ok: false; error: string};

export const Slack = (token: string) => {
  const validateSignature = async (
    signingSecret: string,
    timestamp: string,
    request_body: string,
    signatureHeader: string
  ) => {
    const generateSlackSignature = async (
      slackSigningSecret: string,
      timestamp: string,
      requestBody: string
    ): Promise<string> => {
      const sigBaseString = `v0:${timestamp}:${requestBody}`;
      const enc = new TextEncoder();
      const keyData = enc.encode(slackSigningSecret);
      const messageData = enc.encode(sigBaseString);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        {name: 'HMAC', hash: 'SHA-256'},
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      const hexSignature = `v0=${Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;

      return hexSignature;
    };

    const timingSafeEqual = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;

      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }

      return result === 0;
    };

    const mySignature = await generateSlackSignature(
      signingSecret,
      timestamp,
      request_body
    );

    return timingSafeEqual(mySignature, signatureHeader);
  };

  // https://api.slack.com/authentication/verifying-requests-from-slack#validating-a-request
  const isValidRequest = async (
    signingSecret: string,
    headerTimestamp: number,
    requestBody: string,
    headerSignature: string,
    currentTimestamp: number
  ) => {
    console.log(
      currentTimestamp,
      headerTimestamp,
      currentTimestamp - headerTimestamp
    );
    // NOTE: リクエストのタイムスタンプが現在時刻から5分以内であることを確認
    if (Math.abs(currentTimestamp - headerTimestamp) > 5 * 60) return false;

    // NOTE: リクエストの検証を行う https://api.slack.com/authentication/verifying-requests-from-slack#validating-a-request
    const generateSlackSignature = async (): Promise<string> => {
      const sigBaseString = `v0:${headerTimestamp}:${requestBody}`;
      const enc = new TextEncoder();
      const keyData = enc.encode(signingSecret);
      const messageData = enc.encode(sigBaseString);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        {name: 'HMAC', hash: 'SHA-256'},
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      const hexSignature = `v0=${Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;

      return hexSignature;
    };

    const mySignature = await generateSlackSignature();

    const timingSafeEqual = (a: string, b: string): boolean => {
      if (a.length !== b.length) return false;

      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }

      return result === 0;
    };

    return timingSafeEqual(mySignature, headerSignature);
  };

  // https://api.slack.com/methods/conversations.replies
  const fetchReplies = async (channelId: string, threadTs: string) => {
    const params = {channel: channelId, ts: threadTs};
    const queryParams = new URLSearchParams(params);

    const res = await fetch(
      `https://slack.com/api/conversations.replies?${queryParams}`,
      {headers: {Authorization: `Bearer ${token}`}}
    );

    const data = (await res.json()) as SlackRepliesResponse;

    if (!data.ok) return;

    return data;
  };

  // https://api.slack.com/methods/chat.postMessage
  const postMessage = async (
    channelId: string,
    threadTs: string,
    text: string
  ) => {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel: channelId,
        thread_ts: threadTs,
        text: text,
      }),
    });

    const data = (await res.json()) as SlackPostMessageResponse;

    if (!data.ok) {
      throw new Error('Failed to post message');
    }

    return data;
  };

  // https://api.slack.com/methods/chat.update
  const updateMessage = async (channelId: string, ts: string, text: string) => {
    const res = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel: channelId,
        ts: ts,
        text: text,
      }),
    });

    const data = (await res.json()) as SlackUpdateMessageResponse;

    if (!data.ok) {
      throw new Error('Failed to update message');
    }

    return data;
  };

  return {
    validateSignature,
    isValidRequest,
    fetchReplies,
    postMessage,
    updateMessage,
  };
};
