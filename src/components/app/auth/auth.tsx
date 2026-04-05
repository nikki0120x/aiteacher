"use client";
import { Info, Key, KeyRound, Mail, TriangleAlert } from "lucide-react";
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
} from "@/app/actions/auth";
import { Button, DotsIndicator } from "@/components/ui/index";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { signIn, signOut, signUp } from "@/lib/auth-client";

const SIGNIN_AUTH_REGEX_MESSAGES: Record<string, string> = {
	EMAIL: "正しいメールアドレスの形式で入力してください！",
	PASSWORD: "小文字，大文字，数字，記号を各々1文字以上含めて入力してください！",
};

const SIGNUP_AUTH_REGEX_MESSAGES: Record<string, string> = {
	EMAIL: "正しいメールアドレスの形式で入力してください！",
	PASSWORD: "小文字，大文字，数字，記号を各々1文字以上含めて入力してください！",
	CONFIRM_PASSWORD: "一致するパスワードを入力してください！",
};

const SIGNIN_AUTH_CAUTION_MESSAGES: Record<string, string> = {
	INVALID_EMAIL: "メールアドレスの形式が正しくありません！",
	INVALID_PASSWORD:
		"小文字，大文字，数字，記号が各々1文字以上含まれていません！",

	UNKNOWN: "不明なエラーが発生したため，再度お試しください！",
};

const SIGNUP_AUTH_CAUTION_MESSAGES: Record<string, string> = {
	INVALID_EMAIL: "メールアドレスの形式が正しくありません！",
	INVALID_PASSWORD:
		"小文字，大文字，数字，記号が各々1文字以上含まれていません！",
	INVALID_CONFIRM_PASSWORD: "パスワードが一致していません！",

	UNKNOWN: "不明なエラーが発生したため，再度お試しください！",
};

const ALL_AUTH_WARNING_MESSAGES: Record<string, string> = {
	INVALID_CALLBACK_REQUEST: "無効なリクエストです。再度お試しください。",
	INVALID_EMAIL_OR_PASSWORD:
		"メールアドレスまたはパスワードが正しくありません。",
	INVALID_CODE: "認証コードが無効か、期限が切れています。",
	INTERNAL_SERVER_ERROR:
		"サーバーでエラーが発生しました。しばらく時間をおいてください。",
	STATE_NOT_FOUND:
		"セッションの有効期限が切れました。もう一度最初からやり直してください。",
	STATE_MISMATCH:
		"不正なリクエストが検出されました。ブラウザを更新して再度お試しください。",
	NO_CODE: "認証コードが見つかりません。",
	NO_CALLBACK_URL: "リダイレクト先が設定されていません。",
	OAUTH_PROVIDER_NOT_FOUND: "指定された認証プロバイダーが見つかりません。",
	EMAIL_NOT_FOUND: "このメールアドレスは登録されていません。",
	EMAIL_DOES_NOT_MATCH: "入力されたメールアドレスが一致しません。",
	UNABLE_TO_GET_USER_INFO: "ユーザー情報の取得に失敗しました。",
	UNABLE_TO_LINK_ACCOUNT: "アカウントの連携に失敗しました。",
	UNABLE_TO_CREATE_USER: "アカウントの作成に失敗しました。",
	UNABLE_TO_CREATE_SESSION: "ログインセッションの作成に失敗しました。",
	ACCOUNT_NOT_LINKED:
		"このアカウントは外部連携されていません。メールアドレスでログインしてください。",
	ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER:
		"このアカウントは既に他のユーザーに連携されています。",
	SIGNUP_DISABLED: "現在、新規登録は受け付けておりません。",
	NETWORK: "ネットワークエラーが発生しました。接続を確認してください。",
	UNKNOWN: "不明なエラーが発生しました。再度お試しください。",
};

interface AuthError {
	code?: string;
	message?: string;
	status?: string;
}

const getErrorMessage = (
	error: unknown,
	messages: Record<string, string>,
	fallback: string = "不明なエラーが発生したため，再度お試しください！",
) => {
	if (!error) return fallback;

	if (typeof error === "string") {
		return messages[error] || error;
	}

	if (typeof error === "object" && error !== null) {
		const err = error as AuthError;

		if (err.code && messages[err.code]) {
			return messages[err.code];
		}

		const isNetworkError =
			err.status === "FETCH_ERROR" ||
			err.message?.toLowerCase().includes("fetch") ||
			err.message?.toLowerCase().includes("network");

		if (isNetworkError) {
			return messages.NETWORK || "ネットワークエラーが発生しました。";
		}

		if (err.message) return err.message;
	}

	return fallback;
};

