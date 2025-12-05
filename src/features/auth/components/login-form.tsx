/* src\features\auth\components\login-form.tsx */
"use client";
import type React from "react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Divider, Button, Form, Input, Spinner } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";
import { useAuthStore } from "@/stores/useAuth";

interface LoginFormProps {
	closeModal: () => void;
	switchToRegister: () => void;
}

export default function LoginForm({
	closeModal,
	switchToRegister,
}: LoginFormProps) {
	const {
		loginEmail: email,
		loginPassword: password,
		setLoginEmail: setEmail,
		setLoginPassword: setPassword,
	} = useAuthStore();
	const router = useRouter();

	// ================================================================
	//     1. ログインフォーム
	// ================================================================

	const [submitted, setSubmitted] = useState(false);
	const isFormInvalid = email.length === 0 || password.length === 0;

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitted(true);

		const { error } = await authClient.signIn.email({
			email,
			password,
		});

		if (error) {
			alert(`ログインに失敗しました: ${error.message}`);
			setSubmitted(false);
			return;
		}

		closeModal();
		setSubmitted(false);
		router.push("/dashboard");
		router.refresh();
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
					アカウントログイン
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
					aria-label="Submit Login Information"
					type="submit"
					className="my-4 h-16 w-full rounded-3xl bg-blue text-l1 transition-all duration-250"
				>
					{submitted ? (
						<Spinner variant="dots" color="white" />
					) : (
						<span className="font-medium text-xl">ログイン</span>
					)}
				</Button>
			</Form>
			<div className="flex flex-row items-center justify-between">
				<Button
					aria-label="Forgot Password"
					className="bg-transparent hover:bg-blue/10 focus-visible:bg-blue/10 active:bg-blue/10"
				>
					<span className="font-medium text-base text-blue">
						パスワードを忘れた
					</span>
				</Button>
				<Button
					aria-label="Register Now"
					onPress={switchToRegister}
					className="bg-transparent hover:bg-blue/10 focus-visible:bg-blue/10 active:bg-blue/10"
				>
					<span className="font-medium text-base text-blue">新規登録</span>
				</Button>
			</div>
		</div>
	);
}
