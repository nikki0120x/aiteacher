import QuestionEn_Us from "@/assets/logos/question-en-US.svg";
import QuestionJa_JP from "@/assets/logos/question-ja-JP.svg";

export const Logos = {
	"Question_ja-JP": (props: React.SVGProps<SVGSVGElement>) => (
		<QuestionJa_JP {...props} />
	),
	"Question_en-US": (props: React.SVGProps<SVGSVGElement>) => (
		<QuestionEn_Us {...props} />
	),
} as const;

export type Logos = keyof typeof Logos;
