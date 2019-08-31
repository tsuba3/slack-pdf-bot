const cp = require('child_process');
const fs = require('fs');
const http = require('http');
const request = require('request');
const stream = require('stream');
const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const clientRead = new WebClient(process.env.SLACK_OAUTH_TOKEN);
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

const cloudconvert = new (require('cloudconvert'))(process.env.CLOUD_CONVERT_KEY);
const documentExts = [
    "doc", "docm", "docx", "md", "odt",
    "pages", "rtf", "tex",
    "eps", "pps", "ppt", "pptm", "pptx",
    "key", "csv", "numbers",
    "xls", "xlsm", "xlsx",
];

app.event('app_mention', async({event, context}) => {
    console.log(event);
    console.log(context);
    processMessage(event, event.channel, event.ts, event.user);
    if (!event.files && event.thread_ts) {
        console.log("Retriving a message");
        const res = await clientRead.channels.history({
            channel: event.channel,
            count: 1,
            latest: event.thread_ts,
            inclusive: true
        });
        console.log(res);
        processMessage(res.messages[0], event.channel, event.thread_ts, event.user);
    };
});

(async () => {
  await app.start(process.env.PORT || 3000);
})();

const processMessage = async (event, channel, ts, user) => {
    if (event.files) client.chat.postEphemeral({
        user,
        channel,
        text: "PDF化・圧縮中",
    });
    for (var i = 0; event.files && i < event.files.length; ++i) {
        const url = event.files[i].url_private_download;
        const ext = url.split('.').pop();
        if (ext == "pdf") {
            recievePDF(url, channel, ts);
        } else {
            recieveDocument(url, channel, ts);
        }
    }
};

const recievePDF = async (url, channel, ts) => {
    compressed = compressPDF(request.get({
        url,
        headers: {Authorization: "Bearer " + process.env.SLACK_BOT_TOKEN}
    }));

    await upload(compressed, channel, ts, "compressed-" + url.split('/').pop());
};

const recieveDocument = async (url, channel, ts) => {
    converted = request.get({
        url,
        headers: {Authorization: "Bearer " + process.env.SLACK_BOT_TOKEN}
    }).pipe(new stream.PassThrough)
    .pipe(cloudconvert.convert({
        inputformat: url.split(".").pop(),
        outputformat: "pdf"
    })).pipe(new stream.PassThrough());

    await upload(converted, channel, ts, url.split("/").pop() + ".pdf");
};

const upload = async (input, channel, ts, filename) => {
    await client.files.upload({
        filename,
        channels: channel,
        thread_ts: ts,
        file: input,
    });
    console.log('File uploaded');
};

const compressPDF = (input) => {
    const ws = new stream.PassThrough();
    const filePrefix = '/tmp/slack-pdf-' + Math.random().toString(16).substr(2, 10);
    const inputFile = filePrefix + '.pdf';
    const outputFile = filePrefix + '.min.pdf';
    const inputFileStream = fs.createWriteStream(inputFile);
    input.on('end', () => {
        inputFileStream.close();
        console.log("Compressing PDF");
        cp.exec('gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.6 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="' + outputFile + '" "' + inputFile + '"', () => {
            console.log("Write compressed PDF");
            fs.createReadStream(outputFile).pipe(ws);
        });
    }).pipe(inputFileStream);
    return ws.on('end', () => {
        fs.unlink(inputFile, () => {});
        fs.unlink(outputFile, () => {});
    });
};

module.exports = {compressPDF};

