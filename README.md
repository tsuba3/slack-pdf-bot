# slack-pdf-bot

![demo.gif](https://raw.githubusercontent.com/tsuba3/slack-pdf-bot/master/demo.gif)

Slack にアップロードされたファイルを、PDFに変換・圧縮して返信する Slack App

```
SLACK_SIGNING_SECRET=your-secret \
SLACK_OAUTH_TOKEN=your-token \
SLACK_BOT_TOKEN=your-bot-token \
CLOUD_CONVERT_KEY=your-api-key \
PORT=3000 \
node index.js
```

[Hello World, Bolt! ⚡️ Bolt フレームワークを使って Slack Bot を作ろう](https://qiita.com/girlie_mac/items/93538f9a69eb4015f951)
[Cloud convert](https://cloudconvert.com/anything-to-pdf)