const PasswordRegex =
	/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)(?=.*?[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[a-zA-Z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;
const PasswordMessage =
	"小文字，大文字，数字，記号を各々1文字以上含めてください！";

// 接続
const SigninSchema = z.object({
	email: z.email(),
	password: z.string().regex(PasswordRegex, PasswordMessage),
});

// 登録
const SignupSchema = z
	.object({
		email: z.email(),
		password: z.string().regex(PasswordRegex, PasswordMessage),
		confirmPassword: z.string(),
		termsAccepted: z.literal(true),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "パスワードが一致しません！",
		path: ["confirmPassword"],
	});

type AuthMode = "signin" | "signup" | "signout";

export function Auth({
	onSuccess,
	onLoadingChange,
}: {
	onSuccess?: () => void;
	onLoadingChange?: (loading: {
		isSubmitting: boolean;
		isAuthenticating: boolean;
	}) => void;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { executeRecaptcha } = useGoogleReCaptcha();
	const [mode, setMode] = useState<AuthMode>(() => {
		return (searchParams.get("mode") as AuthMode) || "signin";
	});

	const [signinEmail, setSigninEmail] = useState("");
	const [signinPassword, setSigninPassword] = useState("");
	const [signupEmail, setSignupEmail] = useState("");
	const [signupPassword, setSignupPassword] = useState("");
	const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [infoVisible, setInfoVisible] = useState<Record<string, boolean>>({});

	const toggleInfo = (field: string) => {
		setInfoVisible((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
		termsAccepted?: string;
		root?: string;
	}>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [lockouts, setLockouts] = useState({ signin: 0, signup: 0, otp: 0 });

	const isLoading = isSubmitting || isAuthenticating;

	const getFieldColor = (
		value: string,
		error: string | undefined,
		schema?: z.ZodTypeAny,
	) => {
		if (error) return "text-red";
		if (value.length === 0) return "text-d5 dark:text-l5";
		if (schema)
			return schema.safeParse(value).success ? "text-blue" : "text-orange";
		return "text-blue";
	};

	const signinEmailColor = getFieldColor(
		signinEmail,
		errors.email,
		SignupSchema.shape.email,
	);
	const signinPasswordColor = getFieldColor(
		signinPassword,
		errors.password,
		SigninSchema.shape.password,
	);

	const signupEmailColor = getFieldColor(
		signupEmail,
		errors.email,
		SignupSchema.shape.email,
	);
	const signupPasswordColor = getFieldColor(
		signupPassword,
		errors.password,
		SignupSchema.shape.password,
	);
	const signupConfirmPasswordColor =
		signupConfirmPassword.length > 0
			? errors.confirmPassword
				? "text-red"
				: signupPassword === signupConfirmPassword
					? "text-blue"
					: "text-orange"
			: "text-d5 dark:text-l5";

	const getConstants = () => {
		if (mode === "signup") {
			return {
				regex: SIGNUP_AUTH_REGEX_MESSAGES,
				caution: SIGNUP_AUTH_CAUTION_MESSAGES,
				warning: ALL_AUTH_WARNING_MESSAGES,
			};
		}
		return {
			regex: SIGNIN_AUTH_REGEX_MESSAGES,
			caution: SIGNIN_AUTH_CAUTION_MESSAGES,
			warning: ALL_AUTH_WARNING_MESSAGES,
		};
	};

	const renderFieldMessages = (
		field: string,
		regexKey: string,
		cautionKey: string | null,
		color: string,
		errorMsg?: string,
	) => {
		const isVisible = infoVisible[field];
		if (!isVisible && !errorMsg) return null;

		const { regex, caution } = getConstants();

		return (
			<>
				{isVisible && (
					<div className="flex flex-col items-start justify-start">
						<div className="flex flex-row justify-start items-start w-full gap-2">
							<Info className="flex-none size-5 text-blue" />

							<span className="text-sm font-medium text-left text-blue">
								{regex[regexKey]}
							</span>
						</div>

						<AnimatePresence>
							{color === "text-orange" && cautionKey && caution[cautionKey] && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.5, ease: "backOut" }}
									className="flex flex-row justify-start items-start w-full gap-2"
								>
									<TriangleAlert className="flex-none size-5 text-orange" />

									<span className="text-sm font-medium text-left text-orange">
										{caution[cautionKey]}
									</span>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)}
			</>
		);
	};

	const isSigninInvalid =
		signinEmail.length < 4 ||
		signinPassword.length < 8 ||
		!SigninSchema.safeParse({
			email: signinEmail,
			password: signinPassword,
		}).success ||
		isLoading ||
		lockouts.signin > 0;

	const isSignupInvalid =
		signupEmail.length < 4 ||
		signupPassword.length < 8 ||
		signupConfirmPassword.length < 8 ||
		!termsAccepted ||
		!SignupSchema.safeParse({
			email: signupEmail,
			password: signupPassword,
			confirmPassword: signupConfirmPassword,
			termsAccepted,
		}).success ||
		isLoading ||
		lockouts.signup > 0;

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

	// 接続変化
	const handleSigninChange = (field: "email" | "password", value: string) => {
		if (field === "email") setSigninEmail(value);
		if (field === "password") setSigninPassword(value);

		setErrors((prev) => ({ ...prev, email: undefined, root: undefined }));
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
		if (field === "email") setSignupEmail(value as string);
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
			email: signinEmail,
			password: signinPassword,
		});

		if (!result.success) {
			const fieldErrors = result.error.flatten((i) => i.message).fieldErrors;
			setErrors({ email: fieldErrors.email?.[0] });

			return;
		}

		setErrors({});
		setIsSubmitting(true);

		try {
			if (!executeRecaptcha) {
				setErrors({ root: "システムエラー：reCAPTCHAが準備できていません。" });
				setIsSubmitting(false);

				return;
			}

			const recaptchaToken = await executeRecaptcha("signin");
			const check = await checkActionRateLimit("signin", recaptchaToken);

			if (check.locked) {
				applyLockout("signin", check.lockoutUntil ?? new Date().toISOString());
				setIsSubmitting(false);

				return;
			}

			const { error } = await signIn.email({
				email: signinEmail,
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
					setErrors({
						root: getErrorMessage(error, ALL_AUTH_WARNING_MESSAGES),
					});
				}

				setIsSubmitting(false);
			} else {
				await resetRateLimit("signin");

				if (onSuccess) {
					onSuccess();
				} else {
					router.back();
				}

				return;
			}
		} catch (err) {
			setErrors({ root: getErrorMessage(err, ALL_AUTH_WARNING_MESSAGES) });
			setIsSubmitting(false);
		}
	};

	// 登録処理
	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = SignupSchema.safeParse({
			email: signupEmail,
			password: signupPassword,
			confirmPassword: signupConfirmPassword,
			termsAccepted,
		});

		if (!result.success) {
			const fieldErrors = result.error.flatten((i) => i.message).fieldErrors;
			setErrors({
				email: fieldErrors.email?.[0],
				password: fieldErrors.password?.[0],
				confirmPassword: fieldErrors.confirmPassword?.[0],
				termsAccepted: fieldErrors.termsAccepted?.[0],
			});
			return;
		}

		setErrors({});
		setIsSubmitting(true);

		try {
			if (!executeRecaptcha) {
				setErrors({ root: "システムエラー：reCAPTCHAが準備できていません。" });
				setIsSubmitting(false);
				return;
			}

			const recaptchaToken = await executeRecaptcha("signup");
			const check = await checkActionRateLimit("signup", recaptchaToken);

			if (check.locked) {
				applyLockout("signup", check.lockoutUntil ?? new Date().toISOString());
				setIsSubmitting(false);
				return;
			}

			const { error } = await signUp.email({
				name: signupEmail,
				email: signupEmail,
				password: signupPassword,
			});

			if (error) {
				const failRecord = await recordFailedAttempt("signup");

				if (failRecord.locked) {
					applyLockout(
						"signup",
						failRecord.lockoutUntil ?? new Date().toISOString(),
					);
				} else {
					setErrors({
						root: getErrorMessage(error, ALL_AUTH_WARNING_MESSAGES),
					});
					setIsSubmitting(false);
				}
			} else {
				await resetRateLimit("signup");
				await markEmailAsVerified(signupEmail);

				if (onSuccess) {
					onSuccess();
				} else {
					router.back();
				}

				return;
			}
		} catch (err) {
			setErrors({ root: getErrorMessage(err, ALL_AUTH_WARNING_MESSAGES) });
			setIsSubmitting(false);
		}
	};

	// 外部認証処理
	const handleSocialAuth = async (provider: "google") => {
		setErrors({});
		setIsAuthenticating(true);

		try {
			const { error } = await signIn.social({ provider, callbackURL: "/" });

			if (error) {
				setErrors({ root: getErrorMessage(error, ALL_AUTH_WARNING_MESSAGES) });
				setIsAuthenticating(false);
			} else {
				if (onSuccess) onSuccess();
			}
		} catch (err) {
			setErrors({ root: getErrorMessage(err, ALL_AUTH_WARNING_MESSAGES) });
			setIsAuthenticating(false);
		}
	};

	// 切断処理
	const handleSignout = async () => {
		setErrors({});
		setIsSubmitting(true);

		try {
			const { error } = await signOut();

			if (error) {
				setErrors({
					root: getErrorMessage(error, ALL_AUTH_WARNING_MESSAGES),
				});
				setIsSubmitting(false);
			} else {
				if (onSuccess) {
					onSuccess();
				} else {
					router.back();
				}

				return;
			}
		} catch (err) {
			setErrors({
				root: getErrorMessage(err, ALL_AUTH_WARNING_MESSAGES),
			});
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		onLoadingChange?.({ isSubmitting, isAuthenticating });
	}, [isSubmitting, isAuthenticating, onLoadingChange]);

	return (
		<div className="flex w-full select-none flex-col items-center justify-start overflow-hidden">
			<AnimatePresence>
				{isLoading && (
					<motion.div
						initial={{ opacity: 0, pointerEvents: "none" }}
						animate={{ opacity: 1, pointerEvents: "auto" }}
						exit={{ opacity: 0, pointerEvents: "none" }}
						className="absolute inset-0 size-full rounded-4xl z-100 flex items-center justify-center bg-l1/50 dark:bg-d1/50 cursor-wait"
					/>
				)}
			</AnimatePresence>

			<AnimatePresence mode="popLayout">
				{mode === "signin" && (
					<motion.div
						key="signin"
						layout
						initial={{ opacity: 0, filter: "blur(1rem)" }}
						animate={{ opacity: 1, filter: "blur(0)" }}
						exit={{ opacity: 0, filter: "blur(1rem)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="w-full flex flex-col items-center gap-4 overflow-y-auto scrollbar-hide p-2"
					>
						<div className="flex w-full flex-row items-center justify-center gap-4">
							<hr className="colors h-px w-full rounded-full text-blue" />
							<span className="colors whitespace-nowrap text-center font-bold text-blue text-lg">
								アカウント接続
							</span>
							<hr className="colors h-px w-full rounded-full text-blue" />
						</div>

						<form
							noValidate
							onSubmit={handleSignin}
							className="flex w-full flex-col items-center justify-center gap-8"
						>
							<div className="flex flex-col w-full justify-center items-center">
								<Input
									required
									autoComplete="email"
									minLength={4}
									maxLength={64}
									spellCheck="false"
									type="email"
									name="email"
									value={signinEmail}
									label="メールアドレス"
									labelClassName={signinEmailColor}
									notice={renderFieldMessages(
										"signinEmail",
										"EMAIL",
										"INVALID_EMAIL",
										signinEmailColor,
										errors.email,
									)}
									leftContent={
										<Button
											type="button"
											onClick={() => toggleInfo("signinEmail")}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<Mail className={`all ${signinEmailColor}`} />
										</Button>
									}
									onChange={(e) => handleSigninChange("email", e.target.value)}
									className="colors border border-l5 dark:border-d5"
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
									labelClassName={signinPasswordColor}
									notice={renderFieldMessages(
										"signinPassword",
										"PASSWORD",
										"INVALID_PASSWORD",
										signinPasswordColor,
										errors.password,
									)}
									leftContent={
										<Button
											type="button"
											onClick={() => toggleInfo("signinPassword")}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<KeyRound className={`all ${signinPasswordColor}`} />
										</Button>
									}
									onChange={(e) =>
										handleSigninChange("password", e.target.value)
									}
									className="colors border border-l5 dark:border-d5 mt-4"
								/>

								<AnimatePresence>
									{errors.root && (
										<motion.div
											initial={{ height: 0, opacity: 0, marginTop: 0 }}
											animate={{ height: "auto", opacity: 1, marginTop: 16 }}
											exit={{ height: 0, opacity: 0, marginTop: 0 }}
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
									disabled={isSigninInvalid || isSubmitting}
									type="submit"
									className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-blue p-2
                                        ${
																					(isSigninInvalid || isSubmitting) &&
																					"bg-l5 dark:bg-d5 cursor-not-allowed"
																				}`}
								>
									<AnimatePresence mode="popLayout">
										{isSubmitting ? (
											<motion.div
												key="submitting"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
												className="scale-100! flex justify-center items-center"
											>
												<DotsIndicator className="text-d5 dark:text-l5 colors" />
											</motion.div>
										) : (
											<motion.span
												key="text"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
												className={`all whitespace-nowrap text-center font-bold text-lg text-l1
                                                    ${(isSigninInvalid || isSubmitting) && "text-d5 dark:text-l5 scale-100!"}`}
											>
												{lockouts.signin > 0
													? `${formatTime(lockouts.signin)}`
													: "接続"}
											</motion.span>
										)}
									</AnimatePresence>
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
							<hr className="colors h-px w-full rounded-full text-d5 dark:text-l5" />

							<span className="colors whitespace-nowrap text-center font-medium text-d5 dark:text-l5 text-base">
								外部認証
							</span>

							<hr className="colors h-px w-full rounded-full text-d5 dark:text-l5" />
						</div>

						<div className="flex w-full flex-col items-center justify-center gap-4">
							<Button
								disabled={isAuthenticating}
								onClick={() => handleSocialAuth("google")}
								className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-d1 dark:bg-l1 hover:bg-d2 focus-visible:bg-d2 dark:focus-visible:bg-l2 dark:hover:bg-l2 p-2
                                        ${
																					isAuthenticating &&
																					"bg-l5 dark:bg-d5 cursor-not-allowed"
																				}`}
							>
								<AnimatePresence mode="popLayout">
									{isAuthenticating ? (
										<motion.div
											key="authenticating"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="scale-100! flex justify-center items-center"
										>
											<DotsIndicator className="text-d5 dark:text-l5 colors" />
										</motion.div>
									) : (
										<motion.span
											key="text"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="all whitespace-nowrap text-right font-bold text-xl text-l1 dark:text-d1"
										>
											Googleで認証
										</motion.span>
									)}
								</AnimatePresence>
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
						className="w-full flex flex-col items-center gap-4 overflow-y-auto scrollbar-hide p-2"
					>
						<div className="flex w-full flex-row items-center justify-center gap-4">
							<hr className="colors h-px w-full rounded-full text-blue" />
							<span className="colors whitespace-nowrap text-center font-medium text-blue text-base">
								アカウント登録
							</span>
							<hr className="colors h-px w-full rounded-full text-blue" />
						</div>

						<form
							noValidate
							onSubmit={handleSignup}
							className="flex w-full flex-col items-center justify-center gap-8"
						>
							<div className="flex flex-col w-full justify-start items-start">
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
									labelClassName={signupEmailColor}
									notice={renderFieldMessages(
										"signupEmail",
										"EMAIL",
										"INVALID_EMAIL",
										signupEmailColor,
										errors.email,
									)}
									leftContent={
										<Button
											type="button"
											onClick={() => toggleInfo("signupEmail")}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<Mail className={`all ${signupEmailColor}`} />
										</Button>
									}
									onChange={(e) => handleSignupChange("email", e.target.value)}
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
									labelClassName={signupPasswordColor}
									notice={renderFieldMessages(
										"signupPassword",
										"PASSWORD",
										"INVALID_PASSWORD",
										signupPasswordColor,
										errors.password,
									)}
									leftContent={
										<Button
											type="button"
											onClick={() => toggleInfo("signupPassword")}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<KeyRound className={`all ${signupPasswordColor}`} />
										</Button>
									}
									onChange={(e) =>
										handleSignupChange("password", e.target.value)
									}
									className="colors border-l5 dark:border-d5 mt-4"
								/>

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
									labelClassName={signupConfirmPasswordColor}
									notice={renderFieldMessages(
										"signupConfirmPassword",
										"CONFIRM_PASSWORD",
										"INVALID_CONFIRM_PASSWORD",
										signupConfirmPasswordColor,
										errors.confirmPassword,
									)}
									leftContent={
										<Button
											type="button"
											onClick={() => toggleInfo("signupConfirmPassword")}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<Key className={`all ${signupConfirmPasswordColor}`} />
										</Button>
									}
									onChange={(e) =>
										handleSignupChange("confirmPassword", e.target.value)
									}
									className="colors border-l5 dark:border-d5 mt-4"
								/>

								<Label className="mt-4 flex w-full cursor-pointer flex-row items-center justify-start gap-4 rounded-full p-4 hover:bg-l2 dark:hover:bg-d2 colors">
									<Input
										required
										type="checkbox"
										name="termsAccepted"
										checked={termsAccepted}
										onChange={(e) =>
											handleSignupChange("termsAccepted", e.target.checked)
										}
									/>

									<span className="inline-flex flex-wrap justify-start items-center colors text-left font-medium text-base text-d1 dark:text-l1">
										<Link
											href="/terms-of-service"
											target="_blank"
											className="inline-block"
										>
											<Button className="colors flex items-center justify-center rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue">
												<span className="all whitespace-nowrap text-center font-medium text-base text-blue">
													利用規約
												</span>
											</Button>
										</Link>
										と
										<Link
											href="/privacy-policy"
											target="_blank"
											className="inline-block"
										>
											<Button className="colors flex items-center justify-center rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue">
												<span className="all whitespace-nowrap text-center font-medium text-base text-blue">
													プライバシーポリシー
												</span>
											</Button>
										</Link>
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
									disabled={isSignupInvalid || isSubmitting}
									type="submit"
									className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-blue p-2
                                        ${
																					(isSignupInvalid || isSubmitting) &&
																					"bg-l5 dark:bg-d5 cursor-not-allowed"
																				}`}
								>
									<AnimatePresence mode="popLayout">
										{isSubmitting ? (
											<motion.div
												key="submitting"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
												className="scale-100! flex justify-center items-center"
											>
												<DotsIndicator className="size-2 text-d5 dark:text-l5 colors" />
											</motion.div>
										) : (
											<motion.span
												key="text"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
												className={`all whitespace-nowrap text-center font-bold text-lg text-l1
                                                    ${(isSignupInvalid || isSubmitting) && "text-d5 dark:text-l5 scale-100!"}`}
											>
												{lockouts.signup > 0
													? `(${formatTime(lockouts.signup)})`
													: "登録"}
											</motion.span>
										)}
									</AnimatePresence>
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
							<hr className="colors h-px w-full rounded-full text-d5 dark:text-l5" />

							<span className="colors whitespace-nowrap text-center font-medium text-d5 dark:text-l5 text-base">
								外部認証
							</span>

							<hr className="colors h-px w-full rounded-full text-d5 dark:text-l5" />
						</div>

						<div className="flex w-full flex-col items-center justify-center gap-4">
							<Button
								disabled={isAuthenticating}
								onClick={() => handleSocialAuth("google")}
								className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-d1 dark:bg-l1 hover:bg-d2 focus-visible:bg-d2 dark:focus-visible:bg-l2 dark:hover:bg-l2 p-2
                                        ${
																					isAuthenticating &&
																					"bg-l5 dark:bg-d5 cursor-not-allowed"
																				}`}
							>
								<AnimatePresence mode="popLayout">
									{isAuthenticating ? (
										<motion.div
											key="authenticating"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="scale-100! flex justify-center items-center"
										>
											<DotsIndicator className="text-d5 dark:text-l5 colors" />
										</motion.div>
									) : (
										<motion.span
											key="text"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="all whitespace-nowrap text-right font-bold text-xl text-l1 dark:text-d1"
										>
											Googleで認証
										</motion.span>
									)}
								</AnimatePresence>
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
						className="w-full flex flex-col items-center gap-4 overflow-y-auto scrollbar-hide p-2"
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
								disabled={isSubmitting}
								type="submit"
								onClick={handleSignout}
								className={`colors flex-none flex h-15 w-full items-center justify-center rounded-full bg-red p-2
                                        ${
																					isSubmitting &&
																					"bg-l5 dark:bg-d5 cursor-not-allowed"
																				}`}
							>
								<AnimatePresence mode="popLayout">
									{isSubmitting ? (
										<motion.div
											key="submitting"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="scale-100! flex justify-center items-center"
										>
											<DotsIndicator className="size-2 text-d5 dark:text-l5 colors" />
										</motion.div>
									) : (
										<motion.span
											key="text"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className={`all whitespace-nowrap text-center font-bold text-lg text-l1
                                                    ${isSubmitting && "text-d5 dark:text-l5 scale-100!"}`}
										>
											切断
										</motion.span>
									)}
								</AnimatePresence>
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
