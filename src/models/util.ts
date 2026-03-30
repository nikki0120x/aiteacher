import type { z } from "zod";

export const withDefault = <T extends z.ZodTypeAny>(
	schema: T,
	defaultFactory: () => z.infer<T>,
) => {
	return Object.assign(schema, {
		createDefault: defaultFactory,
	});
};

export const asZodEnum = <T extends Record<string, unknown>>(
	obj: T,
): [keyof T, ...Array<keyof T>] => {
	return Object.keys(obj) as [keyof T, ...Array<keyof T>];
};

export const gen = {
	id: () => crypto.randomUUID(),
	now: () => Date.now(),
} as const;
