import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import glsl from 'vite-plugin-glsl';

import remarkHighlight from './src/plugins/remark/highlight';
import remarkRemoveRunts from './src/plugins/remark/remove-runts';

// https://astro.build/config
export default defineConfig({
	markdown: {
		syntaxHighlight: false,
		remarkPlugins: [remarkHighlight, remarkRemoveRunts],
	},
	integrations: [mdx()],
	site: 'https://www.technomunk.com',
	output: 'static',
	vite: {
		plugins: [glsl()],
	},
});
