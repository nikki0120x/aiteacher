import { readFile, writeFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import chalk from "chalk";
import { glob } from "glob";

type Category = {
	categoryName: string;
	group: Group[];
};

type Group = {
	name: string;
	prefixes: string[];
};

type CompiledRule = {
	regex: RegExp;
	index: number;
};

const _PRIORITY_GROUPS: Category[] = [
	{
		categoryName: "Layout",
		group: [
			{
				name: "aspect-ratio",
				prefixes: [
					"aspect-<property>",
					"aspect-square",
					"aspect-video",
					"aspect-auto",
					"aspect-(<property>)",
					"aspect-[<property>]",
				],
			},
			{
				name: "columns",
				prefixes: [
					"columns-<property>",
					"columns-3xs",
					"columns-2xs",
					"columns-xs",
					"columns-sm",
					"columns-md",
					"columns-lg",
					"columns-xl",
					"columns-2xl",
					"columns-3xl",
					"columns-4xl",
					"columns-5xl",
					"columns-6xl",
					"columns-7xl",
					"columns-auto",
					"columns-(<property>)",
					"columns-[<property>]",
				],
			},
			{
				name: "break-after",
				prefixes: [
					"break-after-auto",
					"break-after-avoid",
					"break-after-all",
					"break-after-avoid-page",
					"break-after-page",
					"break-after-left",
					"break-after-right",
					"break-after-column",
				],
			},
			{
				name: "break-before",
				prefixes: [
					"break-before-auto",
					"break-before-avoid",
					"break-before-all",
					"break-before-avoid-page",
					"break-before-page",
					"break-before-left",
					"break-before-right",
					"break-before-column",
				],
			},
			{
				name: "break-inside",
				prefixes: [
					"break-inside-auto",
					"break-inside-avoid",
					"break-inside-avoid-page",
					"break-inside-avoid-column",
				],
			},
			{
				name: "box-decoration-break",
				prefixes: ["box-decoration-clone", "box-decoration-slice"],
			},
			{
				name: "box-sizing",
				prefixes: ["box-border", "box-content"],
			},
			{
				name: "display",
				prefixes: [
					"inline",
					"block",
					"inline-block",
					"flow-root",
					"flex",
					"inline-flex",
					"grid",
					"inline-grid",
					"contents",
					"table",
					"inline-table",
					"table-caption",
					"table-cell",
					"table-column",
					"table-column-group",
					"table-footer-group",
					"table-header-group",
					"table-row-group",
					"table-row",
					"list-item",
					"hidden",
					"sr-only",
					"not-sr-only",
				],
			},
			{
				name: "float",
				prefixes: [
					"float-right",
					"float-left",
					"float-start",
					"float-end",
					"float-none",
				],
			},
			{
				name: "clear",
				prefixes: [
					"clear-left",
					"clear-right",
					"clear-both",
					"clear-start",
					"clear-end",
					"clear-none",
				],
			},
			{
				name: "isolation",
				prefixes: ["isolate", "isolation-auto"],
			},
			{
				name: "object-fit",
				prefixes: [
					"object-contain",
					"object-cover",
					"object-fill",
					"object-none",
					"object-scale-down",
				],
			},
			{
				name: "object-position",
				prefixes: [
					"object-top-left",
					"object-top",
					"object-top-right",
					"object-left",
					"object-center",
					"object-right",
					"object-bottom-left",
					"object-bottom",
					"object-bottom-right",
					"object-(<property>)",
					"object-[<property>]",
				],
			},
			{
				name: "overflow",
				prefixes: [
					"overflow-auto",
					"overflow-hidden",
					"overflow-clip",
					"overflow-visible",
					"overflow-scroll",
					"overflow-x-auto",
					"overflow-y-auto",
					"overflow-x-hidden",
					"overflow-y-hidden",
					"overflow-x-clip",
					"overflow-y-clip",
					"overflow-x-visible",
					"overflow-y-visible",
					"overflow-x-scroll",
					"overflow-y-scroll",
				],
			},
			{
				name: "overscroll-behavior",
				prefixes: [
					"overscroll-auto",
					"overscroll-contain",
					"overscroll-none",
					"overscroll-x-auto",
					"overscroll-x-contain",
					"overscroll-x-none",
					"overscroll-y-auto",
					"overscroll-y-contain",
					"overscroll-y-none",
				],
			},
			{
				name: "position",
				prefixes: ["static", "fixed", "absolute", "relative", "sticky"],
			},
			{
				name: "top / right / bottom / left",
				prefixes: [
					"inset-<property>",
					"-inset-<property>",
					"inset-px",
					"-inset-px",
					"inset-full",
					"-inset-full",
					"inset-auto",
					"inset-(<property>)",
					"inset-[<property>]",
					"inset-x-<property>",
					"-inset-x-<property>",
					"inset-x-px",
					"-inset-x-px",
					"inset-x-full",
					"-inset-x-full",
					"inset-x-auto",
					"inset-x-(<property>)",
					"inset-x-[<property>]",
					"inset-y-<property>",
					"-inset-y-<property>",
					"inset-y-px",
					"-inset-y-px",
					"inset-y-full",
					"-inset-y-full",
					"inset-y-auto",
					"inset-y-(<property>)",
					"inset-y-[<property>]",
					"start-<property>",
					"-start-<property>",
					"start-px",
					"-start-px",
					"start-full",
					"-start-full",
					"start-auto",
					"start-(<property>)",
					"start-[<property>]",
					"end-<property>",
					"-end-<property>",
					"end-px",
					"-end-px",
					"end-full",
					"-end-full",
					"end-auto",
					"end-(<property>)",
					"end-[<property>]",
					"top-<property>",
					"-top-<property>",
					"top-px",
					"-top-px",
					"top-full",
					"-top-full",
					"top-auto",
					"top-(<property>)",
					"top-[<property>]",
					"right-<property>",
					"-right-<property>",
					"right-px",
					"-right-px",
					"right-full",
					"-right-full",
					"right-auto",
					"right-(<property>)",
					"right-[<property>]",
					"bottom-<property>",
					"-bottom-<property>",
					"bottom-px",
					"-bottom-px",
					"bottom-full",
					"-bottom-full",
					"bottom-auto",
					"bottom-(<property>)",
					"bottom-[<property>]",
					"left-<property>",
					"-left-<property>",
					"left-px",
					"-left-px",
					"left-full",
					"-left-full",
					"left-auto",
					"left-(<property>)",
					"left-[<property>]",
				],
			},
			{
				name: "visibility",
				prefixes: ["visible", "invisible", "collapse"],
			},
			{
				name: "z-index",
				prefixes: [
					"z-<property>",
					"z-auto",
					"z-[<property>]",
					"z-(<property>)",
				],
			},
		],
	},
	{
		categoryName: "Flexbox & Grid",
		group: [
			{
				name: "flex-basis",
				prefixes: [
					"basis-<property>",
					"basis-full",
					"basis-auto",
					"basis-3xs",
					"basis-2xs",
					"basis-xs",
					"basis-sm",
					"basis-md",
					"basis-lg",
					"basis-xl",
					"basis-2xl",
					"basis-3xl",
					"basis-4xl",
					"basis-5xl",
					"basis-6xl",
					"basis-7xl",
					"basis-(<property>)",
					"basis-[<property>]",
				],
			},
			{
				name: "flex-direction",
				prefixes: [
					"flex-row",
					"flex-row-reverse",
					"flex-col",
					"flex-col-reverse",
				],
			},
			{
				name: "flex-wrap",
				prefixes: ["flex-nowrap", "flex-wrap", "flex-wrap-reverse"],
			},
			{
				name: "flex",
				prefixes: [
					"flex-<property>",
					"flex-auto",
					"flex-initial",
					"flex-none",
					"flex-(<property>)",
					"flex-[<property>]",
				],
			},
			{
				name: "flex-grow",
				prefixes: [
					"grow",
					"grow-<property>",
					"grow-[<property>]",
					"grow-(<property>)",
				],
			},
			{
				name: "flex-shrink",
				prefixes: [
					"shrink",
					"shrink-<property>",
					"shrink-[<property>]",
					"shrink-(<property>)",
				],
			},
			{
				name: "order",
				prefixes: [
					"order-<property>",
					"-order-<property>",
					"order-first",
					"order-last",
					"order-none",
					"order-(<property>)",
					"order-[<property>]",
				],
			},
			{
				name: "grid-template-columns",
				prefixes: [
					"grid-cols-<property>",
					"grid-cols-none",
					"grid-cols-subgrid",
					"grid-cols-[<property>]",
					"grid-cols-(<property>)",
				],
			},
			{
				name: "grid-column",
				prefixes: [
					"col-span-<property>",
					"col-span-full",
					"col-span-(<property>)",
					"col-span-[<property>]",
					"col-start-<property>",
					"-col-start-<property>",
					"col-start-auto",
					"col-start-(<property>)",
					"col-start-[<property>]",
					"col-end-<property>",
					"-col-end-<property>",
					"col-end-auto",
					"col-end-(<property>)",
					"col-end-[<property>]",
					"col-auto",
					"col-<property>",
					"-col-<property>",
					"col-(<property>)",
					"col-[<property>]",
				],
			},
			{
				name: "grid-template-rows",
				prefixes: [
					"grid-rows-<property>",
					"grid-rows-none",
					"grid-rows-subgrid",
					"grid-rows-[<property>]",
					"grid-rows-(<property>)",
				],
			},
			{
				name: "grid-row",
				prefixes: [
					"row-span-<property>",
					"row-span-full",
					"row-span-(<property>)",
					"row-span-[<property>]",
					"row-start-<property>",
					"-row-start-<property>",
					"row-start-auto",
					"row-start-(<property>)",
					"row-start-[<property>]",
					"row-end-<property>",
					"-row-end-<property>",
					"row-end-auto",
					"row-end-(<property>)",
					"row-end-[<property>]",
					"row-auto",
					"row-<property>",
					"-row-<property>",
					"row-(<property>)",
					"row-[<property>]",
				],
			},
			{
				name: "grid-auto-flow",
				prefixes: [
					"grid-flow-row",
					"grid-flow-col",
					"grid-flow-dense",
					"grid-flow-row-dense",
					"grid-flow-col-dense",
				],
			},
			{
				name: "grid-auto-columns",
				prefixes: [
					"auto-cols-auto",
					"auto-cols-min",
					"auto-cols-max",
					"auto-cols-fr",
					"auto-cols-(<property>)",
					"auto-cols-[<property>]",
				],
			},
			{
				name: "grid-auto-rows",
				prefixes: [
					"auto-rows-auto",
					"auto-rows-min",
					"auto-rows-max",
					"auto-rows-fr",
					"auto-rows-(<property>)",
					"auto-rows-[<property>]",
				],
			},
			{
				name: "gap",
				prefixes: [
					"gap-<property>",
					"gap-(<property>)",
					"gap-[<property>]",
					"gap-x-<property>",
					"gap-x-(<property>)",
					"gap-x-[<property>]",
					"gap-y-<property>",
					"gap-y-(<property>)",
					"gap-y-[<property>]",
				],
			},
			{
				name: "justify-content",
				prefixes: [
					"justify-start",
					"justify-end",
					"justify-end-safe",
					"justify-center",
					"justify-center-safe",
					"justify-between",
					"justify-around",
					"justify-evenly",
					"justify-stretch",
					"justify-baseline",
					"justify-normal",
				],
			},
			{
				name: "justify-items",
				prefixes: [
					"justify-items-start",
					"justify-items-end",
					"justify-items-end-safe",
					"justify-items-center",
					"justify-items-center-safe",
					"justify-items-stretch",
					"justify-items-normal",
				],
			},
			{
				name: "justify-self",
				prefixes: [
					"justify-self-auto",
					"justify-self-start",
					"justify-self-center",
					"justify-self-center-safe",
					"justify-self-end",
					"justify-self-end-safe",
					"justify-self-stretch",
				],
			},
			{
				name: "align-content",
				prefixes: [
					"content-normal",
					"content-center",
					"content-start",
					"content-end",
					"content-between",
					"content-around",
					"content-evenly",
					"content-baseline",
					"content-stretch",
				],
			},
			{
				name: "align-items",
				prefixes: [
					"items-start",
					"items-end",
					"items-end-safe",
					"items-center",
					"items-center-safe",
					"items-baseline",
					"items-baseline-last",
					"items-stretch",
				],
			},
			{
				name: "align-self",
				prefixes: [
					"self-auto",
					"self-start",
					"self-end",
					"self-end-safe",
					"self-center",
					"self-center-safe",
					"self-stretch",
					"self-baseline",
					"self-baseline-last",
				],
			},
			{
				name: "place-content",
				prefixes: [
					"place-content-center",
					"place-content-center-safe",
					"place-content-start",
					"place-content-end",
					"place-content-end-safe",
					"place-content-between",
					"place-content-around",
					"place-content-evenly",
					"place-content-baseline",
					"place-content-stretch",
				],
			},
			{
				name: "place-items",
				prefixes: [
					"place-items-start",
					"place-items-end",
					"place-items-end-safe",
					"place-items-center",
					"place-items-center-safe",
					"place-items-baseline",
					"place-items-stretch",
				],
			},
			{
				name: "place-self",
				prefixes: [
					"place-self-auto",
					"place-self-start",
					"place-self-end",
					"place-self-end-safe",
					"place-self-center",
					"place-self-center-safe",
					"place-self-stretch",
				],
			},
		],
	},
	{
		categoryName: "Spacing",
		group: [
			{
				name: "padding",
				prefixes: [
					"p-<property>",
					"p-px",
					"p-(<property>)",
					"p-[<property>]",
					"px-<property>",
					"px-px",
					"px-(<property>)",
					"px-[<property>]",
					"py-<property>",
					"py-px",
					"py-(<property>)",
					"py-[<property>]",
					"ps-<property>",
					"ps-px",
					"ps-(<property>)",
					"ps-[<property>]",
					"pe-<property>",
					"pe-px",
					"pe-(<property>)",
					"pe-[<property>]",
					"pt-<property>",
					"pt-px",
					"pt-(<property>)",
					"pt-[<property>]",
					"pr-<property>",
					"pr-px",
					"pr-(<property>)",
					"pr-[<property>]",
					"pb-<property>",
					"pb-px",
					"pb-(<property>)",
					"pb-[<property>]",
					"pl-<property>",
					"pl-px",
					"pl-(<property>)",
					"pl-[<property>]",
				],
			},
			{
				name: "margin",
				prefixes: [
					"m-<property>",
					"-m-<property>",
					"m-auto",
					"m-px",
					"-m-px",
					"m-(<property>)",
					"m-[<property>]",
					"mx-<property>",
					"-mx-<property>",
					"mx-auto",
					"mx-px",
					"-mx-px",
					"mx-(<property>)",
					"mx-[<property>]",
					"my-<property>",
					"-my-<property>",
					"my-auto",
					"my-px",
					"-my-px",
					"my-(<property>)",
					"my-[<property>]",
					"ms-<property>",
					"-ms-<property>",
					"ms-auto",
					"ms-px",
					"-ms-px",
					"ms-(<property>)",
					"ms-[<property>]",
					"me-<property>",
					"-me-<property>",
					"me-auto",
					"me-px",
					"-me-px",
					"me-(<property>)",
					"me-[<property>]",
					"mt-<property>",
					"-mt-<property>",
					"mt-auto",
					"mt-px",
					"-mt-px",
					"mt-(<property>)",
					"mt-[<property>]",
					"mr-<property>",
					"-mr-<property>",
					"mr-auto",
					"mr-px",
					"-mr-px",
					"mr-(<property>)",
					"mr-[<property>]",
					"mb-<property>",
					"-mb-<property>",
					"mb-auto",
					"mb-px",
					"-mb-px",
					"mb-(<property>)",
					"mb-[<property>]",
					"ml-<property>",
					"-ml-<property>",
					"ml-auto",
					"ml-px",
					"-ml-px",
					"ml-(<property>)",
					"ml-[<property>]",
					"space-x-<property>",
					"-space-x-<property>",
					"space-x-px",
					"-space-x-px",
					"space-x-(<property>)",
					"space-x-[<property>]",
					"space-y-<property>",
					"-space-y-<property>",
					"space-y-px",
					"-space-y-px",
					"space-y-(<property>)",
					"space-y-[<property>]",
					"space-x-reverse",
					"space-y-reverse",
				],
			},
		],
	},
	{
		categoryName: "Sizing",
		group: [
			{
				name: "size",
				prefixes: [
					"size-<property>",
					"size-auto",
					"size-px",
					"size-full",
					"size-dvw",
					"size-dvh",
					"size-lvw",
					"size-lvh",
					"size-svw",
					"size-svh",
					"size-min",
					"size-max",
					"size-fit",
					"size-(<property>)",
					"size-[<property>]",
				],
			},
			{
				name: "width",
				prefixes: [
					"w-<property>",
					"w-3xs",
					"w-2xs",
					"w-xs",
					"w-sm",
					"w-md",
					"w-lg",
					"w-xl",
					"w-2xl",
					"w-3xl",
					"w-4xl",
					"w-5xl",
					"w-6xl",
					"w-7xl",
					"w-auto",
					"w-px",
					"w-full",
					"w-screen",
					"w-dvw",
					"w-dvh",
					"w-lvw",
					"w-lvh",
					"w-svw",
					"w-svh",
					"w-min",
					"w-max",
					"w-fit",
					"w-(<property>)",
					"w-[<property>]",
				],
			},
			{
				name: "min-width",
				prefixes: [
					"min-w-<property>",
					"min-w-3xs",
					"min-w-2xs",
					"min-w-xs",
					"min-w-sm",
					"min-w-md",
					"min-w-lg",
					"min-w-xl",
					"min-w-2xl",
					"min-w-3xl",
					"min-w-4xl",
					"min-w-5xl",
					"min-w-6xl",
					"min-w-7xl",
					"min-w-auto",
					"min-w-px",
					"min-w-full",
					"min-w-screen",
					"min-w-dvw",
					"min-w-dvh",
					"min-w-lvw",
					"min-w-lvh",
					"min-w-svw",
					"min-w-svh",
					"min-w-min",
					"min-w-max",
					"min-w-fit",
					"min-w-(<property>)",
					"min-w-[<property>]",
				],
			},
			{
				name: "max-width",
				prefixes: [
					"max-w-<property>",
					"max-w-3xs",
					"max-w-2xs",
					"max-w-xs",
					"max-w-sm",
					"max-w-md",
					"max-w-lg",
					"max-w-xl",
					"max-w-2xl",
					"max-w-3xl",
					"max-w-4xl",
					"max-w-5xl",
					"max-w-6xl",
					"max-w-7xl",
					"max-w-none",
					"max-w-px",
					"max-w-full",
					"max-w-dvw",
					"max-w-dvh",
					"max-w-lvw",
					"max-w-lvh",
					"max-w-svw",
					"max-w-svh",
					"max-w-screen",
					"max-w-min",
					"max-w-max",
					"max-w-fit",
					"container",
					"max-w-(<property>)",
					"max-w-[<property>]",
				],
			},
			{
				name: "height",
				prefixes: [
					"h-<property>",
					"h-auto",
					"h-px",
					"h-full",
					"h-screen",
					"h-dvh",
					"h-dvw",
					"h-lvh",
					"h-lvw",
					"h-svh",
					"h-svw",
					"h-min",
					"h-max",
					"h-fit",
					"h-lh",
					"h-(<property>)",
					"h-[<property>]",
				],
			},
			{
				name: "min-height",
				prefixes: [
					"min-h-<property>",
					"min-h-px",
					"min-h-full",
					"min-h-screen",
					"min-h-dvh",
					"min-h-dvw",
					"min-h-lvh",
					"min-h-lvw",
					"min-h-svw",
					"min-h-svh",
					"min-h-auto",
					"min-h-min",
					"min-h-max",
					"min-h-fit",
					"min-h-lh",
					"min-h-(<property>)",
					"min-h-[<property>]",
				],
			},
			{
				name: "max-height",
				prefixes: [
					"max-h-<property>",
					"max-h-none",
					"max-h-px",
					"max-h-full",
					"max-h-screen",
					"max-h-dvh",
					"max-h-dvw",
					"max-h-lvh",
					"max-h-lvw",
					"max-h-svh",
					"max-h-svw",
					"max-h-min",
					"max-h-max",
					"max-h-fit",
					"max-h-lh",
					"max-h-(<property>)",
					"max-h-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "Typography",
		group: [
			{
				name: "font-family",
				prefixes: [
					"font-sans",
					"font-serif",
					"font-mono",
					"font-(<property>)",
					"font-[<property>]",
				],
			},
			{
				name: "font-size",
				prefixes: [
					"text-xs",
					"text-sm",
					"text-base",
					"text-lg",
					"text-xl",
					"text-2xl",
					"text-3xl",
					"text-4xl",
					"text-5xl",
					"text-6xl",
					"text-7xl",
					"text-8xl",
					"text-9xl",
					"text-(length:<property>)",
					"text-[<property>]",
				],
			},
			{
				name: "font-smoothing",
				prefixes: ["antialiased", "subpixel-antialiased"],
			},
			{
				name: "font-style",
				prefixes: ["italic", "not-italic"],
			},
			{
				name: "font-weight",
				prefixes: [
					"font-thin",
					"font-extralight",
					"font-light",
					"font-normal",
					"font-medium",
					"font-semibold",
					"font-bold",
					"font-extrabold",
					"font-black",
					"font-(<property>)",
					"font-[<property>]",
				],
			},
			{
				name: "font-stretch",
				prefixes: [
					"font-stretch-ultra-condensed",
					"font-stretch-extra-condensed",
					"font-stretch-condensed",
					"font-stretch-semi-condensed",
					"font-stretch-normal",
					"font-stretch-semi-expanded",
					"font-stretch-expanded",
					"font-stretch-extra-expanded",
					"font-stretch-ultra-expanded",
					"font-stretch-<property>",
					"font-stretch-(<property>)",
					"font-stretch-[<property>]",
				],
			},
			{
				name: "font-variant-numeric",
				prefixes: [
					"normal-nums",
					"ordinal",
					"slashed-zero",
					"lining-nums",
					"oldstyle-nums",
					"proportional-nums",
					"tabular-nums",
					"diagonal-fractions",
					"stacked-fractions",
				],
			},
			{
				name: "letter-spacing",
				prefixes: [
					"tracking-tighter",
					"tracking-tight",
					"tracking-normal",
					"tracking-wide",
					"tracking-wider",
					"tracking-widest",
					"tracking-(<property>)",
					"tracking-[<property>]",
				],
			},
			{
				name: "line-clamp",
				prefixes: [
					"line-clamp-<property>",
					"line-clamp-none",
					"line-clamp-(<property>)",
					"line-clamp-[<property>]",
				],
			},
			{
				name: "line-height",
				prefixes: [
					"text-<property>",
					"text-(<property>)",
					"text-[<property>]",
					"leading-none",
					"leading-<property>",
					"leading-(<property>)",
					"leading-[<property>]",
				],
			},
			{
				name: "list-style-image",
				prefixes: [
					"list-image-[<property>]",
					"list-image-(<property>)",
					"list-image-none",
				],
			},
			{
				name: "list-style-position",
				prefixes: ["list-inside", "list-outside"],
			},
			{
				name: "list-style-type",
				prefixes: [
					"list-disc",
					"list-decimal",
					"list-none",
					"list-(<property>)",
					"list-[<property>]",
				],
			},
			{
				name: "text-align",
				prefixes: [
					"text-left",
					"text-center",
					"text-right",
					"text-justify",
					"text-start",
					"text-end",
				],
			},
			{
				name: "color",
				prefixes: [
					"text-inherit",
					"text-current",
					"text-transparent",
					"text-black",
					"text-white",
					"text-(<property>)",
					"text-[<property>]",
				],
			},
			{
				name: "text-decoration-line",
				prefixes: ["underline", "overline", "line-through", "no-underline"],
			},
			{
				name: "text-decoration-color",
				prefixes: [
					"decoration-inherit",
					"decoration-current",
					"decoration-transparent",
					"decoration-black",
					"decoration-white",
					"decoration-(<property>)",
					"decoration-[<property>]",
				],
			},
			{
				name: "text-decoration-style",
				prefixes: [
					"decoration-solid",
					"decoration-double",
					"decoration-dotted",
					"decoration-dashed",
					"decoration-wavy",
				],
			},
			{
				name: "text-decoration-thickness",
				prefixes: [
					"decoration-<property>",
					"decoration-from-font",
					"decoration-auto",
					"decoration-(length:<property>)",
					"decoration-[<property>]",
				],
			},
			{
				name: "text-underline-offset",
				prefixes: [
					"underline-offset-<property>",
					"-underline-offset-<property>",
					"underline-offset-auto",
					"underline-offset-(<property>)",
					"underline-offset-[<property>]",
				],
			},
			{
				name: "text-transform",
				prefixes: ["uppercase", "lowercase", "capitalize", "normal-case"],
			},
			{
				name: "text-overflow",
				prefixes: ["truncate", "text-ellipsis", "text-clip"],
			},
			{
				name: "text-wrap",
				prefixes: ["text-wrap", "text-nowrap", "text-balance", "text-pretty"],
			},
			{
				name: "text-indent",
				prefixes: [
					"indent-<property>",
					"-indent-<property>",
					"indent-px",
					"-indent-px",
					"indent-(<property>)",
					"indent-[<property>]",
				],
			},
			{
				name: "vertical-align",
				prefixes: [
					"align-baseline",
					"align-top",
					"align-middle",
					"align-bottom",
					"align-text-top",
					"align-text-bottom",
					"align-sub",
					"align-super",
					"align-(<property>)",
					"align-[<property>]",
				],
			},
			{
				name: "white-space",
				prefixes: [
					"whitespace-normal",
					"whitespace-nowrap",
					"whitespace-pre",
					"whitespace-pre-line",
					"whitespace-pre-wrap",
					"whitespace-break-spaces",
				],
			},
			{
				name: "word-break",
				prefixes: ["break-normal", "break-all", "break-keep"],
			},
			{
				name: "overflow-wrap",
				prefixes: ["wrap-break-word", "wrap-anywhere", "wrap-normal"],
			},
			{
				name: "hyphens",
				prefixes: ["hyphens-none", "hyphens-manual", "hyphens-auto"],
			},
			{
				name: "content",
				prefixes: [
					"content-[<property>]",
					"content-(<property>)",
					"content-none",
				],
			},
		],
	},
	{
		categoryName: "Backgrounds",
		group: [
			{
				name: "background-attachment",
				prefixes: ["bg-fixed", "bg-local", "bg-scroll"],
			},
			{
				name: "background-clip",
				prefixes: [
					"bg-clip-border",
					"bg-clip-padding",
					"bg-clip-content",
					"bg-clip-text",
				],
			},
			{
				name: "background-color",
				prefixes: [
					"bg-inherit",
					"bg-current",
					"bg-transparent",
					"bg-black",
					"bg-white",
					"bg-(<property>)",
					"bg-[<property>]",
				],
			},
			{
				name: "background-image",
				prefixes: [
					"bg-[<property>]",
					"bg-(image:<property>)",
					"bg-none",
					"bg-linear-to-t",
					"bg-linear-to-tr",
					"bg-linear-to-r",
					"bg-linear-to-br",
					"bg-linear-to-b",
					"bg-linear-to-bl",
					"bg-linear-to-l",
					"bg-linear-to-tl",
					"bg-linear-<property>",
					"-bg-linear-<property>",
					"bg-linear-(<property>)",
					"bg-linear-[<property>]",
					"bg-radial",
					"bg-radial-(<property>)",
					"bg-radial-[<property>]",
					"bg-conic-<property>",
					"-bg-conic-<property>",
					"bg-conic-(<property>)",
					"bg-conic-[<property>]",
					" ",
					"from-(<property>)",
					"from-[<property>]",
					"via-<property>",
					"via-(<property>)",
					"via-[<property>]",
					"to-<property>",
					"to-(<property>)",
					"to-[<property>]",
				],
			},
			{
				name: "background-origin",
				prefixes: [
					"bg-origin-border",
					"bg-origin-padding",
					"bg-origin-content",
				],
			},
			{
				name: "background-position",
				prefixes: [
					"bg-top-left",
					"bg-top",
					"bg-top-right",
					"bg-left",
					"bg-center",
					"bg-right",
					"bg-bottom-left",
					"bg-bottom",
					"bg-bottom-right",
					"bg-position-(<property>)",
					"bg-position-[<property>]",
				],
			},
			{
				name: "background-repeat",
				prefixes: [
					"bg-repeat",
					"bg-repeat-x",
					"bg-repeat-y",
					"bg-repeat-space",
					"bg-repeat-round",
					"bg-no-repeat",
				],
			},
			{
				name: "background-size",
				prefixes: [
					"bg-auto",
					"bg-cover",
					"bg-contain",
					"bg-size-(<property>)",
					"bg-size-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "Borders",
		group: [
			{
				name: "border-radius",
				prefixes: [
					"rounded-xs",
					"rounded-sm",
					"rounded-md",
					"rounded-lg",
					"rounded-xl",
					"rounded-2xl",
					"rounded-3xl",
					"rounded-4xl",
					"rounded-none",
					"rounded-full",
					"rounded-(<property>)",
					"rounded-[<property>]",
					"rounded-s-xs",
					"rounded-s-sm",
					"rounded-s-md",
					"rounded-s-lg",
					"rounded-s-xl",
					"rounded-s-2xl",
					"rounded-s-3xl",
					"rounded-s-4xl",
					"rounded-s-none",
					"rounded-s-full",
					"rounded-s-(<property>)",
					"rounded-s-[<property>]",
					"rounded-e-xs",
					"rounded-e-sm",
					"rounded-e-md",
					"rounded-e-lg",
					"rounded-e-xl",
					"rounded-e-2xl",
					"rounded-e-3xl",
					"rounded-e-4xl",
					"rounded-e-none",
					"rounded-e-full",
					"rounded-e-(<property>)",
					"rounded-e-[<property>]",
					"rounded-t-xs",
					"rounded-t-sm",
					"rounded-t-md",
					"rounded-t-lg",
					"rounded-t-xl",
					"rounded-t-2xl",
					"rounded-t-3xl",
					"rounded-t-4xl",
					"rounded-t-none",
					"rounded-t-full",
					"rounded-t-(<property>)",
					"rounded-t-[<property>]",
					"rounded-r-xs",
					"rounded-r-sm",
					"rounded-r-md",
					"rounded-r-lg",
					"rounded-r-xl",
					"rounded-r-2xl",
					"rounded-r-3xl",
					"rounded-r-4xl",
					"rounded-r-none",
					"rounded-r-full",
					"rounded-r-(<property>)",
					"rounded-r-[<property>]",
					"rounded-b-xs",
					"rounded-b-sm",
					"rounded-b-md",
					"rounded-b-lg",
					"rounded-b-xl",
					"rounded-b-2xl",
					"rounded-b-3xl",
					"rounded-b-4xl",
					"rounded-b-none",
					"rounded-b-full",
					"rounded-b-(<property>)",
					"rounded-b-[<property>]",
					"rounded-l-xs",
					"rounded-l-sm",
					"rounded-l-md",
					"rounded-l-lg",
					"rounded-l-xl",
					"rounded-l-2xl",
					"rounded-l-3xl",
					"rounded-l-4xl",
					"rounded-l-none",
					"rounded-l-full",
					"rounded-l-(<property>)",
					"rounded-l-[<property>]",
					"rounded-ss-xs",
					"rounded-ss-sm",
					"rounded-ss-md",
					"rounded-ss-lg",
					"rounded-ss-xl",
					"rounded-ss-2xl",
					"rounded-ss-3xl",
					"rounded-ss-4xl",
					"rounded-ss-none",
					"rounded-ss-full",
					"rounded-ss-(<property>)",
					"rounded-ss-[<property>]",
					"rounded-se-xs",
					"rounded-se-sm",
					"rounded-se-md",
					"rounded-se-lg",
					"rounded-se-xl",
					"rounded-se-2xl",
					"rounded-se-3xl",
					"rounded-se-4xl",
					"rounded-se-none",
					"rounded-se-full",
					"rounded-se-(<property>)",
					"rounded-se-[<property>]",
					"rounded-ee-xs",
					"rounded-ee-sm",
					"rounded-ee-md",
					"rounded-ee-lg",
					"rounded-ee-xl",
					"rounded-ee-2xl",
					"rounded-ee-3xl",
					"rounded-ee-4xl",
					"rounded-ee-none",
					"rounded-ee-full",
					"rounded-ee-(<property>)",
					"rounded-ee-[<property>]",
					"rounded-es-xs",
					"rounded-es-sm",
					"rounded-es-md",
					"rounded-es-lg",
					"rounded-es-xl",
					"rounded-es-2xl",
					"rounded-es-3xl",
					"rounded-es-4xl",
					"rounded-es-none",
					"rounded-es-full",
					"rounded-es-(<property>)",
					"rounded-es-[<property>]",
					"rounded-tl-xs",
					"rounded-tl-sm",
					"rounded-tl-md",
					"rounded-tl-lg",
					"rounded-tl-xl",
					"rounded-tl-2xl",
					"rounded-tl-3xl",
					"rounded-tl-4xl",
					"rounded-tl-none",
					"rounded-tl-full",
					"rounded-tl-(<property>)",
					"rounded-tl-[<property>]",
					"rounded-tr-xs",
					"rounded-tr-sm",
					"rounded-tr-md",
					"rounded-tr-lg",
					"rounded-tr-xl",
					"rounded-tr-2xl",
					"rounded-tr-3xl",
					"rounded-tr-4xl",
					"rounded-tr-none",
					"rounded-tr-full",
					"rounded-tr-(<property>)",
					"rounded-tr-[<property>]",
					"rounded-br-xs",
					"rounded-br-sm",
					"rounded-br-md",
					"rounded-br-lg",
					"rounded-br-xl",
					"rounded-br-2xl",
					"rounded-br-3xl",
					"rounded-br-4xl",
					"rounded-br-none",
					"rounded-br-full",
					"rounded-br-(<property>)",
					"rounded-br-[<property>]",
					"rounded-bl-xs",
					"rounded-bl-sm",
					"rounded-bl-md",
					"rounded-bl-lg",
					"rounded-bl-xl",
					"rounded-bl-2xl",
					"rounded-bl-3xl",
					"rounded-bl-4xl",
					"rounded-bl-none",
					"rounded-bl-full",
					"rounded-bl-(<property>)",
					"rounded-bl-[<property>]",
				],
			},
			{
				name: "border-width",
				prefixes: [
					"border",
					"border-<property>",
					"border-(length:<property>)",
					"border-[<property>]",
					"border-x",
					"border-x-<property>",
					"border-x-(length:<property>)",
					"border-x-[<property>]",
					"border-y",
					"border-y-<property>",
					"border-y-(length:<property>)",
					"border-y-[<property>]",
					"border-s",
					"border-s-<property>",
					"border-s-(length:<property>)",
					"border-s-[<property>]",
					"border-e",
					"border-e-<property>",
					"border-e-(length:<property>)",
					"border-e-[<property>]",
					"border-t",
					"border-t-<property>",
					"border-t-(length:<property>)",
					"border-t-[<property>]",
					"border-r",
					"border-r-<property>",
					"border-r-(length:<property>)",
					"border-r-[<property>]",
					"border-b",
					"border-b-<property>",
					"border-b-(length:<property>)",
					"border-b-[<property>]",
					"border-l",
					"border-l-<property>",
					"border-l-(length:<property>)",
					"border-l-[<property>]",
					"divide-x",
					"divide-x-<property>",
					"divide-x-(length:<property>)",
					"divide-x-[<property>]",
					"divide-y",
					"divide-y-<property>",
					"divide-y-(length:<property>)",
					"divide-y-[<property>]",
					"divide-x-reverse",
					"divide-y-reverse",
				],
			},
			{
				name: "border-color",
				prefixes: [
					"border-inherit",
					"border-current",
					"border-transparent",
					"border-black",
					"border-white",
					"border-(<property>)",
					"border-[<property>]",
					"border-x-inherit",
					"border-x-current",
					"border-x-transparent",
					"border-x-black",
					"border-x-white",
					"border-x-(<property>)",
					"border-x-[<property>]",
					"border-y-inherit",
					"border-y-current",
					"border-y-transparent",
					"border-y-black",
					"border-y-white",
					"border-y-(<property>)",
					"border-y-[<property>]",
					"border-s-inherit",
					"border-s-current",
					"border-s-transparent",
					"border-s-black",
					"border-s-white",
					"border-s-(<property>)",
					"border-s-[<property>]",
					"border-e-inherit",
					"border-e-current",
					"border-e-transparent",
					"border-e-black",
					"border-e-white",
					"border-e-(<property>)",
					"border-e-[<property>]",
					"border-t-inherit",
					"border-t-current",
					"border-t-transparent",
					"border-t-black",
					"border-t-white",
					"border-t-(<property>)",
					"border-t-[<property>]",
					"border-r-inherit",
					"border-r-current",
					"border-r-transparent",
					"border-r-black",
					"border-r-white",
					"border-r-(<property>)",
					"border-r-[<property>]",
					"border-b-inherit",
					"border-b-current",
					"border-b-transparent",
					"border-b-black",
					"border-b-white",
					"border-b-(<property>)",
					"border-b-[<property>]",
					"border-l-inherit",
					"border-l-current",
					"border-l-transparent",
					"border-l-black",
					"border-l-white",
					"border-l-(<property>)",
					"border-l-[<property>]",
					"divide-inherit",
					"divide-current",
					"divide-transparent",
					"divide-black",
					"divide-white",
					"divide-(<property>)",
					"divide-[<property>]",
				],
			},
			{
				name: "border-style",
				prefixes: [
					"border-solid",
					"border-dashed",
					"border-dotted",
					"border-double",
					"border-hidden",
					"border-none",
					"divide-solid",
					"divide-dashed",
					"divide-dotted",
					"divide-double",
					"divide-hidden",
					"divide-none",
				],
			},
			{
				name: "outline-width",
				prefixes: [
					"outline",
					"outline-<property>",
					"outline-(length:<property>)",
					"outline-[<property>]",
				],
			},
			{
				name: "outline-color",
				prefixes: [
					"outline-inherit",
					"outline-current",
					"outline-transparent",
					"outline-black",
					"outline-white",
					"outline-(<property>)",
					"outline-[<property>]",
				],
			},
			{
				name: "outline-style",
				prefixes: [
					"outline-solid",
					"outline-dashed",
					"outline-dotted",
					"outline-double",
					"outline-none",
					"outline-hidden",
				],
			},
			{
				name: "outline-offset",
				prefixes: [
					"outline-offset-<property>",
					"-outline-offset-<property>",
					"outline-offset-(<property>)",
					"outline-offset-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "Effects",
		group: [
			{
				name: "box-shadow",
				prefixes: [
					"shadow-2xs",
					"shadow-xs",
					"shadow-sm",
					"shadow-md",
					"shadow-lg",
					"shadow-xl",
					"shadow-2xl",
					"shadow-none",
					"shadow-(<property>)",
					"shadow-(color:<property>)",
					"shadow-[<property>]",
					"shadow-inherit",
					"shadow-current",
					"shadow-transparent",
					"shadow-black",
					"shadow-white",
					"inset-shadow-2xs",
					"inset-shadow-xs",
					"inset-shadow-sm",
					"inset-shadow-none",
					"inset-shadow-(<property>)",
					"inset-shadow-[<property>]",
					"inset-shadow-inherit",
					"inset-shadow-current",
					"inset-shadow-transparent",
					"inset-shadow-black",
					"inset-shadow-white",
					"ring",
					"ring-<property>",
					"ring-(<property>)",
					"ring-[<property>]",
					"ring-inherit",
					"ring-current",
					"ring-transparent",
					"ring-black",
					"ring-white",
					"inset-ring",
					"inset-ring-<property>",
					"inset-ring-(<property>)",
					"inset-ring-[<property>]",
					"inset-ring-inherit",
					"inset-ring-current",
					"inset-ring-transparent",
					"inset-ring-black",
					"inset-ring-white",
				],
			},
			{
				name: "text-shadow",
				prefixes: [
					"text-shadow-2xs",
					"text-shadow-xs",
					"text-shadow-sm",
					"text-shadow-md",
					"text-shadow-lg",
					"text-shadow-none",
					"text-shadow-(<property>)",
					"text-shadow-(color:<property>)",
					"text-shadow-[<property>]",
					"text-shadow-inherit",
					"text-shadow-current",
					"text-shadow-transparent",
					"text-shadow-black",
					"text-shadow-white",
				],
			},
			{
				name: "opacity",
				prefixes: [
					"opacity-<property>",
					"opacity-(<property>)",
					"opacity-[<property>]",
				],
			},
			{
				name: "mix-blend-mode",
				prefixes: [
					"mix-blend-normal",
					"mix-blend-multiply",
					"mix-blend-screen",
					"mix-blend-overlay",
					"mix-blend-darken",
					"mix-blend-lighten",
					"mix-blend-color-dodge",
					"mix-blend-color-burn",
					"mix-blend-hard-light",
					"mix-blend-soft-light",
					"mix-blend-difference",
					"mix-blend-exclusion",
					"mix-blend-hue",
					"mix-blend-saturation",
					"mix-blend-color",
					"mix-blend-luminosity",
					"mix-blend-plus-darker",
					"mix-blend-plus-lighter",
				],
			},
			{
				name: "background-blend-mode",
				prefixes: [
					"bg-blend-normal",
					"bg-blend-multiply",
					"bg-blend-screen",
					"bg-blend-overlay",
					"bg-blend-darken",
					"bg-blend-lighten",
					"bg-blend-color-dodge",
					"bg-blend-color-burn",
					"bg-blend-hard-light",
					"bg-blend-soft-light",
					"bg-blend-difference",
					"bg-blend-exclusion",
					"bg-blend-hue",
					"bg-blend-saturation",
					"bg-blend-color",
					"bg-blend-luminosity",
				],
			},
			{
				name: "mask-clip",
				prefixes: [
					"mask-clip-border",
					"mask-clip-padding",
					"mask-clip-content",
					"mask-clip-fill",
					"mask-clip-stroke",
					"mask-clip-view",
					"mask-no-clip",
				],
			},
			{
				name: "mask-composite",
				prefixes: [
					"mask-add",
					"mask-subtract",
					"mask-intersect",
					"mask-exclude",
				],
			},
			{
				name: "mask-image",
				prefixes: [
					"mask-[<property>]",
					"mask-(<property>)",
					"mask-none",
					"mask-linear-<property>",
					"-mask-linear-<property>",
					"mask-linear-from-<property>",
					"mask-linear-from-(<property>)",
					"mask-linear-from-[<property>]",
					"mask-linear-to-<property>",
					"mask-linear-to-(<property>)",
					"mask-linear-to-[<property>]",
					"mask-t-from-<property>",
					"mask-t-from-(<property>)",
					"mask-t-from-[<property>]",
					"mask-t-to-<property>",
					"mask-t-to-(<property>)",
					"mask-t-to-[<property>]",
					"mask-r-from-<property>",
					"mask-r-from-(<property>)",
					"mask-r-from-[<property>]",
					"mask-r-to-<property>",
					"mask-r-to-(<property>)",
					"mask-r-to-[<property>]",
					"mask-b-from-<property>",
					"mask-b-from-(<property>)",
					"mask-b-from-[<property>]",
					"mask-b-to-<property>",
					"mask-b-to-(<property>)",
					"mask-b-to-[<property>]",
					"mask-l-from-<property>",
					"mask-l-from-(<property>)",
					"mask-l-from-[<property>]",
					"mask-l-to-<property>",
					"mask-l-to-(<property>)",
					"mask-l-to-[<property>]",
					"mask-y-from-<property>",
					"mask-y-from-(<property>)",
					"mask-y-from-[<property>]",
					"mask-y-to-<property>",
					"mask-y-to-(<property>)",
					"mask-y-to-[<property>]",
					"mask-x-from-<property>",
					"mask-x-from-(<property>)",
					"mask-x-from-[<property>]",
					"mask-x-to-<property>",
					"mask-x-to-(<property>)",
					"mask-x-to-[<property>]",
					"mask-radial-[<property>]",
					"mask-radial-from-<property>",
					"mask-radial-from-(<property>)",
					"mask-radial-from-[<property>]",
					"mask-radial-to-<property>",
					"mask-radial-to-(<property>)",
					"mask-radial-to-[<property>]",
					"mask-circle",
					"mask-ellipse",
					"mask-radial-closest-corner",
					"mask-radial-closest-side",
					"mask-radial-farthest-corner",
					"mask-radial-farthest-side",
					"mask-radial-at-top-left",
					"mask-radial-at-top",
					"mask-radial-at-top-right",
					"mask-radial-at-left",
					"mask-radial-at-center",
					"mask-radial-at-right",
					"mask-radial-at-bottom-left",
					"mask-radial-at-bottom",
					"mask-radial-at-bottom-right",
					"mask-conic-<property>",
					"-mask-conic-<property>",
					"mask-conic-from-<property>",
					"mask-conic-from-(<property>)",
					"mask-conic-from-[<property>]",
					"mask-conic-to-<property>",
					"mask-conic-to-(<property>)",
					"mask-conic-to-[<property>]",
				],
			},
			{
				name: "mask-mode",
				prefixes: ["mask-alpha", "mask-luminance", "mask-match"],
			},
			{
				name: "mask-origin",
				prefixes: [
					"mask-origin-border",
					"mask-origin-padding",
					"mask-origin-content",
					"mask-origin-fill",
					"mask-origin-stroke",
					"mask-origin-view",
				],
			},
			{
				name: "mask-position",
				prefixes: [
					"mask-top-left",
					"mask-top",
					"mask-top-right",
					"mask-left",
					"mask-center",
					"mask-right",
					"mask-bottom-left",
					"mask-bottom",
					"mask-bottom-right",
					"mask-position-(<property>)",
					"mask-position-[<property>]",
				],
			},
			{
				name: "mask-repeat",
				prefixes: [
					"mask-repeat",
					"mask-no-repeat",
					"mask-repeat-x",
					"mask-repeat-y",
					"mask-repeat-space",
					"mask-repeat-round",
				],
			},
			{
				name: "mask-size",
				prefixes: [
					"mask-auto",
					"mask-cover",
					"mask-contain",
					"mask-size-(<property>)",
					"mask-size-[<property>]",
				],
			},
			{
				name: "mask-type",
				prefixes: ["mask-type-alpha", "mask-type-luminance"],
			},
		],
	},
	{
		categoryName: "Filters",
		group: [
			{
				name: "filter",
				prefixes: ["filter-none", "filter-(<property>)", "filter-[<property>]"],
			},
			{
				name: "filter: blur()",
				prefixes: [
					"blur-xs",
					"blur-sm",
					"blur-md",
					"blur-lg",
					"blur-xl",
					"blur-2xl",
					"blur-3xl",
					"blur-none",
					"blur-(<property>)",
					"blur-[<property>]",
				],
			},
			{
				name: "filter: brightness()",
				prefixes: [
					"brightness-<property>",
					"brightness-(<property>)",
					"brightness-[<property>]",
				],
			},
			{
				name: "filter: contrast()",
				prefixes: [
					"contrast-<property>",
					"contrast-(<property>)",
					"contrast-[<property>]",
				],
			},
			{
				name: "filter: drop-shadow()",
				prefixes: [
					"drop-shadow-xs",
					"drop-shadow-sm",
					"drop-shadow-md",
					"drop-shadow-lg",
					"drop-shadow-xl",
					"drop-shadow-2xl",
					"drop-shadow-none",
					"drop-shadow-(<property>)",
					"drop-shadow-(color:<property>)",
					"drop-shadow-[<property>]",
					"drop-shadow-inherit",
					"drop-shadow-current",
					"drop-shadow-transparent",
					"drop-shadow-black",
					"drop-shadow-white",
				],
			},
			{
				name: "filter: grayscale()",
				prefixes: [
					"grayscale",
					"grayscale-<property>",
					"grayscale-(<property>)",
					"grayscale-[<property>]",
				],
			},
			{
				name: "filter: hue-rotate()",
				prefixes: [
					"hue-rotate-<property>",
					"-hue-rotate-<property>",
					"hue-rotate-(<property>)",
					"hue-rotate-[<property>]",
				],
			},
			{
				name: "filter: invert()",
				prefixes: [
					"invert",
					"invert-<property>",
					"invert-(<property>)",
					"invert-[<property>]",
				],
			},
			{
				name: "filter: saturate()",
				prefixes: [
					"saturate-<property>",
					"saturate-(<property>)",
					"saturate-[<property>]",
				],
			},
			{
				name: "filter: sepia()",
				prefixes: [
					"sepia",
					"sepia-<property>",
					"sepia-(<property>)",
					"sepia-[<property>]",
				],
			},
			{
				name: "backdrop-filter",
				prefixes: [
					"backdrop-filter-none",
					"backdrop-filter-(<property>)",
					"backdrop-filter-[<property>]",
				],
			},
			{
				name: "backdrop-filter: blur()",
				prefixes: [
					"backdrop-blur-xs",
					"backdrop-blur-sm",
					"backdrop-blur-md",
					"backdrop-blur-lg",
					"backdrop-blur-xl",
					"backdrop-blur-2xl",
					"backdrop-blur-3xl",
					"backdrop-blur-none",
					"backdrop-blur-(<property>)",
					"backdrop-blur-[<property>]",
				],
			},
			{
				name: "backdrop-filter: brightness()",
				prefixes: [
					"backdrop-brightness-<property>",
					"backdrop-brightness-(<property>)",
					"backdrop-brightness-[<property>]",
				],
			},
			{
				name: "backdrop-filter: contrast()",
				prefixes: [
					"backdrop-contrast-<property>",
					"backdrop-contrast-(<property>)",
					"backdrop-contrast-[<property>]",
				],
			},
			{
				name: "backdrop-filter: grayscale()",
				prefixes: [
					"backdrop-grayscale",
					"backdrop-grayscale-<property>",
					"backdrop-grayscale-(<property>)",
					"backdrop-grayscale-[<property>]",
				],
			},
			{
				name: "backdrop-filter: hue-rotate()",
				prefixes: [
					"backdrop-hue-rotate-<property>",
					"-backdrop-hue-rotate-<property>",
					"backdrop-hue-rotate-(<property>)",
					"backdrop-hue-rotate-[<property>]",
				],
			},
			{
				name: "backdrop-filter: invert()",
				prefixes: [
					"backdrop-invert",
					"backdrop-invert-<property>",
					"backdrop-invert-(<property>)",
					"backdrop-invert-[<property>]",
				],
			},
			{
				name: "backdrop-filter: opacity()",
				prefixes: [
					"backdrop-opacity-<property>",
					"backdrop-opacity-(<property>)",
					"backdrop-opacity-[<property>]",
				],
			},
			{
				name: "backdrop-filter: saturate()",
				prefixes: [
					"backdrop-saturate-<property>",
					"backdrop-saturate-(<property>)",
					"backdrop-saturate-[<property>]",
				],
			},
			{
				name: "backdrop-filter: sepia()",
				prefixes: [
					"backdrop-sepia",
					"backdrop-sepia-<property>",
					"backdrop-sepia-(<property>)",
					"backdrop-sepia-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "Tables",
		group: [
			{
				name: "border-collapse",
				prefixes: ["border-collapse", "border-separate"],
			},
			{
				name: "border-spacing",
				prefixes: [
					"border-spacing-<property>",
					"border-spacing-(<property>)",
					"border-spacing-[<property>]",
					"border-spacing-x-<property>",
					"border-spacing-x-(<property>)",
					"border-spacing-x-[<property>]",
					"border-spacing-y-<property>",
					"border-spacing-y-(<property>)",
					"border-spacing-y-[<property>]",
				],
			},
			{
				name: "table-layout",
				prefixes: ["table-auto", "table-fixed"],
			},
			{
				name: "caption-side",
				prefixes: ["caption-top", "caption-bottom"],
			},
		],
	},
	{
		categoryName: "Transitions & Animation",
		group: [
			{
				name: "transition-property",
				prefixes: [
					"transition",
					"transition-all",
					"transition-colors",
					"transition-opacity",
					"transition-shadow",
					"transition-transform",
					"transition-none",
					"transition-(<custom-property>)",
					"transition-[<value>]",
				],
			},
			{
				name: "transition-behavior",
				prefixes: ["transition-normal", "transition-discrete"],
			},
			{
				name: "transition-duration",
				prefixes: [
					"duration-<property>",
					"duration-initial",
					"duration-(<property>)",
					"duration-[<property>]",
				],
			},
			{
				name: "transition-timing-function",
				prefixes: [
					"ease-linear",
					"ease-in",
					"ease-out",
					"ease-in-out",
					"ease-initial",
					"ease-(<property>)",
					"ease-[<property>]",
				],
			},
			{
				name: "transition-delay",
				prefixes: [
					"delay-<property>",
					"delay-(<property>)",
					"delay-[<property>]",
				],
			},
			{
				name: "animation",
				prefixes: [
					"animate-spin",
					"animate-ping",
					"animate-pulse",
					"animate-bounce",
					"animate-none",
					"animate-(<property>)",
					"animate-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "Transforms",
		group: [
			{
				name: "backface-visibility",
				prefixes: ["backface-hidden", "backface-visible"],
			},
			{
				name: "perspective",
				prefixes: [
					"perspective-dramatic",
					"perspective-near",
					"perspective-normal",
					"perspective-midrange",
					"perspective-distant",
					"perspective-none",
					"perspective-(<property>)",
					"perspective-[<property>]",
				],
			},
			{
				name: "perspective-origin",
				prefixes: [
					"perspective-origin-center",
					"perspective-origin-top",
					"perspective-origin-top-right",
					"perspective-origin-right",
					"perspective-origin-bottom-right",
					"perspective-origin-bottom",
					"perspective-origin-bottom-left",
					"perspective-origin-left",
					"perspective-origin-top-left",
					"perspective-origin-(<property>)",
					"perspective-origin-[<property>]",
				],
			},
			{
				name: "rotate",
				prefixes: [
					"rotate-none",
					"rotate-<property>",
					"-rotate-<property>",
					"rotate-(<property>)",
					"rotate-[<property>]",
					"rotate-x-<property>",
					"-rotate-x-<property>",
					"rotate-x-(<property>)",
					"rotate-x-[<property>]",
					"rotate-y-<property>",
					"-rotate-y-<property>",
					"rotate-y-(<property>)",
					"rotate-y-[<property>]",
					"rotate-z-<property>",
					"-rotate-z-<property>",
					"rotate-z-(<property>)",
					"rotate-z-[<property>]",
				],
			},
			{
				name: "scale",
				prefixes: [
					"scale-none",
					"scale-<property>",
					"-scale-<property>",
					"scale-(<property>)",
					"scale-[<property>]",
					"scale-x-<property>",
					"-scale-x-<property>",
					"scale-x-(<property>)",
					"scale-x-[<property>]",
					"scale-y-<property>",
					"-scale-y-<property>",
					"scale-y-(<property>)",
					"scale-y-[<property>]",
					"scale-z-<property>",
					"-scale-z-<property>",
					"scale-z-(<property>)",
					"scale-z-[<property>]",
					"scale-3d",
				],
			},
			{
				name: "skew",
				prefixes: [
					"skew-<property>",
					"-skew-<property>",
					"skew-(<property>)",
					"skew-[<property>]",
					"skew-x-<property>",
					"-skew-x-<property>",
					"skew-x-(<property>)",
					"skew-x-[<property>]",
					"skew-y-<property>",
					"-skew-y-<property>",
					"skew-y-(<property>)",
					"skew-y-[<property>]",
				],
			},
			{
				name: "transform",
				prefixes: [
					"transform-(<property>)",
					"transform-[<property>]",
					"transform-none",
					"transform-gpu",
					"transform-cpu",
				],
			},
			{
				name: "transform-origin",
				prefixes: [
					"origin-center",
					"origin-top",
					"origin-top-right",
					"origin-right",
					"origin-bottom-right",
					"origin-bottom",
					"origin-bottom-left",
					"origin-left",
					"origin-top-left",
					"origin-(<property>)",
					"origin-[<property>]",
				],
			},
			{
				name: "transform-style",
				prefixes: ["transform-3d", "transform-flat"],
			},
			{
				name: "translate",
				prefixes: [
					"translate-<property>",
					"-translate-<property>",
					"translate-full",
					"-translate-full",
					"translate-px",
					"-translate-px",
					"translate-(<property>)",
					"translate-[<property>]",
					"translate-x-<property>",
					"-translate-x-<property>",
					"translate-x-full",
					"-translate-x-full",
					"translate-x-px",
					"-translate-x-px",
					"translate-x-(<property>)",
					"translate-x-[<property>]",
					"translate-y-<property>",
					"-translate-y-<property>",
					"translate-y-full",
					"-translate-y-full",
					"translate-y-px",
					"-translate-y-px",
					"translate-y-(<property>)",
					"translate-y-[<property>]",
					"translate-z-<property>",
					"-translate-z-<property>",
					"translate-z-full",
					"-translate-z-full",
					"translate-z-px",
					"-translate-z-px",
					"translate-z-(<property>)",
					"translate-z-[<property>]",
					"translate-none",
				],
			},
		],
	},
	{
		categoryName: "Interactivity",
		group: [
			{
				name: "accent-color",
				prefixes: [
					"accent-inherit",
					"accent-current",
					"accent-transparent",
					"accent-black",
					"accent-white",
					"accent-<property>",
					"accent-[<property>]",
				],
			},
			{
				name: "appearance",
				prefixes: ["appearance-none", "appearance-auto"],
			},
			{
				name: "caret-color",
				prefixes: [
					"caret-inherit",
					"caret-current",
					"caret-transparent",
					"caret-black",
					"caret-white",
					"caret-<property>",
					"caret-[<property>]",
				],
			},
			{
				name: "color-scheme",
				prefixes: [
					"scheme-normal",
					"scheme-dark",
					"scheme-light",
					"scheme-light-dark",
					"scheme-only-dark",
					"scheme-only-light",
				],
			},
			{
				name: "cursor",
				prefixes: [
					"cursor-auto",
					"cursor-default",
					"cursor-pointer",
					"cursor-wait",
					"cursor-text",
					"cursor-move",
					"cursor-help",
					"cursor-not-allowed",
					"cursor-none",
					"cursor-context-menu",
					"cursor-progress",
					"cursor-cell",
					"cursor-crosshair",
					"cursor-vertical-text",
					"cursor-alias",
					"cursor-copy",
					"cursor-no-drop",
					"cursor-grab",
					"cursor-grabbing",
					"cursor-all-scroll",
					"cursor-col-resize",
					"cursor-row-resize",
					"cursor-n-resize",
					"cursor-e-resize",
					"cursor-s-resize",
					"cursor-w-resize",
					"cursor-ne-resize",
					"cursor-nw-resize",
					"cursor-se-resize",
					"cursor-sw-resize",
					"cursor-ew-resize",
					"cursor-ns-resize",
					"cursor-nesw-resize",
					"cursor-nwse-resize",
					"cursor-zoom-in",
					"cursor-zoom-out",
					"cursor-(<property>)",
					"cursor-[<property>]",
				],
			},
			{
				name: "field-sizing",
				prefixes: ["field-sizing-fixed", "field-sizing-content"],
			},
			{
				name: "pointer-events",
				prefixes: ["pointer-events-auto", "pointer-events-none"],
			},
			{
				name: "resize",
				prefixes: ["resize-none", "resize", "resize-y", "resize-x"],
			},
			{
				name: "scroll-behavior",
				prefixes: ["scroll-auto", "scroll-smooth"],
			},
			{
				name: "scroll-margin",
				prefixes: [
					"scroll-m-<property>",
					"-scroll-m-<property>",
					"scroll-m-(<property>)",
					"scroll-m-[<property>]",
					"scroll-mx-<property>",
					"-scroll-mx-<property>",
					"scroll-mx-(<property>)",
					"scroll-mx-[<property>]",
					"scroll-my-<property>",
					"-scroll-my-<property>",
					"scroll-my-(<property>)",
					"scroll-my-[<property>]",
					"scroll-ms-<property>",
					"-scroll-ms-<property>",
					"scroll-ms-(<property>)",
					"scroll-ms-[<property>]",
					"scroll-me-<property>",
					"-scroll-me-<property>",
					"scroll-me-(<property>)",
					"scroll-me-[<property>]",
					"scroll-mt-<property>",
					"-scroll-mt-<property>",
					"scroll-mt-(<property>)",
					"scroll-mt-[<property>]",
					"scroll-mr-<property>",
					"-scroll-mr-<property>",
					"scroll-mr-(<property>)",
					"scroll-mr-[<property>]",
					"scroll-mb-<property>",
					"-scroll-mb-<property>",
					"scroll-mb-(<property>)",
					"scroll-mb-[<property>]",
					"scroll-ml-<property>",
					"-scroll-ml-<property>",
					"scroll-ml-(<property>)",
					"scroll-ml-[<property>]",
				],
			},
			{
				name: "scroll-padding",
				prefixes: [
					"scroll-p-<property>",
					"-scroll-p-<property>",
					"scroll-p-(<property>)",
					"scroll-p-[<property>]",
					"scroll-px-<property>",
					"-scroll-px-<property>",
					"scroll-px-(<property>)",
					"scroll-px-[<property>]",
					"scroll-py-<property>",
					"-scroll-py-<property>",
					"scroll-py-(<property>)",
					"scroll-py-[<property>]",
					"scroll-ps-<property>",
					"-scroll-ps-<property>",
					"scroll-ps-(<property>)",
					"scroll-ps-[<property>]",
					"scroll-pe-<property>",
					"-scroll-pe-<property>",
					"scroll-pe-(<property>)",
					"scroll-pe-[<property>]",
					"scroll-pt-<property>",
					"-scroll-pt-<property>",
					"scroll-pt-(<property>)",
					"scroll-pt-[<property>]",
					"scroll-pr-<property>",
					"-scroll-pr-<property>",
					"scroll-pr-(<property>)",
					"scroll-pr-[<property>]",
					"scroll-pb-<property>",
					"-scroll-pb-<property>",
					"scroll-pb-(<property>)",
					"scroll-pb-[<property>]",
					"scroll-pl-<property>",
					"-scroll-pl-<property>",
					"scroll-pl-(<property>)",
					"scroll-pl-[<property>]",
				],
			},
			{
				name: "scroll-snap-align",
				prefixes: ["snap-start", "snap-end", "snap-center", "snap-align-none"],
			},
			{
				name: "scroll-snap-stop",
				prefixes: ["snap-normal", "snap-always"],
			},
			{
				name: "scroll-snap-type",
				prefixes: [
					"snap-none",
					"snap-x",
					"snap-y",
					"snap-both",
					"snap-mandatory",
					"snap-proximity",
				],
			},
			{
				name: "touch-action",
				prefixes: [
					"touch-auto",
					"touch-none",
					"touch-pan-x",
					"touch-pan-left",
					"touch-pan-right",
					"touch-pan-y",
					"touch-pan-up",
					"touch-pan-down",
					"touch-pinch-zoom",
					"touch-manipulation",
				],
			},
			{
				name: "user-select",
				prefixes: ["select-none", "select-text", "select-all", "select-auto"],
			},
			{
				name: "will-change",
				prefixes: [
					"will-change-auto",
					"will-change-scroll",
					"will-change-contents",
					"will-change-transform",
					"will-change-<property>",
					"will-change-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "SVG",
		group: [
			{
				name: "fill",
				prefixes: [
					"fill-none",
					"fill-inherit",
					"fill-current",
					"fill-transparent",
					"fill-black",
					"fill-white",
					"fill-(<property>)",
					"fill-[<property>]",
				],
			},
			{
				name: "stroke",
				prefixes: [
					"stroke-none",
					"stroke-inherit",
					"stroke-current",
					"stroke-transparent",
					"stroke-black",
					"stroke-white",
					"stroke-(<property>)",
					"stroke-[<property>]",
				],
			},
			{
				name: "stroke-width",
				prefixes: [
					"stroke-<property>",
					"stroke-(length:<property>)",
					"stroke-[<property>]",
				],
			},
		],
	},
	{
		categoryName: "Accessibility",
		group: [
			{
				name: "forced-color-adjust",
				prefixes: ["forced-color-adjust-auto", "forced-color-adjust-none"],
			},
		],
	},
];

// ==========================================
// 1. Constants & Configuration
// ==========================================

const TARGET_FUNCTIONS = new Set([
	"clsx",
	"cn",
	"cva",
	"twMerge",
	"twJoin",
	"classNames",
]);

/**
 * バリアントの優先順位定義を Map 化して高速化
 * 数値が小さいほど前（左）に配置されます
 */
const VARIANT_ORDER_MAP = new Map(
	[
		"first",
		"last",
		"odd",
		"even",
		"visited",
		"checked",
		"group-hover",
		"group-focus",
		"focus-within",
		"hover",
		"focus",
		"focus-visible",
		"active",
		"disabled",
		"sm",
		"md",
		"lg",
		"xl",
		"2xl",
	].map((v, i) => [v, i]),
);

// ==========================================
// 2. Core Logic: Class Sorter Engine
// ==========================================

class TailwindSorter {
	private staticClassMap = new Map<string, number>();
	private regexRules: CompiledRule[] = [];
	private indexCache = new Map<string, number>();

	constructor(groups: Category[]) {
		this.compileRules(groups);
	}

	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	private compileRules(groups: Category[]): void {
		let index = 0;
		for (const category of groups) {
			for (const group of category.group) {
				for (const prefix of group.prefixes) {
					if (!prefix.includes("<property>")) {
						this.staticClassMap.set(prefix, index);
					} else {
						const placeholder = "___PROP___";
						const tempString = prefix.replace("<property>", placeholder);
						const escapedString = this.escapeRegex(tempString);
						// プロパティ値に括弧が含まれるケースを考慮
						const valuePattern = "(?:[^\\[\\(]+|\\[[^\\]]+\\]|\\([^\\)]+\\))";
						const finalPattern = `^${escapedString.replace(placeholder, valuePattern)}$`;
						this.regexRules.push({ regex: new RegExp(finalPattern), index });
					}
					index++;
				}
			}
		}
	}

	private getGroupIndex(cls: string): number {
		const cached = this.indexCache.get(cls);
		if (cached !== undefined) return cached;

		let resultIndex = this.staticClassMap.get(cls);

		if (resultIndex === undefined) {
			for (const rule of this.regexRules) {
				if (rule.regex.test(cls)) {
					resultIndex = rule.index;
					break;
				}
			}
		}

		const finalIndex = resultIndex ?? Number.MAX_SAFE_INTEGER;
		this.indexCache.set(cls, finalIndex);
		return finalIndex;
	}

	/**
	 * 修正ポイント: 任意値 [ ... ] 内のスペースを保護するトークナイザ
	 */
	public sortString(classString: string): string {
		const hasNewline = /\n/.test(classString);
		const prefixMatch = classString.match(/^\s*/);
		const suffixMatch = classString.match(/\s*$/);
		const prefixSpace = prefixMatch ? prefixMatch[0] : "";
		const suffixSpace = suffixMatch ? suffixMatch[0] : "";

		const content = classString.trim();
		if (!content) return classString;

		const tokens =
			content.match(/([^\s[(]+(?:\[[^\]]+\]|\([^)]+\))?[^\s]*|[^\s]+)/g) || [];
		if (tokens.length === 0) return classString;

		// 重複排除
		const uniqueWords = Array.from(new Set(tokens));
		uniqueWords.sort((a, b) => this.compareClasses(a, b));

		const joinChar = hasNewline ? "\n" : " ";
		// prefix/suffix を維持して結合
		return prefixSpace + uniqueWords.join(joinChar) + suffixSpace;
	}

	/**
	 * 修正ポイント: バリアント自体の優先順位も比較対象に含める
	 */
	private compareClasses(a: string, b: string): number {
		const infoA = this.splitVariant(a);
		const infoB = this.splitVariant(b);

		// 1. 基本グループ（Layout, Spacing等）の定義順で比較
		const indexA = this.getGroupIndex(infoA.base);
		const indexB = this.getGroupIndex(infoB.base);

		if (indexA !== indexB) {
			return indexA - indexB;
		}

		// 2. バリアントの数で比較（少ないほうが先）
		if (infoA.variants.length !== infoB.variants.length) {
			return infoA.variants.length - infoB.variants.length;
		}

		// 3. バリアント自体の重み（sm, hover等）で比較
		for (let i = 0; i < infoA.variants.length; i++) {
			const vA = infoA.variants[i];
			const vB = infoB.variants[i];
			if (vA !== vB) {
				const weightA = VARIANT_ORDER_MAP.get(vA) ?? 999;
				const weightB = VARIANT_ORDER_MAP.get(vB) ?? 999;
				if (weightA !== weightB) return weightA - weightB;
				return vA.localeCompare(vB); // 未定義バリアント同士ならアルファベット順
			}
		}

		// 4. 最終的な文字列比較（安定ソート）
		return a.localeCompare(b);
	}

	private splitVariant(cls: string) {
		const parts = cls.split(":");
		// ! (Important) プレフィックスを除去して純粋なクラス名にする
		const rawBase = parts.pop() ?? "";
		const base = rawBase.replace(/^!|!$/g, "");
		return { base, variants: parts };
	}
}

// ==========================================
// 3. AST Helpers: Template & Node Processing
// ==========================================

/**
 * 修正ポイント: 改行や複数のスペースが混在するテンプレート内の整形を改善
 */
function processTemplateQuasi(
	raw: string,
	isFirstQuasi: boolean,
	isLastQuasi: boolean,
	sorter: TailwindSorter,
): string {
	// 1. 空白・改行のみならそのまま（構成を壊さない）
	if (!raw.trim()) return raw;

	const prefixMatch = raw.match(/^\s*/);
	const suffixMatch = raw.match(/\s*$/);
	const prefixSpace = prefixMatch ? prefixMatch[0] : "";
	const suffixSpace = suffixMatch ? suffixMatch[0] : "";

	const content = raw.trim();
	let tokens: string[] =
		content.match(/([^\s[(]+(?:\[[^\]]+\]|\([^)]+\))?[^\s]*|[^\s]+)/g) || [];

	if (tokens.length === 0) return raw;

	// --- 接着トークンの抽出 ---
	let leftGlueToken = "";
	if (!isFirstQuasi && prefixSpace === "" && tokens.length > 0) {
		leftGlueToken = tokens.shift() || "";
		tokens = tokens.filter((t) => t !== leftGlueToken);
	}

	let rightGlueToken = "";
	if (!isLastQuasi && suffixSpace === "" && tokens.length > 0) {
		rightGlueToken = tokens.pop() || "";
		tokens = tokens.filter((t) => t !== rightGlueToken);
	}

	// --- 中間部分のソート ---
	let sortedMiddle = "";
	if (tokens.length > 0) {
		sortedMiddle = sorter.sortString(tokens.join(" ")).trim();
	}

	// --- 再結合（スペース強制挿入ロジック） ---
	const finalParts: string[] = [];
	if (leftGlueToken) finalParts.push(leftGlueToken);
	if (sortedMiddle) finalParts.push(sortedMiddle);
	if (rightGlueToken) finalParts.push(rightGlueToken);

	let result = finalParts.join(" ");

	// 【重要】$ の直前にスペースを入れるための強制フラグ
	// 1. これが最後のセグメントではない（後ろに ${...} がある）
	// 2. 元の末尾にスペースがなかった（suffixSpace === ""）
	// 3. 何らかのクラス名が存在する
	if (!isLastQuasi && suffixSpace === "" && result.length > 0) {
		result += " "; // 強制的にスペースを追加
	}

	return prefixSpace + result + suffixSpace;
}

/**
 * ASTノードをトラバースして置換候補を収集する
 */
function collectReplacements(
	node: t.Node | null | undefined,
	replacements: { start: number; end: number; value: string }[],
	sorter: TailwindSorter,
) {
	if (!node) return;

	// 1. 文字列リテラル
	if (t.isStringLiteral(node)) {
		const rawValue = node.value;
		const sortedValue = sorter.sortString(rawValue);

		if (
			rawValue !== sortedValue &&
			typeof node.start === "number" &&
			typeof node.end === "number"
		) {
			replacements.push({
				start: node.start + 1,
				end: node.end - 1,
				value: sortedValue,
			});
		}
	}
	// 2. テンプレートリテラル
	else if (t.isTemplateLiteral(node)) {
		node.quasis.forEach((quasi, index) => {
			const rawValue = quasi.value.raw;
			if (!rawValue) return;

			const isFirst = index === 0;
			const isLast = index === node.quasis.length - 1;

			const sortedValue = processTemplateQuasi(
				rawValue,
				isFirst,
				isLast,
				sorter,
			);

			if (
				rawValue !== sortedValue &&
				typeof quasi.start === "number" &&
				typeof quasi.end === "number"
			) {
				replacements.push({
					start: quasi.start,
					end: quasi.end,
					value: sortedValue,
				});
			}
		});
	}
	// 3. JSX Expression { ... }
	else if (t.isJSXExpressionContainer(node)) {
		collectReplacements(node.expression, replacements, sorter);
	}
	// 4. 三項演算子 cond ? true : false
	else if (t.isConditionalExpression(node)) {
		collectReplacements(node.consequent, replacements, sorter);
		collectReplacements(node.alternate, replacements, sorter);
	}
	// 5. 論理演算子 cond && "class"
	else if (t.isLogicalExpression(node)) {
		collectReplacements(node.right, replacements, sorter);
	}
}

// ==========================================
// 4. File Processing & Main Execution
// ==========================================

// シングルトンとして初期化
const sorter = new TailwindSorter(_PRIORITY_GROUPS);

async function processFile(filePath: string): Promise<boolean> {
	try {
		const content = await readFile(filePath, "utf-8");
		const ast = parse(content, {
			sourceType: "module",
			plugins: ["typescript", "jsx"],
		});

		const replacements: { start: number; end: number; value: string }[] = [];

		// @ts-expect-error: babel traverse type definition mismatch
		traverse.default(ast, {
			// パターンA: JSX className
			JSXAttribute(path: NodePath<t.JSXAttribute>) {
				const node = path.node;
				if (t.isJSXIdentifier(node.name) && node.name.name === "className") {
					collectReplacements(node.value, replacements, sorter);
				}
			},
			// パターンB: 関数呼び出し (clsx, cva等)
			CallExpression(path: NodePath<t.CallExpression>) {
				const { callee, arguments: args } = path.node;
				let functionName = "";

				if (t.isIdentifier(callee)) {
					functionName = callee.name;
				} else if (
					t.isMemberExpression(callee) &&
					t.isIdentifier(callee.property)
				) {
					functionName = callee.property.name;
				}

				if (TARGET_FUNCTIONS.has(functionName)) {
					args.forEach((arg) => {
						collectReplacements(arg, replacements, sorter);
						// オブジェクト引数 (cva等) の値もチェック
						if (t.isObjectExpression(arg)) {
							arg.properties.forEach((prop) => {
								if (t.isObjectProperty(prop)) {
									collectReplacements(prop.value, replacements, sorter);
								}
							});
						}
					});
				}
			},
		});

		if (replacements.length > 0) {
			// 後ろから順に置換してインデックスずれを防ぐ
			replacements.sort((a, b) => b.start - a.start);

			let newContent = content;
			for (const rep of replacements) {
				newContent =
					newContent.slice(0, rep.start) +
					rep.value +
					newContent.slice(rep.end);
			}

			await writeFile(filePath, newContent, "utf-8");
			console.log(chalk.greenBright(`     ✅ Sorted: ${filePath}`));
			return true;
		}

		return false;
	} catch (err) {
		console.error(
			chalk.redBright(`     ❌ Error processing ${filePath}:`),
			err instanceof Error ? err.message : err,
		);
		return false;
	}
}

async function main(): Promise<void> {
	const separator =
		"|===============================================================";

	console.log(chalk.blueBright(separator));
	console.log(chalk.blueBright("|    TailwindSort Started!"));
	console.log(chalk.blueBright(separator));
	console.log();

	const files = await glob(["src/**/*.{js,jsx,ts,tsx}"]);
	if (files.length === 0) {
		console.log(chalk.greenBright("     No files found to process."));
		return;
	}

	const results = await Promise.all(files.map(processFile));
	const modifiedCount = results.filter(Boolean).length;

	console.log(
		chalk.yellowBright(
			`     Processed ${files.length} files. ${modifiedCount} files modified.`,
		),
	);
	console.log();
	console.log(chalk.blueBright(separator));
	console.log(chalk.blueBright("|    TailwindSort Finished!"));
	console.log(chalk.blueBright(separator));
}

main().catch(console.error);
