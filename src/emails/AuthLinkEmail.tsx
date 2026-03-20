import {
	Body,
	Container,
	Head,
	Html,
	Img,
	Section,
	Font,
	Text,
	Hr,
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

			<Font
				fontFamily="Zen Maru Gothic"
				fallbackFontFamily="sans-serif"
				webFont={{
					url: "https://fonts.gstatic.com/s/zenmarugothic/v11/n7bdE-98L_9B79B1f8Rzz_XyY5-p7_D7.woff2",
					format: "woff2",
				}}
				fontWeight={500}
				fontStyle="normal"
			/>
		</Head>

		<Tailwind
			config={{
				theme: {
					extend: {
						fontFamily: {
							sans: ["Zen Maru Gothic", "ui-sans-serif", "system-ui", "sans-serif"],
						},
						colors: {
							l1: "hsl(0, 0%, 95%)",
							l2: "hsl(0, 0%, 90%)",
							l3: "hsl(0, 0%, 85%)",
							l4: "hsl(0, 0%, 80%)",
							l5: "hsl(0, 0%, 75%)",
							l6: "hsl(0, 0%, 70%)",
							l7: "hsl(0, 0%, 65%)",
							l8: "hsl(0, 0%, 60%)",
							l9: "hsl(0, 0%, 55%)",
							d1: "hsl(0, 0%, 5%)",
							d2: "hsl(0, 0%, 10%)",
							d3: "hsl(0, 0%, 15%)",
							d4: "hsl(0, 0%, 20%)",
							d5: "hsl(0, 0%, 25%)",
							d6: "hsl(0, 0%, 30%)",
							d7: "hsl(0, 0%, 35%)",
							d8: "hsl(0, 0%, 40%)",
							d9: "hsl(0, 0%, 45%)",

							white: "hsl(0, 0%, 100%)",
							gray: "hsl(0, 0%, 50%)",
							black: "hsl(0, 0%, 0%)",
							red: "hsl(15, 100%, 50%)",
							orange: "hsl(30, 100%, 50%)",
							yellow: "hsl(45, 100%, 50%)",
							green: "hsl(135, 100%, 50%)",
							blue: "hsl(195, 100%, 50%)",
							indigo: "hsl(255, 100%, 50%)",
							violet: "hsl(300, 100%, 50%)",
						},
					},
				},
			}}
		>
			<Body className="font-sans">
				<Container className="select-none">
					<Section className="w-full p-2">
						<Img
							src="https://aiteacher.focalrina.com/images/logos/png/Logo_FoCalrina_small_theme.png"
							alt="The FoCarina Logo"
							width="120"
							className=" p-2"
						/>

						<Text className="p-2 text-left font-black text-xl text-blue m-0!">
							アカウント認証コード
						</Text>

						<Hr className="border-blue" />
					</Section>

					<Section className="w-full p-2">
						<Text className="font-medium text-base text-d2 text-left">
							親愛なるユーザー様へ
							<br />
							<br />
							FoCalrinaへの仮登録をありがとうございます！
							<br />
							登録画面にて，以下の6桁の認証コードを入力し，アカウントを作成してください。
						</Text>

						<Text className="font-black text-4xl text-blue tracking-widest text-center select-all!">
							<span className="text-sm font-medium text-blue text-center block select-none! pb-2">
								Verification Code:
							</span>
							{validationCode}
						</Text>

						<Text className="font-medium text-base text-d2 text-left">
							今後とも宜しくお願いします。
							<br />
							<br />
							FoCalrina
						</Text>
					</Section>

					<Section className="w-full p-2">
						<Text className="text-left text-d5 text-sm font-medium m-0!">
							※このコードは
							<span className="text-blue"> 10分間 </span>
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