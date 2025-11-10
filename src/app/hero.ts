import { heroui } from "@heroui/react";

const colorBlue = "#00a6f4";

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
