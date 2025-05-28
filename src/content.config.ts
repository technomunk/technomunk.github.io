import { z, defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';

const skills = defineCollection({
	loader: file('content/skills.json', {
		parser: (text) => {
			const result = JSON.parse(text);
			// biome-ignore lint/performance/noDelete: we just loaded a json
			delete result.$schema; // Remove the $schema property if it exists
			return result;
		},
	}),
	schema: z.object({
		display: z.string(),
		hint: z.string(),
		type: z.string(),
	}),
});

const assignments = defineCollection({
	loader: glob({ pattern: '*.json', base: 'content/assignments' }),
	schema: z.object({
		title: z.string(),
		employer: z.string(),
		description: z.string(),
		startDate: z.string(),
		endDate: z.string(),
		skills: z.array(z.string()),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '*.json', base: 'content/projects' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		aspiration: z.string(),
		skills: z.array(z.string()),
		lastActivity: z.string(),
		status: z.string(),
	}),
});

export const collections = {
	assignments,
	projects,
	skills,
};
