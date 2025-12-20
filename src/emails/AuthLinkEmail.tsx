/* src\emails\AuthLinkEmail.tsx */
import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Img,
	Section,
	Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface AuthLinkEmailProps {
	verificationUrl?: string;
}

export const PreviewProps: Required<AuthLinkEmailProps> = {
	verificationUrl: "https://example.com/verify?token=123",
};

const AuthLinkEmail = ({
	verificationUrl = PreviewProps.verificationUrl,
}: AuthLinkEmailProps) => (
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
						<Text className="text-2xl font-black text-sky-500 text-center">
							アカウント認証
						</Text>
					</Section>
					<Section className="mb-3 w-full rounded-4xl bg-slate-100">
						<Text className="m-4 text-base font-medium text-slate-950">
							親愛なるユーザー様へ
							<br />
							<br />
							FoCalrinaへのご登録ありがとうございます！
							<br />
							下の「認証」ボタンをクリックして、アカウントの認証を完了してください。
							<br />
							今後ともよろしくお願いいたします。
							<br />
							<br />
							FoCalrina より
						</Text>
					</Section>
					<Section className="w-full">
						<Button
							href={verificationUrl}
							className="py-4 w-full text-2xl font-black text-slate-950 text-center rounded-4xl bg-sky-500"
						>
							認証
						</Button>
						<Text className="text-sm text-slate-500 text-center">
							※このリンクは
							<span className="text-sky-500"> 1時間 </span>
							で期限切れになります。
							<br />
							※このメールへの返信はできません。
						</Text>
					</Section>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default AuthLinkEmail;
