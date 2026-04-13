import DefaultTheme from 'vitepress/theme';
import type { App } from 'vue';
import type { Router } from 'vitepress';
import './tailwind.css';

import SlidePreview from './components/SlidePreview.vue';
import SlideSection from './components/SlideSection.vue';
import DemoControls from './components/DemoControls.vue';
import PlaygroundEditor from './components/PlaygroundEditor.vue';

const LANG_STORAGE_KEY = 'html2pptx-preferred-lang';

function setupLanguageRedirect(router: Router) {
    if (typeof window === 'undefined') return;

    let checked = false;

    router.onAfterRouteChange = async (to: string) => {
        if (checked) return;
        checked = true;

        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        if (saved) return;

        const langs = navigator.languages ?? [navigator.language];
        const isZh = langs.some((l) => l.startsWith('zh'));
        localStorage.setItem(LANG_STORAGE_KEY, isZh ? 'zh' : 'en');

        if (isZh) {
            const path = window.location.pathname;
            const base = import.meta.env.BASE_URL || '/';
            if (path.startsWith(base) && !path.startsWith(base + 'zh/') && path !== base + 'zh') {
                const zhPath = path.replace(base, base + 'zh/');
                await router.go(zhPath);
            }
        }
    };
}

export default {
    extends: DefaultTheme,
    enhanceApp({ app, router }: { app: App; router: Router }) {
        app.component('SlidePreview', SlidePreview);
        app.component('SlideSection', SlideSection);
        app.component('DemoControls', DemoControls);
        app.component('PlaygroundEditor', PlaygroundEditor);

        setupLanguageRedirect(router);
    }
};
