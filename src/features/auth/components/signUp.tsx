/* src\features\auth\components\register-form.tsx */
"use client";
import { Button, Divider, Spinner } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Key, KeyRound, Mail, TriangleAlert, UserPen, X } from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Input, InputTips } from "@/components/ui";
import { signUp } from "@/lib/auth-client";

interface SignUpFormProps {
	closeModal: () => void;
	switchToSignIn: () => void;
}

type InputRef = React.ComponentRef<"input">;

export default function SignUpForm({ switchToSignIn }: SignUpFormProps) {
	// ================================================================
	//     1. サインアップフォーム
	// ================================================================

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const nameInputRef = useRef<InputRef>(null);
	const emailInputRef = useRef<InputRef>(null);
	const passwordInputRef = useRef<InputRef>(null);
	const passwordConfirmInputRef = useRef<InputRef>(null);

	const handleClearName = () => {
		setName("");
		nameInputRef.current?.focus();
	};

	const handleClearEmail = () => {
		setEmail("");
		emailInputRef.current?.focus();
	};

	const handleClearPassword = () => {
		setPassword("");
		passwordInputRef.current?.focus();
	};

	const handleClearPasswordConfirm = () => {
		setPasswordConfirm("");
		passwordConfirmInputRef.current?.focus();
	};

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		if (password !== passwordConfirm) {
			setError("パスワードと確認用パスワードが一致しません。");
			setIsLoading(false);
			return;
		}

		const formData = new FormData(e.currentTarget);
		const submittedEmail = formData.get("email") as string;

		const res = await signUp.email({
			name: formData.get("username") as string,
			email: submittedEmail,
			password: formData.get("password") as string,
		});

		if (res.error) {
			setError(res.error.message || "アカウント作成中にエラーが発生しました。");
		} else {
			try {
				await fetch("/api/auth/send-auth-link", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: submittedEmail }),
				});
			} catch (linkError) {
				console.error("認証リンク送信エラー:", linkError);
				alert(
					"アカウントを作成しましたが、認証メールの送信に失敗しました。時間をおいて再度お試しください。",
				);
			}

			alert(
				`アカウントを作成しました。${submittedEmail}に認証リンクを送信しました。メールをご確認ください。`,
			);
			switchToSignIn();
		}

		setIsLoading(false);
	}

	const isFormValid = useMemo(() => {
		return (
			name.length >= 4 &&
			email.length > 0 &&
			password.length >= 8 &&
			password === passwordConfirm
		);
	}, [name, email, password, passwordConfirm]);

	// ================================================================
	//     2. パスワード 表示 / 非表示 切り替え
	// ================================================================

	// ================================================================
	//     0. フロントエンド
	// ================================================================

	return (
		<div className="overflow-y-auto overflow-x-hidden px-4 w-full h-full">
			<div className="flex relative flex-row justify-center items-center mt-2 mb-6 w-full h-8">
				<Divider
					orientation="horizontal"
					className="flex-1 w-full h-px rounded-4xl bg-d3 dark:bg-l3"
				/>
				<span className="mx-4 text-xl font-bold text-d3 dark:text-l3">
					アカウント / サインアップ
				</span>
				<Divider
					orientation="horizontal"
					className="flex-1 w-full h-px rounded-4xl bg-d3 dark:bg-l3"
				/>
			</div>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-4 justify-start items-center w-full"
			>
				<div className="flex flex-col gap-4 justify-center items-center w-full h-auto">
					<Input
						required
						name="username"
						type="text"
						minLength={4}
						maxLength={16}
						pattern="[a-zA-Z0-9]*"
						autoComplete="username"
						Icon={UserPen}
						label="ユーザーネーム"
						value={name}
						ref={nameInputRef}
						onChange={(e) => setName(e.target.value)}
						inputClassName={`${error ? "border-red" : ""} ${name ? "pr-12" : ""}`}
						dynamicIconClassName={`${error ? "text-red!" : ""}`}
						labelClassName={`${error ? "text-red!" : ""}`}
						rightContent={
							name ? (
								<Button
									isIconOnly
									type="button"
									onPress={handleClearName}
									className="w-10 h-10 bg-transparent rounded-4xl transition-all duration-250 hover:bg-ld"
								>
									<X className="text-d1 dark:text-l1" />
								</Button>
							) : undefined
						}
					/>
					<Input
						required
						name="email"
						type="email"
						maxLength={254}
						autoComplete="email"
						Icon={Mail}
						label="メールアドレス"
						value={email}
						ref={emailInputRef}
						onChange={(e) => setEmail(e.target.value)}
						inputClassName={`${error ? "border-red" : ""} ${email ? "pr-12" : ""}`}
						dynamicIconClassName={`${error ? "text-red!" : ""}`}
						labelClassName={`${error ? "text-red!" : ""}`}
						rightContent={
							email ? (
								<Button
									isIconOnly
									type="button"
									onPress={handleClearEmail}
									className="w-10 h-10 bg-transparent rounded-4xl transition-all duration-250 hover:bg-ld"
								>
									<X className="text-d1 dark:text-l1" />
								</Button>
							) : undefined
						}
					/>
					<Input
						required
						name="password"
						type="password"
						minLength={8}
						maxLength={32}
						pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[-/:;()¥&@&quot;.,?!'\[\]{}#%^*+=_\\|~<>$€£･`]).{8,32}"
						autoComplete="new-password"
						Icon={KeyRound}
						label="パスワード"
						value={password}
						ref={passwordInputRef}
						onChange={(e) => setPassword(e.target.value)}
						inputClassName={`${error ? "border-red" : ""} ${password ? "pr-12" : ""}`}
						dynamicIconClassName={`${error ? "text-red!" : ""}`}
						labelClassName={`${error ? "text-red!" : ""}`}
						rightContent={
							password ? (
								<Button
									isIconOnly
									type="button"
									onPress={handleClearPassword}
									className="w-10 h-10 bg-transparent rounded-4xl transition-all duration-250 hover:bg-ld"
								>
									<X className="text-d1 dark:text-l1" />
								</Button>
							) : undefined
						}
					/>
					<Input
						required
						name="passwordConfirm"
						type="password"
						minLength={8}
						maxLength={32}
						pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[-/:;()¥&@&quot;.,?!'\[\]{}#%^*+=_\\|~<>$€£･`]).{8,32}"
						autoComplete="new-password"
						Icon={Key}
						label="パスワードを確認"
						value={passwordConfirm}
						ref={passwordConfirmInputRef}
						onChange={(e) => setPasswordConfirm(e.target.value)}
						inputClassName={`${error ? "border-red" : ""} ${passwordConfirm ? "pr-12" : ""}`}
						dynamicIconClassName={`${error ? "text-red!" : ""}`}
						labelClassName={`${error ? "text-red!" : ""}`}
						rightContent={
							passwordConfirm ? (
								<Button
									isIconOnly
									type="button"
									onPress={handleClearPasswordConfirm}
									className="w-10 h-10 bg-transparent rounded-4xl transition-all duration-250 hover:bg-ld"
								>
									<X className="text-d1 dark:text-l1" />
								</Button>
							) : undefined
						}
					/>
					<AnimatePresence>
						{error && (
							<motion.div
								key="error-tip"
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.25 }}
								className="w-full"
							>
								<InputTips
									Icon={TriangleAlert}
									spanText={error || ""}
									dynamicIconClassName="text-red"
									spanClassName="text-red"
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
				<Button
					aria-label="Submit SignUp Information"
					type="submit"
					isDisabled={isLoading || !isFormValid}
					className="my-4 w-full h-16 text-l1 rounded-3xl transition-all duration-250 bg-blue"
				>
					{isLoading ? (
						<Spinner variant="dots" color="white" />
					) : (
						<span className="text-xl font-bold text-l1">サインアップ</span>
					)}
				</Button>
			</form>
			<div className="flex flex-row justify-center items-center">
				<span className="text-base font-medium text-d2 dark:text-l2">
					既にアカウントをサインアップ済:&emsp;
				</span>
				<Button
					aria-label="SignUp Now"
					className="bg-transparent hover:bg-blue/10 focus-visible:bg-blue/10 active:bg-blue/10"
					onPress={switchToSignIn}
				>
					<span className="text-base font-medium text-blue">サインイン</span>
				</Button>
			</div>
		</div>
	);
}
