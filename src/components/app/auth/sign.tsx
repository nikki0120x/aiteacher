"use client";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { z } from "zod";
import {
	checkActionRateLimit,
	markEmailAsVerified,
	recordFailedAttempt,
	resetRateLimit,
	sendOtpCode,
	verifyOtpCode,
} from "@/app/actions/auth";
import { ActivityIndicator, Button } from "@/components/ui/index";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { signIn, signOut, signUp } from "@/lib/auth-client";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	// ユーザー・認証関連
	USER_ALREADY_EXISTS:
		"このメールアドレスまたはユーザーネームは既に登録されています。",
	USER_NOT_FOUND: "ユーザーが見つかりません。登録はお済みですか？",
	INVALID_EMAIL: "メールアドレスの形式が正しくありません。",
	INVALID_EMAIL_OR_PASSWORD:
		"メールアドレスまたはパスワードが正しくありません。",
	WRONG_PASSWORD: "パスワードが間違っています。",
	WEAK_PASSWORD: "パスワードが弱すぎます。",
	EMAIL_NOT_VERIFIED:
		"メールアドレスが確認されていません。認証を行ってください。",

	// アカウント作成・セッション関連
	FAILED_TO_CREATE_USER: "アカウントの作成に失敗しました。再度お試しください。",
	UNAUTHORIZED: "認証されていません。再度ログインしてください。",
	FORBIDDEN: "アクセス権限がありません。",
	TOKEN_EXPIRED: "セッションの有効期限が切れました。再度ログインしてください。",
	TOKEN_INVALID: "無効なトークンです。",

	// ソーシャルログイン関連
	SOCIAL_ACCOUNT_ALREADY_LINKED:
		"このアカウントは既に他のユーザーに紐付いています。",
	ACCOUNT_NOT_LINKED: "アカウントが紐付いていません。",

	// OTP (ワンタイムコード) 関連 ※アクション側から返される想定
	INVALID_OTP: "認証コードが正しくありません。",
	OTP_EXPIRED: "認証コードの有効期限が切れています。再送信してください。",

	// システム・ネットワーク関連
	TOO_MANY_REQUESTS:
		"試行回数が多すぎます。しばらく時間を置いてから再度お試しください。",
	INTERNAL_SERVER_ERROR:
		"サーバーエラーが発生しました。時間を置いて再度お試しください。",
	NETWORK_ERROR: "ネットワークエラーが発生しました。通信環境をご確認ください。",
	UNKNOWN_ERROR: "予期せぬエラーが発生しました。時間をおいてお試しください。",
};

interface AuthError {
	code?: string;
	message?: string;
	status?: string;
}

// エラーメッセージを取得
const getErrorMessage = (
	error: unknown,
	fallback: string = AUTH_ERROR_MESSAGES.UNKNOWN_ERROR,
) => {
	if (!error) return fallback;

	if (typeof error === "string") {
		return AUTH_ERROR_MESSAGES[error] || error;
	}

	if (typeof error === "object" && error !== null) {
		const err = error as AuthError;

		if (err.code && AUTH_ERROR_MESSAGES[err.code]) {
			return AUTH_ERROR_MESSAGES[err.code];
		}

		const isNetworkError =
			err.status === "FETCH_ERROR" ||
			err.message?.toLowerCase().includes("fetch") ||
			err.message?.toLowerCase().includes("network");

		if (isNetworkError) {
			return AUTH_ERROR_MESSAGES.NETWORK_ERROR;
		}

		if (err.message) return err.message;
	}

	return fallback;
};

