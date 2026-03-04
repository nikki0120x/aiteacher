// emails/AuthCodeEmail.tsx
import {
	Body,
	Container,
	Head,
	Html,
	Img,
	Section,
	Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface AuthCodeEmailProps {
	validationCode?: string;
}

export const PreviewProps: Required<AuthCodeEmailProps> = {
	validationCode: "123456",
};

const AuthCodeEmail = ({
	validationCode = PreviewProps.validationCode,
}: AuthCodeEmailProps) => (
	<Html lang="ja" dir="ltr">
		<Head>
			<meta charSet="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		</Head>
		<Tailwind>
			<Body>
				<Container>
					<Section className="my-3 w-full">
						<Img
							src="https://www.focalrina.com/logos/dark.webp"
							alt="Logo"
							width="128"
							className="mx-auto"
						/>
						<Text className="text-center font-black text-2xl text-sky-500">
							アカウント認証コード
						</Text>
					</Section>
					<Section className="mb-3 w-full rounded-4xl bg-slate-100 text-center">
						<Text className="m-4 font-medium text-base text-slate-950 text-left">
							親愛なるユーザー様へ
							<br />
							<br />
							FoCalrinaへのご登録ありがとうございます！
							<br />
							登録画面にて以下の6桁の認証コードを入力して、アカウントの作成を完了してください。
						</Text>
						<Text className="my-6 font-black text-4xl text-sky-500 tracking-widest text-center">
							{validationCode}
						</Text>
						<Text className="m-4 font-medium text-base text-slate-950 text-left">
							今後ともよろしくお願いいたします。
							<br />
							FoCalrina より
						</Text>
					</Section>
					<Section className="w-full">
						<Text className="text-center text-slate-500 text-sm">
							※このコードは
							<span className="text-sky-500"> 10分間 </span>
							有効です。
							<br />
							※このメールへの返信はできません。
						</Text>
					</Section>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default AuthCodeEmail;