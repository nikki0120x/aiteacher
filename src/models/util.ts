import type { z } from "zod";

// 	デフォルト値付帯
export const withDefault = <T extends z.ZodTypeAny>(
	schema: T,
	defaultFactory: () => z.infer<T>,
) => {
	return Object.assign(schema, {
		createDefault: defaultFactory,
	});
};

// 	Zod Enum用の型付配列を生成
export const asZodEnum = <T extends Record<string, unknown>>(
	obj: T,
): [keyof T, ...Array<keyof T>] => {
	return Object.keys(obj) as [keyof T, ...Array<keyof T>];
};

// 	生成論理
export const gen = {
	id: () => crypto.randomUUID(),
	now: () => Date.now(),
} as const;
