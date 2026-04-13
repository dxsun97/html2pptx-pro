import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                'html2pptx-pro': path.resolve(__dirname, '../../src/index.ts')
            }
        },
        ssr: {
            noExternal: ['lz-string']
        }
    },
    title: 'html2pptx-pro',
    base: '/html2pptx-pro/',
    description: 'Convert HTML to PowerPoint presentations',
    head: [['link', { rel: 'icon', href: '/html2pptx-pro/favicon.ico' }]],
    locales: {
        root: {
            label: 'English',
            lang: 'en'
        },
        zh: {
            label: '简体中文',
            lang: 'zh-CN',
            description: '将 HTML 转换为 PowerPoint 演示文稿',
            themeConfig: {
                nav: [
                    { text: '首页', link: '/zh/' },
                    { text: '指南', link: '/zh/getting-started' },
                    { text: '演练场', link: '/zh/playground' }
                ],
                sidebar: [
                    {
                        text: '指南',
                        items: [
                            { text: '关于', link: '/zh/about' },
                            { text: '快速开始', link: '/zh/getting-started' },
                            { text: '配置', link: '/zh/configuration' },
                            { text: '功能特性', link: '/zh/features' },
                            { text: '示例', link: '/zh/examples' },
                            { text: '常见问题', link: '/zh/faq' }
                        ]
                    }
                ]
            }
        }
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/getting-started' },
            { text: 'Playground', link: '/playground' }
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'About', link: '/about' },
                    { text: 'Getting Started', link: '/getting-started' },
                    { text: 'Configuration', link: '/configuration' },
                    { text: 'Features', link: '/features' },
                    { text: 'Examples', link: '/examples' },
                    { text: 'FAQ', link: '/faq' }
                ]
            }
        ],

        socialLinks: [{ icon: 'github', link: 'https://github.com/dxsun97/html2pptx-pro' }],

        logo: '/logo.png'
    }
})
