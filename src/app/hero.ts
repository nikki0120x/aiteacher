import { heroui } from "@heroui/react";

const colorBlue = "#00a6f4";
const colorRed = "#ff2815";

export default heroui({
	themes: {
		light: {
			colors: {
				primary: {
					DEFAULT: colorBlue,
				},
				danger: {
					DEFAULT: colorRed,
				},
			},
		},

		dark: {
			colors: {
				primary: {
					DEFAULT: colorBlue,
				},
				danger: {
					DEFAULT: colorRed,
				},
			},
		},
	},
});
