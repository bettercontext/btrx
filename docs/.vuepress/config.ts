import { defineUserConfig } from 'vuepress'
import { mdEnhancePlugin } from 'vuepress-plugin-md-enhance'

import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'

export default defineUserConfig({
  lang: 'en-US',
  title: 'Better Context',
  description: 'Structured code context for smarter LLMs',

  head: [['link', { rel: 'icon', href: '/favicon.png' }]],

  theme: defaultTheme({
    logo: '/logo.png',
    logoDark: '/logo-dark.png',

    navbar: [
      {
        text: 'User Guide',
        children: [
          '/user-guide/getting-started.md',
          '/user-guide/ai-integration.md',
          '/user-guide/contexts-and-guidelines.md',
          '/user-guide/guidelines-analysis.md',
          '/user-guide/troubleshooting.md',
        ],
      },
    ],

    sidebar: {
      '/user-guide/': [
        {
          text: 'User Guide',
          children: [
            '/user-guide/getting-started.md',
            '/user-guide/ai-integration.md',
            '/user-guide/contexts-and-guidelines.md',
            '/user-guide/guidelines-analysis.md',
            '/user-guide/troubleshooting.md',
          ],
        },
      ],
    },

    // Page meta
    editLink: true,
    editLinkText: 'Edit this page on GitHub',
    repo: 'bettercontext/btrx',
    repoLabel: 'GitHub',
    docsDir: 'docs',
    docsBranch: 'main',

    // Theme config
    colorMode: 'auto',
    colorModeSwitch: true,

    // Git repository info
    lastUpdated: true,
    lastUpdatedText: 'Last Updated',
    contributors: true,
    contributorsText: 'Contributors',
  }),

  // Build config
  dest: './docs/.vuepress/dist',
  temp: './docs/.vuepress/.temp',
  cache: './docs/.vuepress/.cache',

  // Development config
  port: 8080,
  host: '0.0.0.0',
  open: true,

  plugins: [
    mdEnhancePlugin({
      mermaid: true,
    }),
  ],

  bundler: viteBundler(),
})
