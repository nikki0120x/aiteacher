/* src\features\auth\components\register-form.tsx */
"use client";
import type React from "react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation"; // 👈 [修正点 2] この行は残す（useRouter()は削除）
import { Divider, Button, Form, Input, Spinner } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuthStore } from "@/stores/useAuth";
import { createUserInDb } from "@/actions/auth-actions";

interface RegisterFormProps {
	closeModal: () => void;
	switchToLogin: () => void;
}

export default function RegisterForm({
	closeModal,
	switchToLogin,
}: RegisterFormProps) {
	const {
		registerEmail: email,
		registerPassword: password,
		setRegisterEmail: setEmail,
		setRegisterPassword: setPassword,
	} = useAuthStore();
	// const router = useRouter(); // 👈 [修正点 3] Biome警告（未使用変数）を解消するため削除

	// ================================================================
	//     1. 登録フォーム
	// ================================================================

	const [submitted, setSubmitted] = useState(false);
	const isFormInvalid = email.length === 0 || password.length === 0;

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitted(true);

		const defaultName = email.split('@')[0] || 'New User';
		// better-authの戻り値全体を受け取る 👈 [修正点 1]
		const result = await authClient.signUp.email({
			email,
			password,
			name: defaultName,
		});

		// エラーチェックは result.error を使う 👈 [修正点 1]
		if (result.error) {
			alert(`登録に失敗しました: ${result.error.message}`);
			setSubmitted(false);
			return;
		}

		// ユーザーオブジェクトからIDを取得。型は result.data.user.id を想定 👈 [修正点 1]
		const authId = result.data?.user?.id;

		if (!authId) {
			alert("認証サービスからユーザーIDを取得できませんでした。");
			setSubmitted(false);
			return;
		}

		// DB登録用のServer Actionを呼び出す
		const dbError = await createUserInDb(email, authId);

		if (dbError) {
			alert(`データベース登録に失敗しました: ${dbError.message}`);
			// 必要に応じてここで better-auth 側のユーザーを削除する処理 (ロールバック)
			setSubmitted(false);
			return;
		}


		closeModal();
		setSubmitted(false);
	};

	// ================================================================
	//     2. パスワード 表示 / 非表示 切り替え
	// ================================================================

	const [isVisible, setIsVisible] = useState(false);
	const toggleVisibility = () => setIsVisible(!isVisible);

	// ================================================================
	//     0. フロントエンド
	// ================================================================

	return (
		<div className="h-full w-full">
			<div className="relative mt-2 mb-6 flex h-8 w-full flex-row items-center justify-center">
				<Divider
					orientation="horizontal"
					className="h-px w-full flex-1 rounded-4xl bg-d2 dark:bg-l2"
				/>
				<span className="mx-4 font-bold text-d2 text-xl dark:text-l2">
					アカウント登録
				</span>
				<Divider
					orientation="horizontal"
					className="h-px w-full flex-1 rounded-4xl bg-d2 dark:bg-l2"
				/>
			</div>
			<Form
				onSubmit={onSubmit}
				className="flex w-full flex-col items-center justify-start gap-4"
			>
				<Input
					isRequired
					label="メールアドレス"
					type="email"
					maxLength={255}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="[&>div:first-child]:h-16 [&>div:first-child]:px-4 [&>div:nth-child(2)]:bg-transparent [&>div]:rounded-3xl [&>div]:bg-l3 [&>div]:dark:bg-d3 [&_input]:text-base"
				/>
				<Input
					isRequired
					label="パスワード"
					type={isVisible ? "text" : "password"}
					minLength={8}
					maxLength={32}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					endContent={
						<Button
							aria-label="Toggle Password Visibility"
							isIconOnly
							onPress={toggleVisibility}
							className="h-full w-12 rounded-2xl bg-transparent text-d3 transition-all duration-250 dark:text-l3"
						>
							{isVisible ? <Eye size="20" /> : <EyeClosed size="20" />}
						</Button>
					}
					className="[&>div:first-child]:h-16 [&>div:first-child]:px-4 [&>div:nth-child(2)]:bg-transparent [&>div]:rounded-3xl [&>div]:bg-l3 [&>div]:dark:bg-d3 [&_input]:text-base"
				/>
				<Button
					isDisabled={submitted || isFormInvalid}
					aria-label="Submit Register Information"
					type="submit"
					className="my-4 h-16 w-full rounded-3xl bg-blue text-l1 transition-all duration-250"
				>
					{submitted ? (
						<Spinner variant="dots" color="white" />
					) : (
						<span className="font-medium text-xl">登録</span>
					)}
				</Button>
			</Form>
			<div className="flex flex-row items-center justify-center">
				<span className="font-medium text-base text-d2 dark:text-l2">
					既にアカウントを登録済:&emsp;
				</span>
				<Button
					aria-label="Login Now"
					className="bg-transparent hover:bg-blue/10 focus-visible:bg-blue/10 active:bg-blue/10"
					onPress={switchToLogin}
				>
					<span className="font-medium text-base text-blue">ログイン</span>
				</Button>
			</div>
		</div>
	);
}