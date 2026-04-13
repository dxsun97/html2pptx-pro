var h2cSelector, h2cOptions;
var CI = window.location.search.indexOf('selenium') !== -1;
var AUTORUN = window.location.search.indexOf('run=false') === -1;
var REFTEST = window.location.search.indexOf('reftest') !== -1;

(function(document, window) {
    function appendScript(src) {
        document.write(
            '<script type="text/javascript" src="' +
                window.location.protocol +
                '//' +
                window.location.host +
                src +
                '.js?' +
                Math.random() +
                '"></script>'
        );
    }

    ['/dist/html2pptx-pro'].forEach(appendScript);

    window.addEventListener('unhandledrejection', function(event) {
        console.info('UNHANDLED PROMISE REJECTION:', event);
    });

    window.onload = function() {
        var element =
            typeof h2cSelector !== 'undefined' && h2cSelector
                ? (Array.isArray(h2cSelector)
                    ? h2cSelector[0]
                    : h2cSelector)
                : document.documentElement;

        var options = Object.assign(
            {
                logging: true,
                proxy: 'http://localhost:8081/proxy',
                removeContainer: true
            },
            h2cOptions || {},
            REFTEST ? { windowWidth: 800, windowHeight: 600 } : {}
        );

        window.run = function() {
            html2pptx(element, options)
                .then(function(pptx) {
                    window.__pptxResult = pptx;

                    if (!CI) {
                        var slides = pptx.slides || [];
                        showMessage('PPTX generated: ' + slides.length + ' slide(s)');
                    }
                })
                ['catch'](function(err) {
                    window.__pptxError = err;
                    console.error('html2pptx threw an error', err);

                    if (!CI) {
                        showMessage('Error: ' + (err.message || err), 8000);
                    }
                });
        };

        if (typeof dontRun === 'undefined' && AUTORUN) {
            setTimeout(window.run, 100);
        }
    };

    function showMessage(msg, duration) {
        var el = document.createElement('div');
        el.textContent = msg;
        el.style.cssText =
            'margin:0;padding:10px;background:#000;opacity:0.7;position:fixed;' +
            'top:10px;right:10px;font-family:Tahoma;color:#fff;font-size:12px;' +
            'border-radius:12px;z-index:999999';
        document.body.appendChild(el);
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, duration || 3000);
    }
})(document, window);
