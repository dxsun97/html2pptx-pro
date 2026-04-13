import {testList, ignoredTests} from '../build/reftests.js';
// @ts-ignore
import {default as platform} from 'platform';
import {TestResultRequest} from './types';

const testRunnerUrl = location.href;
const hasHistoryApi = typeof window.history !== 'undefined' && typeof window.history.replaceState !== 'undefined';

interface PptxResult {
    slides: unknown[];
    write: (opts: {outputType: string}) => Promise<unknown>;
}

interface TestWindow extends Window {
    __pptxResult?: PptxResult;
    __pptxError?: Error;
    __karma__?: unknown;
}

const waitForResult = (contentWindow: TestWindow, timeoutMs = 30000): Promise<PptxResult> => {
    return new Promise((resolve, reject) => {
        const interval = 100;
        let elapsed = 0;

        const check = () => {
            if (contentWindow.__pptxError) {
                reject(contentWindow.__pptxError);
                return;
            }
            if (contentWindow.__pptxResult) {
                resolve(contentWindow.__pptxResult);
                return;
            }
            elapsed += interval;
            if (elapsed >= timeoutMs) {
                reject(new Error(`Timed out waiting for PPTX result after ${timeoutMs}ms`));
                return;
            }
            setTimeout(check, interval);
        };

        check();
    });
};

const uploadResults = (pptx: PptxResult, url: string): Promise<void> => {
    return pptx.write({outputType: 'base64'}).then((base64Data) => {
        return new (window as Window & {Promise: PromiseConstructor}).Promise(
            (resolve: () => void, reject: (error: string) => void) => {
                // @ts-ignore
                const xhr = new XMLHttpRequest();

                xhr.onload = () => {
                    if (typeof xhr.status !== 'number' || xhr.status === 200) {
                        resolve();
                    } else {
                        reject(`Failed to send PPTX result with status ${xhr.status}`);
                    }
                };
                xhr.onerror = () => reject('Network error');

                const request: TestResultRequest = {
                    pptxBase64: base64Data as string,
                    test: url,
                    platform: {
                        name: platform.name || '',
                        version: platform.version || ''
                    },
                    slideCount: (pptx.slides || []).length,
                    windowWidth: window.innerWidth,
                    windowHeight: window.innerHeight
                };

                xhr.open('POST', 'http://localhost:8000/pptx-result', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(request));
            }
        );
    });
};

testList
    .filter((test: string) => {
        return !Array.isArray(ignoredTests[test]) || ignoredTests[test].indexOf(platform.name || '') === -1;
    })
    .forEach((url: string) => {
        describe(url, function (this: Mocha.Suite) {
            this.timeout(60000);
            this.retries(2);
            const windowWidth = 800;
            const windowHeight = 600;
            const testContainer = document.createElement('iframe');
            testContainer.width = windowWidth.toString();
            testContainer.height = windowHeight.toString();
            testContainer.style.visibility = 'hidden';
            testContainer.style.position = 'fixed';
            testContainer.style.left = '10000px';

            before((done) => {
                testContainer.onload = () => done();

                testContainer.src = `${url}?selenium&run=false&reftest&${Math.random()}`;
                if (hasHistoryApi) {
                    try {
                        history.replaceState(null, '', url);
                    } catch (e) {
                        console.error(e);
                    }
                }

                document.body.appendChild(testContainer);
            });

            after(() => {
                if (hasHistoryApi) {
                    try {
                        history.replaceState(null, '', testRunnerUrl);
                    } catch (e) {
                        console.error(e);
                    }
                }
                document.body.removeChild(testContainer);
            });

            it('Should produce a valid PPTX', async () => {
                const contentWindow = testContainer.contentWindow as TestWindow | null;
                if (!contentWindow) {
                    throw new Error('Window not found for iframe');
                }

                contentWindow.addEventListener('unhandledrejection', (event) => {
                    console.error(event.reason);
                    throw new Error(`unhandledrejection: ${JSON.stringify(event.reason)}`);
                });

                // Trigger rendering in the iframe
                if (typeof contentWindow.run === 'function') {
                    (contentWindow as unknown as {run: () => void}).run();
                }

                // Wait for the PPTX result
                const pptx = await waitForResult(contentWindow);

                // Structural checks
                if (!pptx) {
                    throw new Error('PPTX result is falsy');
                }

                const slides = pptx.slides || [];
                if (slides.length < 1) {
                    throw new Error(`Expected at least 1 slide, got ${slides.length}`);
                }

                // Verify PPTX can be serialized
                await pptx.write({outputType: 'arraybuffer'});

                // @ts-ignore
                if (window.__karma__) {
                    return uploadResults(pptx, url);
                }
            });
        });
    });
