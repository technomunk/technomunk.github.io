import { z, defineCollection } from 'astro:content';

const ASSIGNMENT_COLLECTION = defineCollection({
	type: 'data',
	schema: z.object({
		title: z.string(),
		employer: z.string(),
		description: z.string(),
		startDate: z.date(),
		endDate: z.date(),
		technologies: z.array(z.string()),
	}),
});

const PROJECT_COLLECTION = defineCollection({
	type: 'data',
	schema: z.object({
		name: z.string(),
		description: z.string(),
		goals: z.string(),
		technologies: z.array(z.string()),
	}),
});

const TECHNOLOGY_COLLECTION = defineCollection({
	type: 'data',
	schema: z.object({
		display: z.string(),
		hint: z.string(),
		type: z.string(),
	}),
});

export const COLLECTIONS = {
	assignments: ASSIGNMENT_COLLECTION,
	projects: PROJECT_COLLECTION,
	technologies: TECHNOLOGY_COLLECTION,
};
