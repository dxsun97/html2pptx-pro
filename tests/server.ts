/* eslint-disable */
import express from 'express';
import yargs from 'yargs';
import { Argv, ScreenshotRequest, TestResultRequest } from './types';
import cors from 'cors';
import path from 'path';
import serveIndex from 'serve-index';
import fs from 'fs';
import bodyParser from 'body-parser';
import mkdirp from 'mkdirp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const proxy = require('./proxy.cjs');
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express();
app.use('/', serveIndex(path.resolve(__dirname, '../'), { icons: true }));
app.use([/^\/src($|\/)/, '/'], express.static(path.resolve(__dirname, '../')));

// Add route to handle redirect-image test case
app.get('/redirect-image', (_req, res) => {
    res.redirect('https://yorickshan.github.io/html2pptx-pro/logo.png');
});

export const corsApp = express();
corsApp.use('/proxy', proxy());
corsApp.use('/cors', cors(), express.static(path.resolve(__dirname, '../')));
corsApp.use('/', express.static(path.resolve(__dirname, '.')));

// Add route to handle redirect-image test case in CORS app too
corsApp.get('/redirect-image', (_req, res) => {
    res.redirect('https://yorickshan.github.io/html2pptx-pro/logo.png');
});

export const screenshotApp = express();
screenshotApp.use(cors());
screenshotApp.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    if (typeof req.headers['content-type'] === 'undefined') {
        req.headers['content-type'] = 'application/json';
    }
    next();
});
screenshotApp.use(
    bodyParser.json({
        limit: '15mb',
        type: '*/*'
    })
);

const resultFolder = '../tmp/reftests';
const metadataFolder = '../tmp/reftests/metadata';

mkdirp.sync(path.resolve(__dirname, resultFolder));
mkdirp.sync(path.resolve(__dirname, metadataFolder));

const makeFilename = async (testUrl: string, platformName: string, platformVersion: string) => {
    const { default: filenamifyUrl } = await import('filenamify-url');

    return `${filenamifyUrl(testUrl.replace(/^\/tests\/reftests\//, '').replace(/\.html$/, ''), {
        replacement: '-'
    })}!${[process.env.TARGET_BROWSER, platformName, platformVersion].join('-')}`;
};

// Legacy screenshot endpoint (kept for backward compatibility)
const prefix = 'data:image/png;base64,';

screenshotApp.post(
    '/screenshot',
    (req: express.Request<Record<string, never>, void, ScreenshotRequest>, res: express.Response) => {
        if (!req.body || !req.body.screenshot) {
            return res.sendStatus(400);
        }

        const buffer = Buffer.from(req.body.screenshot.substring(prefix.length), 'base64');
        makeFilename(req.body.test, req.body.platform.name, req.body.platform.version).then((filename) => {
            fs.writeFileSync(path.resolve(__dirname, resultFolder, `${filename}.png`), buffer as Uint8Array);
            fs.writeFileSync(
                path.resolve(__dirname, metadataFolder, `${filename}.json`),
                JSON.stringify({
                    windowWidth: req.body.windowWidth,
                    windowHeight: req.body.windowHeight,
                    platform: req.body.platform,
                    devicePixelRatio: req.body.devicePixelRatio,
                    test: req.body.test,
                    id: process.env.TARGET_BROWSER,
                    screenshot: filename
                })
            );
            return res.sendStatus(200);
        });
    }
);

// PPTX result endpoint
screenshotApp.post(
    '/pptx-result',
    (req: express.Request<Record<string, never>, void, TestResultRequest>, res: express.Response) => {
        if (!req.body || !req.body.pptxBase64) {
            return res.sendStatus(400);
        }

        const buffer = Buffer.from(req.body.pptxBase64, 'base64');
        makeFilename(req.body.test, req.body.platform.name, req.body.platform.version).then((filename) => {
            fs.writeFileSync(path.resolve(__dirname, resultFolder, `${filename}.pptx`), buffer as Uint8Array);
            fs.writeFileSync(
                path.resolve(__dirname, metadataFolder, `${filename}.json`),
                JSON.stringify({
                    windowWidth: req.body.windowWidth,
                    windowHeight: req.body.windowHeight,
                    platform: req.body.platform,
                    slideCount: req.body.slideCount,
                    test: req.body.test,
                    id: process.env.TARGET_BROWSER
                })
            );
            return res.sendStatus(200);
        });
    }
);

screenshotApp.use((error: Error, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
    console.error(error);
    next();
});

const args = yargs(process.argv.slice(2)).number(['port', 'cors']).argv as Argv;

if (args.port) {
    app.listen(args.port, () => {
        console.log(`Server running on port ${args.port}`);
    });
}

if (args.cors) {
    corsApp.listen(args.cors, () => {
        console.log(`CORS server running on port ${args.cors}`);
    });
}
