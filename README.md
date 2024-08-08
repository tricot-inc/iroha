# IROHA

Skackのチャットボットです

# SlackBot with OpenAI on Cloudflare Workers

This repository contains a SlackBot built on Cloudflare Workers that leverages OpenAI to answer questions when mentioned.

## Features

- Serverless: Powered by Cloudflare Workers, ensuring high availability and scalability with minimal infrastructure management.
- AI-Powered Responses: Uses OpenAI to generate intelligent, context-aware responses to your questions.
- Slack Integration: Responds to mentions in Slack channels, making it easy to interact with the bot in your workspace.

## How It Works

1. Mention the Bot: Simply mention the bot in any Slack channel with your question.
2. OpenAI Integration: The bot processes your message and sends it to OpenAI’s API for a response.
3. Reply: The bot returns the generated response directly in the Slack channel.

## Setup

### Prerequisites

•	A [Cloudflare Workers](https://workers.cloudflare.com/) account.
•	A [Slack](https://slack.com/) workspace with API credentials.
•	An [OpenAI](https://openai.com/) API key.


### Installation

1. Clone the Repository:

2. Install Dependencies:
```bash
bun i
```
3. Set Up Environment Variables:
-	Create a .dev.vars file in the root directory with the following keys:

- local
```bash
cp .dev.vars.example .dev.vars
vim .dev.vars
```

- Cloudflare Workers
```
OPENAI_API_KEY: sk-proj-X_XXXXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL: gpt-4o-mini
OPENAI_PROMPT: あなたは優秀なSlackBotです。
OPENAI_MAX_REFER_MESSAGES: 8
SLACK_TOKEN: xoxb-XXXXXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX
SLACK_SIGNING_SECRET: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SLACK_APP_TOKEN: xapp-X-XXXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SLACK_BOT_ID: XXXXXXXXXXX
SLACK_TEMP_MESSAGE: ...
SLACK_BOT_ERROR_MESSAGE: エラーが発生しました。
```
4. Development
```bash
ngrok http http://localhost:8080
```

5. Deploy to Cloudflare Workers:
```bash
bun run deploy
```

## Usage

After deployment, invite the bot to a Slack channel. You can mention the bot using @YourBotName followed by your question, and the bot will respond with an answer generated by OpenAI.

### Example

> @YourBotName What is the capital of France?

Response:
> The capital of France is Paris! It's known for its beautiful architecture, rich history, and delicious food. Have you ever been there or is it on your travel list?

### Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue if you have any suggestions or improvements.

### License

This project is licensed under the MIT License. See the LICENSE file for details.

This template provides a comprehensive overview of your SlackBot project, making it easy for others to understand and contribute.

