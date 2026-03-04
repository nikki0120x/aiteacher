"use client";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signIn, signUp, signOut } from "@/lib/auth-client";
import { Check } from "lucide-react";
import { sendOtpCode, verifyOtpCode, markEmailAsVerified } from "@/app/actions/auth";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    "USER_ALREADY_EXISTS": "このメールアドレスは既に登録されています。",
    "INVALID_EMAIL": "メールアドレスの形式が正しくありません。",
    "WEAK_PASSWORD": "パスワードが弱すぎます。",
    "INVALID_EMAIL_OR_PASSWORD": "メールアドレスまたはパスワードが正しくありません。",
    "EMAIL_NOT_VERIFIED": "メールアドレスが確認されていません。認証メールを確認してください。",
    "USER_NOT_FOUND": "ユーザーが見つかりません。登録はお済みですか？",
    "WRONG_PASSWORD": "パスワードが間違っています。",
    "TOO_MANY_REQUESTS": "試行回数が多すぎます。しばらく時間を置いてから再度お試しください。",
    "INTERNAL_SERVER_ERROR": "サーバーエラーが発生しました。時間を置いて再度お試しください。",
};

const NameRegex = /^[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
const NameMessage = "大文字、小文字、数字、記号のみ使用できます！";

const PasswordRegex = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\d)(?=.*?[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
const PasswordMessage = "小文字，大文字，数字，記号を各々1文字以上含めてください！";

const SigninSchema = z.object({
    identifier: z.string().min(4, "4文字以上で入力してください！").max(64),
    password: z.string().min(8).max(32).regex(PasswordRegex, PasswordMessage),
});

const SignupSchema = z.object({
    name: z.string()
        .min(4, "4文字以上で入力してください！")
        .max(16, "16文字以下で入力してください！")
        .regex(NameRegex, NameMessage),
    email: z.email("正しい形式で入力してください！").min(4).max(64),
    code: z.string().length(6, "認証コードは6桁の数字で入力してください！"),
    password: z.string().min(8).max(32).regex(PasswordRegex, PasswordMessage),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { message: "利用規約とプライバシーポリシーに同意してください。" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません！",
    path: ["confirmPassword"],
});

type AuthMode = "signin" | "signup" | "signout";

export function Sign({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();

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

    const [errors, setErrors] = useState<{ identifier?: string; name?: string; email?: string; code?: string; password?: string; confirmPassword?: string; termsAccepted?: string; root?: string }>({});
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [sentMessage, setSentMessage] = useState("");

    const isSigninInvalid = signinIdentifier.length === 0 || signinPassword.length === 0;
    const isSignupInvalid = signupName.length === 0 || signupEmail.length === 0 || signupCode.length === 0 || signupPassword.length === 0 || signupConfirmPassword.length === 0 || !termsAccepted;

    const handleSigninChange = (field: "identifier" | "password", value: string) => {
        if (field === "identifier") setSigninIdentifier(value);
        if (field === "password") setSigninPassword(value);
        setErrors((prev) => ({ ...prev, identifier: undefined, root: undefined }));
    };

    const handleSignupChange = (field: "name" | "email" | "code" | "password" | "confirmPassword" | "termsAccepted", value: string | boolean) => {
        if (field === "name") setSignupName(value as string);
        if (field === "email") setSignupEmail(value as string);
        if (field === "code") setSignupCode(value as string);
        if (field === "password") setSignupPassword(value as string);
        if (field === "confirmPassword") setSignupConfirmPassword(value as string);
        if (field === "termsAccepted") setTermsAccepted(value as boolean);
        setErrors((prev) => ({ ...prev, [field]: undefined, root: undefined }));
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        setErrors({});
        setSentMessage("");
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            params.set("mode", newMode);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState(null, "", newUrl);
        }
    };

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = SigninSchema.safeParse({ identifier: signinIdentifier, password: signinPassword });

        if (!result.success) {
            const fieldErrors = result.error.flatten((i) => i.message).fieldErrors;
            setErrors({ identifier: fieldErrors.identifier?.[0] });
            return;
        }

        setErrors({});

        const { error } = await signIn.email({
            email: signinIdentifier,
            password: signinPassword
        });

        if (error) {
            const message = error.code ? AUTH_ERROR_MESSAGES[error.code] || "不明なエラーです。" : "不明なエラーです。";
            setErrors({ root: message });
        } else {
            router.refresh();
            if (onSuccess) onSuccess();
            else router.back();
        }
    };

    const handleSendCode = async () => {
        setErrors((prev) => ({ ...prev, email: undefined, root: undefined }));
        setSentMessage("");

        const emailResult = SignupSchema.shape.email.safeParse(signupEmail);
        if (!emailResult.success) {
            setErrors((prev) => ({ ...prev, email: emailResult.error.issues[0].message }));
            return;
        }

        setIsSendingCode(true);
        const res = await sendOtpCode(signupEmail);
        setIsSendingCode(false);

        if (res.error) {
            setErrors((prev) => ({ ...prev, root: res.error }));
        } else {
            setSentMessage("認証コードを送信しました。");
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = SignupSchema.safeParse({
            name: signupName,
            email: signupEmail,
            code: signupCode,
            password: signupPassword,
            confirmPassword: signupConfirmPassword,
            termsAccepted
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

        const verifyRes = await verifyOtpCode(signupEmail, signupCode);
        if (verifyRes.error) {
            setErrors({ root: verifyRes.error });
            return;
        }

        const { error } = await signUp.email({
            email: signupEmail,
            password: signupPassword,
            name: signupName || "",
        });

        if (error) {
            const message = error.code ? AUTH_ERROR_MESSAGES[error.code] || "不明なエラーです。" : "不明なエラーです。";
            setErrors({ root: message });
        } else {
            await markEmailAsVerified(signupEmail);
            router.refresh();
            if (onSuccess) onSuccess();
            else router.back();
        }
    };

    const handleSocialAuth = async (provider: "google") => {
        await signIn.social({ provider, callbackURL: "/" });
    };

    const handleSignout = async () => {
        setErrors({});
        const { error } = await signOut();

        if (error) {
            setErrors({ root: "切断に失敗しました。再度お試しください。" });
        } else {
            router.refresh();
            if (onSuccess) onSuccess();
            else router.back();
        }
    };

    return (
        <motion.div
            layout
            transition={{ duration: 0.5, ease: "backOut" }}
            className="flex w-full select-none flex-col items-center justify-start overflow-hidden"
        >
            <AnimatePresence mode="popLayout">
                {mode === "signin" && (
                    <motion.div
                        key="signin"
                        layout
                        initial={{ opacity: 0, filter: "blur(1rem)" }}
                        animate={{ opacity: 1, filter: "blur(0)" }}
                        exit={{ opacity: 0, filter: "blur(1rem)" }}
                        transition={{ duration: 0.5, ease: "backOut" }}
                        className="w-full flex flex-col items-center gap-4 overflow-y-auto p-2"
                    >
                        <div className="flex w-full flex-row items-center justify-center gap-4 py-4">
                            <div className="colors h-px w-full rounded-full bg-blue" />

                            <motion.span
                                layout
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="colors whitespace-nowrap text-center font-medium text-blue text-base"
                            >
                                アカウント接続
                            </motion.span>

                            <div className="colors h-px w-full rounded-full bg-blue" />
                        </div>

                        <form noValidate onSubmit={handleSignin} className="flex w-full flex-col items-center justify-center gap-8">
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
                                    onChange={(e) => handleSigninChange("identifier", e.target.value)}
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
                                    onChange={(e) => handleSigninChange("password", e.target.value)}
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
                                            <motion.span
                                                layout
                                                transition={{ duration: 0.5, ease: "backOut" }}
                                                className="colors text-left font-medium text-red text-base"
                                            >
                                                ⚠ {errors.root}
                                            </motion.span>
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
                                    <motion.span
                                        layout
                                        transition={{ duration: 0.5, ease: "backOut" }}
                                        className={`all whitespace-nowrap text-center font-bold text-d1 text-xl dark:text-l1
                                        ${isSigninInvalid &&
                                            "text-d5 dark:text-l5 scale-100!"}`}
                                    >
                                        接続
                                    </motion.span>
                                </Button>

                                <div className="flex w-full flex-row items-center justify-between px-2">
                                    <Button onClick={() => switchMode("signup")} className="colors flex items-center justify-start rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue">
                                        <motion.span
                                            layout
                                            transition={{ duration: 0.5, ease: "backOut" }}
                                            className="all whitespace-nowrap text-left font-medium text-base text-blue"
                                        >
                                            パスワード再設定
                                        </motion.span>
                                    </Button>

                                    <Button onClick={() => switchMode("signup")} className="colors flex items-center justify-end rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue">
                                        <motion.span
                                            layout
                                            transition={{ duration: 0.5, ease: "backOut" }}
                                            className="all whitespace-nowrap text-right font-medium text-base text-blue"
                                        >
                                            登録
                                        </motion.span>
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className="flex w-full flex-row items-center justify-center gap-4 py-4">
                            <div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />

                            <motion.span
                                layout
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="colors whitespace-nowrap text-center font-medium text-d5 dark:text-l5 text-base"
                            >
                                外部接続
                            </motion.span>

                            <div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />
                        </div>

                        <div className="flex w-full flex-col items-center justify-center gap-4">
                            <Button onClick={() => handleSocialAuth("google")} className="colors flex w-full h-15 items-center justify-center rounded-full bg-d1 dark:bg-l1 hover:bg-d2 focus-visible:bg-d2 dark:focus-visible:bg-l2 dark:hover:bg-l2">
                                <motion.span
                                    layout
                                    transition={{ duration: 0.5, ease: "backOut" }}
                                    className="all whitespace-nowrap text-right font-bold text-xl text-l1 dark:text-d1"
                                >
                                    Googleで接続
                                </motion.span>
                            </Button>
                        </div>
                    </motion.div>
                )}

                {mode === "signup" && (
                    <motion.div key="signup"
                        layout
                        initial={{ opacity: 0, filter: "blur(1rem)" }}
                        animate={{ opacity: 1, filter: "blur(0)" }}
                        exit={{ opacity: 0, filter: "blur(1rem)" }}
                        transition={{ duration: 0.5, ease: "backOut" }}
                        className="w-full flex flex-col items-center gap-4 overflow-y-auto p-2"
                    >
                        <div className="flex w-full flex-row items-center justify-center gap-4 py-4">
                            <div className="colors h-px w-full rounded-full bg-blue" />

                            <motion.span
                                layout
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="colors whitespace-nowrap text-center font-medium text-blue text-base"
                            >
                                アカウント登録
                            </motion.span>

                            <div className="colors h-px w-full rounded-full bg-blue" />
                        </div>

                        <form noValidate onSubmit={handleSignup} className="flex w-full flex-col items-center justify-center gap-8">
                            <div className="flex flex-col w-full justify-center items-center gap-4">
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
                                    onChange={(e) => handleSignupChange("email", e.target.value)}
                                    className="colors border-l5 dark:border-d5"
                                />

                                <div className="relative w-full flex flex-col gap-1">
                                    <div className="relative w-full">
                                        <Input required type="text" name="code" value={signupCode} label="認証コード" error={errors.code} onChange={(e) => handleSignupChange("code", e.target.value)} className="colors border-l5 dark:border-d5 pr-20" />
                                        <div className="absolute right-4 top-[calc(50%+12px)] -translate-y-1/2 flex items-center gap-2">
                                            <div className="h-4 w-px bg-l5 dark:bg-d5"></div>
                                            <button type="button" onClick={handleSendCode} disabled={isSendingCode || signupEmail.length < 4} className="text-blue font-bold text-sm hover:underline disabled:opacity-50 disabled:no-underline outline-none">
                                                {isSendingCode ? "..." : "送信"}
                                            </button>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {sentMessage && (
                                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-blue text-xs font-medium px-2">{sentMessage}</motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>

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
                                    onChange={(e) => handleSignupChange("password", e.target.value)}
                                    className="colors border-l5 dark:border-d5"
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
                                    error={errors.confirmPassword}
                                    onChange={(e) => handleSignupChange("confirmPassword", e.target.value)}
                                    className="colors border-l5 dark:border-d5"
                                />

                                <div className="flex w-full flex-col items-start justify-center gap-1">
                                    <Label className="flex w-full cursor-pointer flex-row items-center justify-start gap-3 rounded-xl p-2 hover:bg-l2/50 dark:hover:bg-d2/50">
                                        <div className="relative flex size-6 flex-none items-center justify-center">
                                            <input type="checkbox" className="peer absolute inset-0 size-full cursor-pointer opacity-0" checked={termsAccepted} onChange={(e) => handleSignupChange("termsAccepted", e.target.checked)} />
                                            <div className={`colors flex size-full items-center justify-center rounded-md border-2 transition-colors ${termsAccepted ? "border-blue bg-blue" : "border-l5 bg-transparent dark:border-d5"} peer-focus-visible:ring-2 peer-focus-visible:ring-blue peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-l1 dark:peer-focus-visible:ring-offset-d1`}>
                                                <Check className={`size-4 text-l1 transition-opacity ${termsAccepted ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
                                            </div>
                                        </div>
                                        <span className="colors text-left font-medium text-sm text-d1 dark:text-l1">
                                            <Link href="/terms-of-service" className="text-blue hover:underline" target="_blank">利用規約</Link> と <Link href="/privacy-policy" className="text-blue hover:underline" target="_blank">プライバシーポリシー</Link> に同意します。
                                        </span>
                                    </Label>
                                    <AnimatePresence>
                                        {errors.termsAccepted && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-2">
                                                <span className="colors text-left font-medium text-sm text-red">⚠ {errors.termsAccepted}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <AnimatePresence>
                                    {errors.root && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.5, ease: "backOut" }}
                                            className="px-4 w-full flex justify-start items-center"
                                        >
                                            <motion.span
                                                layout
                                                transition={{ duration: 0.5, ease: "backOut" }}
                                                className="colors text-left font-medium text-red text-base"
                                            >
                                                ⚠ {errors.root}
                                            </motion.span>
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
                                    <motion.span
                                        layout
                                        transition={{ duration: 0.5, ease: "backOut" }}
                                        className={`all whitespace-nowrap text-center font-bold text-d1 text-xl dark:text-l1
                                        ${isSignupInvalid &&
                                            "text-d5 dark:text-l5 scale-100!"}`}
                                    >
                                        登録
                                    </motion.span>
                                </Button>

                                <div className="flex w-full flex-row items-center justify-center px-2">
                                    <motion.span
                                        layout
                                        transition={{ duration: 0.5, ease: "backOut" }}
                                        className="colors whitespace-nowrap text-center font-medium text-base text-d1 dark:text-l1"
                                    >
                                        アカウントを登録済：
                                    </motion.span>

                                    <Button onClick={() => switchMode("signin")} className="colors flex items-center justify-center rounded-full px-2 decoration-2 decoration-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue">
                                        <motion.span
                                            layout
                                            transition={{ duration: 0.5, ease: "backOut" }}
                                            className="all whitespace-nowrap text-center font-medium text-base text-blue"
                                        >
                                            接続
                                        </motion.span>
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className="flex w-full flex-row items-center justify-center gap-4 py-4">
                            <div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />

                            <motion.span
                                layout
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="colors whitespace-nowrap text-center font-medium text-d5 dark:text-l5 text-base"
                            >
                                外部接続
                            </motion.span>

                            <div className="colors h-px w-full rounded-full bg-d5 dark:bg-l5" />
                        </div>

                        <div className="flex w-full flex-col items-center justify-center gap-4">
                            <Button onClick={() => handleSocialAuth("google")} className="colors flex w-full h-15 items-center justify-center rounded-full bg-d1 dark:bg-l1 hover:bg-d2 focus-visible:bg-d2 dark:focus-visible:bg-l2 dark:hover:bg-l2">
                                <motion.span
                                    layout
                                    transition={{ duration: 0.5, ease: "backOut" }}
                                    className="all whitespace-nowrap text-right font-bold text-xl text-l1 dark:text-d1"
                                >
                                    Googleで接続
                                </motion.span>
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

                            <motion.span
                                layout
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="colors whitespace-nowrap text-center font-medium text-red text-base"
                            >
                                アカウント切断
                            </motion.span>

                            <div className="colors h-px w-full rounded-full bg-red" />
                        </div>

                        <div className="flex w-full flex-col items-center justify-center gap-4">
                            <motion.span
                                layout
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="all whitespace-nowrap text-center font-medium text-d1 dark:text-l1 text-base"
                            >
                                接続中のアカウントから切断しますか？
                            </motion.span>

                            <AnimatePresence>
                                {errors.root && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: "backOut" }}
                                        className="px-4 w-full flex justify-start items-center"
                                    >
                                        <motion.span
                                            layout
                                            transition={{ duration: 0.5, ease: "backOut" }}
                                            className="colors text-left font-medium text-red text-base"
                                        >
                                            ⚠ {errors.root}
                                        </motion.span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button onClick={handleSignout} className="colors flex h-15 w-full items-center justify-center rounded-full bg-red px-4">
                                <motion.span
                                    layout
                                    transition={{ duration: 0.5, ease: "backOut" }}
                                    className="all whitespace-nowrap text-center font-medium text-d1 dark:text-l1 text-base"
                                >
                                    切断
                                </motion.span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}