import { heroui } from "@heroui/react";

const colorBlue = "#006de2";

export default heroui({
	themes: {
		light: {
			colors: {
				primary: {
					DEFAULT: colorBlue,
				},
			},
		},

		dark: {
			colors: {
				primary: {
					DEFAULT: colorBlue,
				},
			},
		},
	},
});
