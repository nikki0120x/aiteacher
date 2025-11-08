import { heroui } from "@heroui/react";

const colorL1 = "#fafaf9";
const colorD1 = "#0c0a09";
const colorBlue = "#00a6f4";

export default heroui({
	themes: {
		light: {
			colors: {
				primary: {
					DEFAULT: colorBlue,
					foreground: colorL1,
				},
				background: colorD1,
				foreground: colorL1,
			},
		},

		dark: {
			colors: {
				primary: {
					DEFAULT: colorBlue,
					foreground: colorD1,
				},
				background: colorD1,
				foreground: colorL1,
			},
		},
	},
});
