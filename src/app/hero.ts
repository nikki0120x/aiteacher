/* src\app\hero.ts */
import { heroui } from "@heroui/react";

const colorBlue = "#00bfff";

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