const NameRegex = /^[a-zA-Z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
const NameMessage = "大文字、小文字、数字、記号のみ使用できます！";

const PasswordRegex =
	/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)(?=.*?[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[a-zA-Z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
const PasswordMessage =
	"小文字，大文字，数字，記号を各々1文字以上含めてください！";

// 接続
const SigninSchema = z.object({
	identifier: z.string().min(4, "4文字以上で入力してください！").max(64),
	password: z.string().min(8).max(32).regex(PasswordRegex, PasswordMessage),
});

// 登録
const SignupSchema = z
	.object({
		name: z
			.string()
			.min(4, "4文字以上で入力してください！")
			.max(16, "16文字以下で入力してください！")
			.regex(NameRegex, NameMessage),
		email: z.email("正しい形式で入力してください！").min(4).max(64),
		code: z.string().length(6, "認証コードは6桁の数字で入力してください！"),
		password: z.string().min(8).max(32).regex(PasswordRegex, PasswordMessage),
		confirmPassword: z.string(),
		termsAccepted: z.literal(true, {
			message: "利用規約とプライバシーポリシーに同意してください。",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "パスワードが一致しません！",
		path: ["confirmPassword"],
	});

type AuthMode = "signin" | "signup" | "signout";

export function Sign({ onSuccess }: { onSuccess?: () => void }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { executeRecaptcha } = useGoogleReCaptcha();

	const [mode, setMode] = useState<AuthMode>(() => {
		return (searchParams.get("mode") as AuthMode) || "signin";
	});

	const [signinIdentifier, setSigninIdentifier] = useState("");
	const [signinPassword, setSigninPassword] = useState("");

	const [signupName, setSignupName] = useState("");
	const [signupEmail, setSignupEmail] = useState("");
	const [signupCode, setSignupCode] = useState("");
	const [signupPassword, setSignupPassword] = useState("");
	const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);

	const [errors, setErrors] = useState<{
		identifier?: string;
		name?: string;
		email?: string;
		code?: string;
		password?: string;
		confirmPassword?: string;
		termsAccepted?: string;
		root?: string;
	}>({});
	const [isSendingCode, setIsSendingCode] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [lockouts, setLockouts] = useState({ signin: 0, signup: 0, otp: 0 });

	const isSigninInvalid =
		signinIdentifier.length === 0 ||
		signinPassword.length === 0 ||
		isLoading ||
		lockouts.signin > 0;
	const isSignupInvalid =
		signupName.length === 0 ||
		signupEmail.length === 0 ||
		signupCode.length === 0 ||
		signupPassword.length === 0 ||
		signupConfirmPassword.length === 0 ||
		!termsAccepted ||
		isLoading ||
		lockouts.signup > 0;
	const isEmailInvalid =
		!SignupSchema.shape.email.safeParse(signupEmail).success;

	const [countdown, setCountdown] = useState(0);
	const [hasSent, setHasSent] = useState(false);

	const applyLockout = (
		action: "signin" | "signup" | "otp",
		lockoutUntil: string,
	) => {
		const expiryTime = new Date(lockoutUntil).getTime();
		localStorage.setItem(`lockout_${action}`, expiryTime.toString());
		setErrors({ root: `試行回数が多すぎます。10分後にお試しください。` });
		setLockouts((prev) => ({
			...prev,
			[action]: Math.ceil((expiryTime - Date.now()) / 1000),
		}));
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	useEffect(() => {
		const updateLockouts = () => {
			const actions = ["signin", "signup", "otp"] as const;
			const newLockouts = { signin: 0, signup: 0, otp: 0 };

			actions.forEach((action) => {
				const expiry = localStorage.getItem(`lockout_${action}`);
				if (expiry) {
					const remaining = Math.ceil(
						(parseInt(expiry, 10) - Date.now()) / 1000,
					);
					if (remaining > 0) newLockouts[action] = remaining;
					else localStorage.removeItem(`lockout_${action}`);
				}
			});
			setLockouts(newLockouts);
		};

		updateLockouts();
		const timer = setInterval(updateLockouts, 1000);
		window.addEventListener("focus", updateLockouts);

		return () => {
			clearInterval(timer);
			window.removeEventListener("focus", updateLockouts);
		};
	}, []);

	useEffect(() => {
		const updateCountdown = () => {
			const expiry = localStorage.getItem("otp_expiry");
			if (!expiry) {
				setCountdown(0);
				return;
			}

			const remaining = Math.ceil((parseInt(expiry, 10) - Date.now()) / 1000);

			if (remaining <= 0) {
				setCountdown(0);
				localStorage.removeItem("otp_expiry");
			} else {
				setCountdown(remaining);
				setHasSent(true);
			}
		};

		updateCountdown();
		const timer = setInterval(updateCountdown, 1000);
		window.addEventListener("focus", updateCountdown);

		return () => {
			clearInterval(timer);
			window.removeEventListener("focus", updateCountdown);
		};
	}, []);

	// 接続変化
	const handleSigninChange = (
		field: "identifier" | "password",
		value: string,
	) => {
		if (field === "identifier") setSigninIdentifier(value);
		if (field === "password") setSigninPassword(value);

		setErrors((prev) => ({ ...prev, identifier: undefined, root: undefined }));
	};

	// 登録変化
	const handleSignupChange = (
		field:
			| "name"
			| "email"
			| "code"
			| "password"
			| "confirmPassword"
			| "termsAccepted",
		value: string | boolean,
	) => {
		if (field === "name") setSignupName(value as string);
		if (field === "email") setSignupEmail(value as string);
		if (field === "code") setSignupCode(value as string);
		if (field === "password") setSignupPassword(value as string);
		if (field === "confirmPassword") setSignupConfirmPassword(value as string);
		if (field === "termsAccepted") setTermsAccepted(value as boolean);

		setErrors((prev) => ({ ...prev, [field]: undefined, root: undefined }));
	};

	// 方式切替
	const switchMode = (newMode: AuthMode) => {
		setMode(newMode);
		setErrors({});

		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			params.set("mode", newMode);
			const newUrl = `${window.location.pathname}?${params.toString()}`;
			window.history.replaceState(null, "", newUrl);
		}
	};

	// 接続処理
	const handleSignin = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = SigninSchema.safeParse({
			identifier: signinIdentifier,
			password: signinPassword,
		});

		if (!result.success) {
			const fieldErrors = result.error.flatten((i) => i.message).fieldErrors;
			setErrors({ identifier: fieldErrors.identifier?.[0] });
			return;
		}

		setErrors({});
		setIsLoading(true);

		try {
			// reCAPTCHA トークンの取得
			if (!executeRecaptcha) {
				setErrors({ root: "システムエラー：reCAPTCHAが準備できていません。" });
				setIsLoading(false);
				return;
			}
			const recaptchaToken = await executeRecaptcha("signin");

			// トークンを検証へ渡す
			const check = await checkActionRateLimit("signin", recaptchaToken);
			if (check.locked) {
				applyLockout("signin", check.lockoutUntil ?? new Date().toISOString());
				setIsLoading(false);
				return;
			}

			const { error } = await signIn.email({
				email: signinIdentifier,
				password: signinPassword,
			});

			if (error) {
				const failRecord = await recordFailedAttempt("signin");
				if (failRecord.locked) {
					applyLockout(
						"signin",
						failRecord.lockoutUntil ?? new Date().toISOString(),
					);
				} else {
					setErrors({ root: getErrorMessage(error) });
				}
			} else {
				await resetRateLimit("signin");
				router.refresh();

				if (onSuccess) onSuccess();
				else router.back();
			}
		} catch (err) {
			setErrors({ root: getErrorMessage(err) });
		} finally {
			setIsLoading(false);
		}
	};

	// 登録処理
	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = SignupSchema.safeParse({
			name: signupName,
			email: signupEmail,
			code: signupCode,
			password: signupPassword,
			confirmPassword: signupConfirmPassword,
			termsAccepted,
		});

		if (!result.success) {
			const fieldErrors = result.error.flatten((i) => i.message).fieldErrors;
			setErrors({
				name: fieldErrors.name?.[0],
				email: fieldErrors.email?.[0],
				code: fieldErrors.code?.[0],
				password: fieldErrors.password?.[0],
				confirmPassword: fieldErrors.confirmPassword?.[0],
				termsAccepted: fieldErrors.termsAccepted?.[0],
			});
			return;
		}

		setErrors({});
		setIsLoading(true);

		try {
			if (!executeRecaptcha) {
				setErrors({ root: "システムエラー：reCAPTCHAが準備できていません。" });
				setIsLoading(false);
				return;
			}
			const recaptchaToken = await executeRecaptcha("signup");

			const check = await checkActionRateLimit("signup", recaptchaToken);
			if (check.locked) {
				applyLockout("signup", check.lockoutUntil ?? new Date().toISOString());
				setIsLoading(false);
				return;
			}

			const verifyRes = await verifyOtpCode(signupEmail, signupCode);
			if (verifyRes.error) {
				if (verifyRes.lockoutUntil) applyLockout("otp", verifyRes.lockoutUntil);
				else setErrors({ root: getErrorMessage(verifyRes.error) });
				setIsLoading(false);
				return;
			}

			const { error } = await signUp.email({
				email: signupEmail,
				password: signupPassword,
				name: signupName || "",
			});

			if (error) {
				const failRecord = await recordFailedAttempt("signup");
				if (failRecord.locked) {
					applyLockout(
						"signup",
						failRecord.lockoutUntil ?? new Date().toISOString(),
					);
				} else {
					setErrors({ root: getErrorMessage(error) });
				}
			} else {
				await resetRateLimit("signup");
				await markEmailAsVerified(signupEmail);
				router.refresh();
				if (onSuccess) onSuccess();
				else router.back();
			}
		} catch (err) {
			setErrors({ root: getErrorMessage(err) });
		} finally {
			setIsLoading(false);
		}
	};

	// 送信コード処理
	const handleSendCode = async () => {
		setErrors((prev) => ({ ...prev, email: undefined, root: undefined }));

		if (isEmailInvalid) {
			const emailResult = SignupSchema.shape.email.safeParse(signupEmail);
			if (!emailResult.success) {
				setErrors((prev) => ({
					...prev,
					email: emailResult.error.issues[0].message,
				}));
			}
			return;
		}

		setIsSendingCode(true);

		try {
			if (!executeRecaptcha) {
				setErrors({ root: "システムエラー：reCAPTCHAが準備できていません。" });
				setIsSendingCode(false);
				return;
			}
			const recaptchaToken = await executeRecaptcha("otp");

			const check = await checkActionRateLimit("otp", recaptchaToken);
			if (check.locked) {
				applyLockout("otp", check.lockoutUntil ?? new Date().toISOString());
				setIsSendingCode(false);
				return;
			}

			const res = await sendOtpCode(signupEmail);

			if (res.error) {
				setErrors((prev) => ({ ...prev, root: getErrorMessage(res.error) }));
			} else {
				const duration = 60;
				const expiry = Date.now() + duration * 1000;
				localStorage.setItem("otp_expiry", expiry.toString());

				setCountdown(duration);
				setHasSent(true);
			}
		} catch (err) {
			setErrors((prev) => ({ ...prev, root: getErrorMessage(err) }));
		} finally {
			setIsSendingCode(false);
		}
	};

	// 外部認証処理
	const handleSocialAuth = async (provider: "google") => {
		setErrors({});
		try {
			const { error } = await signIn.social({ provider, callbackURL: "/" });
			if (error) {
				setErrors({ root: getErrorMessage(error) });
			}
		} catch (err) {
			setErrors({ root: getErrorMessage(err) });
		}
	};

	// 切断処理
	const handleSignout = async () => {
		setErrors({});
		setIsLoading(true);

		try {
			const { error } = await signOut();

			if (error) {
				setErrors({
					root: getErrorMessage(
						error,
						"切断に失敗しました。再度お試しください。",
					),
				});
			} else {
				router.refresh();
				if (onSuccess) onSuccess();
				else router.back();
			}
		} catch (err) {
			setErrors({
				root: getErrorMessage(err, "切断に失敗しました。再度お試しください。"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex w-full select-none flex-col items-center justify-start overflow-hidden">
			<AnimatePresence mode="popLayout">
				{mode === "signin" && (
					<motion.div
						key="signin"
						initial={{ opacity: 0, filter: "blur(1rem)" }}
						animate={{ opacity: 1, filter: "blur(0)" }}
						exit={{ opacity: 0, filter: "blur(1rem)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="w-full flex flex-col items-center gap-4 overflow-y-auto p-2"
					>
						<div className="flex w-full flex-row items-center justify-center gap-4">
							<div className="colors h-px w-full rounded-full bg-blue" />

							<span className="colors whitespace-nowrap text-center font-medium text-blue text-base">
								アカウント接続
							</span>

							<div className="colors h-px w-full rounded-full bg-blue" />
						</div>

						<form
							noValidate
							onSubmit={handleSignin}
							className="flex w-full flex-col items-center justify-center gap-8"
						>
							<div className="flex flex-col w-full justify-center items-center gap-4">
								<Input
									required
									autoComplete="email"
									minLength={4}
									maxLength={64}
									spellCheck="false"
									type="text"
									name="identifier"
									value={signinIdentifier}
									label="メールアドレス／ユーザーネーム"
									error={errors.identifier}
									onChange={(e) =>
										handleSigninChange("identifier", e.target.value)
									}
									className="colors border-l5 dark:border-d5"
								/>

								<Input
									required
									autoComplete="current-password"
									minLength={8}
									maxLength={32}
									spellCheck="false"
									type="password"
									name="password"
									value={signinPassword}
									label="パスワード"
									error={errors.password}
									onChange={(e) =>
										handleSigninChange("password", e.target.value)
									}
									className="colors border-l5 dark:border-d5"
								/>

								<AnimatePresence>
									{errors.root && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="px-4 w-full flex justify-start items-center"
										>
											<span className="colors text-left font-medium text-red text-base">
												⚠ {errors.root}
											</span>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							<div className="flex flex-col w-full justify-start items-center gap-2">
								<Button
									disabled={isSigninInvalid}
									type="submit"
									className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-blue p-2
                                        ${isSigninInvalid &&
										"bg-l5 dark:bg-d5 cursor-not-allowed"
										}`}
								>
									<span
										className={`all whitespace-nowrap text-center font-bold text-xl text-l1
                                        ${isSigninInvalid &&
											"text-d5 dark:text-l5 scale-100!"
											}`}
									>
										{lockouts.signin > 0
											? `ロック中 (${formatTime(lockouts.signin)})`
											: isLoading
												? "接続中..."
												: "接続"}
									</span>
								</Button>

								<div className="flex w-full flex-row items-center justify-between px-2">
									<Button
										onClick={() => switchMode("signup")}
										className="colors flex items-center justify-start rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue"
									>
										<span className="all whitespace-nowrap text-left font-medium text-base text-blue">
											パスワード再設定
										</span>
									</Button>

									<Button
										onClick={() => switchMode("signup")}
										className="colors flex items-center justify-end rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue"
									>
										<span className="all whitespace-nowrap text-right font-medium text-base text-blue">
											登録
										</span>
									</Button>
								</div>
							</div>
						</form>

						<div className="flex w-full flex-row items-center justify-center gap-4">
							<div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />

							<span className="colors whitespace-nowrap text-center font-medium text-d5 dark:text-l5 text-base">
								外部接続
							</span>

							<div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />
						</div>

						<div className="flex w-full flex-col items-center justify-center gap-4">
							<Button
								onClick={() => handleSocialAuth("google")}
								className="colors flex w-full h-15 items-center justify-center rounded-full bg-d1 dark:bg-l1 hover:bg-d2 focus-visible:bg-d2 dark:focus-visible:bg-l2 dark:hover:bg-l2"
							>
								<span className="all whitespace-nowrap text-right font-bold text-xl text-l1 dark:text-d1">
									Googleで接続
								</span>
							</Button>
						</div>
					</motion.div>
				)}

				{mode === "signup" && (
					<motion.div
						key="signup"
						layout
						initial={{ opacity: 0, filter: "blur(1rem)" }}
						animate={{ opacity: 1, filter: "blur(0)" }}
						exit={{ opacity: 0, filter: "blur(1rem)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="w-full flex flex-col items-center gap-4 overflow-y-auto p-2"
					>
						<div className="flex w-full flex-row items-center justify-center gap-4">
							<div className="colors h-px w-full rounded-full bg-blue" />

							<span className="colors whitespace-nowrap text-center font-medium text-blue text-base">
								アカウント登録
							</span>

							<div className="colors h-px w-full rounded-full bg-blue" />
						</div>

						<form
							noValidate
							onSubmit={handleSignup}
							className="flex w-full flex-col items-center justify-center gap-8"
						>
							<div className="flex flex-col w-full justify-start items-start gap-4">
								<Input
									required
									autoComplete="name"
									minLength={4}
									maxLength={16}
									spellCheck="false"
									type="text"
									name="name"
									value={signupName}
									label="ユーザーネーム"
									error={errors.name}
									onChange={(e) => handleSignupChange("name", e.target.value)}
									className="colors border-l5 dark:border-d5"
								/>

								<span className="px-2 text-d5 dark:text-l5 font-medium text-left text-sm colors">
									※ 大文字，小文字，数字，記号のみ可
								</span>

								<Input
									required
									autoComplete="email"
									minLength={4}
									maxLength={64}
									spellCheck="false"
									type="email"
									name="email"
									value={signupEmail}
									label="メールアドレス"
									error={errors.email}
									rightContent={
										<motion.div
											layout
											transition={{ duration: 0.5, ease: "backOut" }}
										>
											<Button
												onClick={handleSendCode}
												disabled={
													isSendingCode ||
													isEmailInvalid ||
													countdown > 0 ||
													lockouts.otp > 0
												}
												className={`colors flex-none flex h-10 items-center justify-center rounded-full p-2 bg-blue
                                                    ${(isEmailInvalid ||
														countdown > 0 ||
														lockouts.otp > 0 ||
														isSendingCode) &&
													"bg-l5 dark:bg-d5 cursor-not-allowed"
													}`}
											>
												<AnimatePresence mode="wait">
													{isSendingCode ? (
														<motion.div
															key="loading"
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															exit={{ opacity: 0 }}
															className="scale-100! flex justify-center items-center"
														>
															<ActivityIndicator className="size-6 text-d5 dark:text-l5 colors" />
														</motion.div>
													) : (
														<motion.span
															key="text"
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															exit={{ opacity: 0 }}
															className={`all whitespace-nowrap text-center font-medium text-base text-l1
                                                                ${(isEmailInvalid || countdown > 0 || lockouts.otp > 0) && "text-d5 dark:text-l5 scale-100!"}`}
														>
															{lockouts.otp > 0
																? formatTime(lockouts.otp)
																: countdown > 0
																	? `${countdown}s`
																	: hasSent
																		? "再送信"
																		: "送信"}
														</motion.span>
													)}
												</AnimatePresence>
											</Button>
										</motion.div>
									}
									onChange={(e) => handleSignupChange("email", e.target.value)}
									className="colors border-l5 dark:border-d5"
								/>

								<Input
									required
									autoComplete="one-time-code"
									minLength={6}
									maxLength={6}
									spellCheck="false"
									inputMode="numeric"
									type="text"
									name="one-time-code"
									value={signupCode}
									label="認証コード"
									error={errors.code}
									onChange={(e) => {
										const val = e.target.value.replace(/\D/g, "").slice(0, 6);
										handleSignupChange("code", val);
									}}
									className="colors border-l5 dark:border-d5"
								/>

								<Input
									required
									autoComplete="new-password"
									minLength={8}
									maxLength={32}
									spellCheck="false"
									type="password"
									name="password"
									value={signupPassword}
									label="パスワード"
									error={errors.password}
									onChange={(e) =>
										handleSignupChange("password", e.target.value)
									}
									className="colors border-l5 dark:border-d5"
								/>

								<span className="px-2 text-d5 dark:text-l5 font-medium text-left text-sm colors">
									※ 大文字，小文字，数字，記号を各々1文字以上含有
								</span>

								<Input
									required
									autoComplete="new-password"
									minLength={8}
									maxLength={32}
									spellCheck="false"
									type="password"
									name="confirmPassword"
									value={signupConfirmPassword}
									label="パスワード確認"
									error={errors.confirmPassword}
									onChange={(e) =>
										handleSignupChange("confirmPassword", e.target.value)
									}
									className="colors border-l5 dark:border-d5"
								/>

								<Label className="flex w-full cursor-pointer flex-row items-center justify-start gap-3 rounded-xl p-2 hover:bg-l2/50 dark:hover:bg-d2/50">
									<div className="relative flex size-6 flex-none items-center justify-center">
										<input
											type="checkbox"
											className="peer absolute inset-0 size-full cursor-pointer opacity-0"
											checked={termsAccepted}
											onChange={(e) =>
												handleSignupChange("termsAccepted", e.target.checked)
											}
										/>
										<div
											className={`colors flex size-full items-center justify-center rounded-md border-2 transition-colors ${termsAccepted ? "border-blue bg-blue" : "border-l5 bg-transparent dark:border-d5"} peer-focus-visible:ring-2 peer-focus-visible:ring-blue peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-l1 dark:peer-focus-visible:ring-offset-d1`}
										>
											<Check
												className={`size-4 text-l1 transition-opacity ${termsAccepted ? "opacity-100" : "opacity-0"}`}
												strokeWidth={3}
											/>
										</div>
									</div>
									<span className="colors text-left font-medium text-sm text-d1 dark:text-l1">
										<Link
											href="/terms-of-service"
											className="text-blue hover:underline"
											target="_blank"
										>
											利用規約
										</Link>{" "}
										と{" "}
										<Link
											href="/privacy-policy"
											className="text-blue hover:underline"
											target="_blank"
										>
											プライバシーポリシー
										</Link>{" "}
										に同意する。
									</span>
								</Label>

								<AnimatePresence>
									{errors.root && (
										<motion.div
											layout
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="px-4 w-full flex justify-start items-center"
										>
											<span className="colors text-left font-medium text-red text-base">
												⚠ {errors.root}
											</span>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							<div className="flex flex-col w-full justify-start items-center gap-2">
								<Button
									disabled={isSignupInvalid}
									type="submit"
									className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-blue p-2
                                        ${isSignupInvalid &&
										"bg-l5 dark:bg-d5 cursor-not-allowed"
										}`}
								>
									<span
										className={`all whitespace-nowrap text-center font-bold text-d1 text-xl dark:text-l1
                                        ${isSignupInvalid &&
											"text-d5 dark:text-l5 scale-100!"
											}`}
									>
										{lockouts.signup > 0
											? `ロック中 (${formatTime(lockouts.signup)})`
											: isLoading
												? "登録中..."
												: "登録"}
									</span>
								</Button>

								<div className="flex w-full flex-row items-center justify-center px-2">
									<span className="colors whitespace-nowrap text-center font-medium text-base text-d1 dark:text-l1">
										アカウントを登録済：
									</span>

									<Button
										onClick={() => switchMode("signin")}
										className="colors flex items-center justify-center rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue"
									>
										<span className="all whitespace-nowrap text-center font-medium text-base text-blue">
											接続
										</span>
									</Button>
								</div>
							</div>
						</form>

						<div className="flex w-full flex-row items-center justify-center gap-4">
							<div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />

							<span className="colors whitespace-nowrap text-center font-medium text-d5 dark:text-l5 text-base">
								外部接続
							</span>

							<div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />
						</div>

						<div className="flex w-full flex-col items-center justify-center gap-4">
							<Button
								onClick={() => handleSocialAuth("google")}
								className="colors flex w-full h-15 items-center justify-center rounded-full bg-d1 dark:bg-l1 hover:bg-d2 focus-visible:bg-d2 dark:focus-visible:bg-l2 dark:hover:bg-l2"
							>
								<span className="all whitespace-nowrap text-right font-bold text-xl text-l1 dark:text-d1">
									Googleで接続
								</span>
							</Button>
						</div>
					</motion.div>
				)}

				{mode === "signout" && (
					<motion.div
						key="signout"
						layout
						initial={{ opacity: 0, filter: "blur(1rem)" }}
						animate={{ opacity: 1, filter: "blur(0)" }}
						exit={{ opacity: 0, filter: "blur(1rem)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="w-full flex flex-col items-center gap-4 overflow-y-auto p-2"
					>
						<div className="flex w-full flex-row items-center justify-center gap-4 py-4">
							<div className="colors h-px w-full rounded-full bg-red" />

							<span className="colors whitespace-nowrap text-center font-medium text-red text-base">
								アカウント切断
							</span>

							<div className="colors h-px w-full rounded-full bg-red" />
						</div>

						<div className="flex w-full flex-col items-center justify-center gap-4">
							<span className="all whitespace-nowrap text-center font-medium text-d1 dark:text-l1 text-base">
								接続中のアカウントから切断しますか？
							</span>

							<AnimatePresence>
								{errors.root && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.5, ease: "backOut" }}
										className="px-4 w-full flex justify-start items-center"
									>
										<span className="colors text-left font-medium text-red text-base">
											⚠ {errors.root}
										</span>
									</motion.div>
								)}
							</AnimatePresence>

							<Button
								disabled={isLoading}
								onClick={handleSignout}
								className={`colors flex h-15 w-full items-center justify-center rounded-full bg-red px-4 ${isLoading && "opacity-50 cursor-not-allowed"}`}
							>
								<span className="all whitespace-nowrap text-center font-medium text-d1 dark:text-l1 text-base">
									{isLoading ? "切断中..." : "切断"}
								</span>
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}