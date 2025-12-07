/* src\features\auth\components\signIn.tsx */
"use client";
import type React from "react";
import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Divider, Button, Spinner } from "@heroui/react";
import { Mail, KeyRound, X, TriangleAlert } from "lucide-react";
import { Input, InputTips } from "@/components/ui";
import { signIn } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/useAuth";

interface SignInFormProps {
	closeModal: () => void;
	switchToSignUp: () => void;
}

type InputRef = React.ComponentRef<"input">;

export default function SignInForm({ switchToSignUp }: SignInFormProps) {
	const { closeModal } = useAuthStore();

	// ================================================================
	//     1. サインインフォーム
	// ================================================================

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const emailInputRef = useRef<InputRef>(null);
	const passwordInputRef = useRef<InputRef>(null);

	const handleClearEmail = () => {
		setEmail("");
		emailInputRef.current?.focus();
	};

	const handleClearPassword = () => {
		setPassword("");
		passwordInputRef.current?.focus();
	};

	// ================================================================
	//     2. パスワード 表示 / 非表示 切り替え
	// ================================================================

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);

		const res = await signIn.email({
			email: formData.get("email") as string,
			password: formData.get("password") as string,
		});

		if (res.error) {
			setError(res.error.message || "Something went wrong.");
		} else {
			closeModal();
		}

		setIsLoading(false);
	}

	const isFormValid = useMemo(() => {
		return email.length > 0 && password.length > 0;
	}, [email, password]);

	// ================================================================
	//     0. フロントエンド
	// ================================================================

	return (
		<div className="h-full w-full overflow-y-auto overflow-x-hidden px-4">
			<div className="relative mt-2 mb-6 flex h-8 w-full flex-row items-center justify-center">
				<Divider
					orientation="horizontal"
					className="h-px w-full flex-1 rounded-4xl bg-d3 dark:bg-l3"
				/>
				<span className="mx-4 font-bold text-d3 text-xl dark:text-l3">
					アカウント / サインイン
				</span>
				<Divider
					orientation="horizontal"
					className="h-px w-full flex-1 rounded-4xl bg-d3 dark:bg-l3"
				/>
			</div>
			<form
				onSubmit={handleSubmit}
				className="flex w-full flex-col items-center justify-start gap-4"
			>
				<div className="flex h-auto w-full flex-col items-center justify-center gap-4">
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
									className="h-10 w-10 rounded-4xl bg-transparent transition-all duration-250 hover:bg-ld"
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
						autoComplete="current-password"
						Icon={KeyRound}
						label="パスワード"
						value={password}
						ref={passwordInputRef}
						onChange={(e) => setPassword(e.target.value)}
						inputClassName={`${error ? "border-red" : ""}`}
						dynamicIconClassName={`${error ? "text-red!" : ""}`}
						labelClassName={`${error ? "text-red!" : ""}`}
						rightContent={
							password ? (
								<Button
									isIconOnly
									type="button"
									onPress={handleClearPassword}
									className="h-10 w-10 rounded-4xl bg-transparent transition-all duration-250 hover:bg-ld"
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
					aria-label="Submit SignIn Information"
					type="submit"
					isDisabled={isLoading || !isFormValid}
					className="my-4 h-16 w-full rounded-3xl bg-blue text-l1 transition-all duration-250"
				>
					{isLoading ? (
						<Spinner variant="dots" color="white" />
					) : (
						<span className="font-bold text-l1 text-xl">サインイン</span>
					)}
				</Button>
			</form>
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
					aria-label="SignUp Now"
					onPress={switchToSignUp}
					className="bg-transparent hover:bg-blue/10 focus-visible:bg-blue/10 active:bg-blue/10"
				>
					<span className="font-medium text-base text-blue">サインアップ</span>
				</Button>
			</div>
		</div>
	);
}
