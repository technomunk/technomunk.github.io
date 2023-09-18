import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

import remarkHighlight from './src/plugins/remark/highlight';

// https://astro.build/config
export default defineConfig({
    markdown: {
        syntaxHighlight: false,
        remarkPlugins: [remarkHighlight],
    },
    integrations: [mdx()],
    site: 'https://www.technomunk.com',
    output: 'static',
})
