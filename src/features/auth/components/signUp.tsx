/* src\features\auth\components\register-form.tsx */
"use client";
import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Divider, Button, Form, Input, Spinner } from "@heroui/react";
import { Eye, EyeClosed } from "lucide-react";
import { signUp } from "@/lib/auth-client";

interface SignUpFormProps {
    closeModal: () => void;
    switchToSignIn: () => void;
}

export default function SignUpForm({
    switchToSignIn,
}: SignUpFormProps) {
    // ================================================================
    //     1. サインアップフォーム
    // ================================================================

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);

        const res = await signUp.email({
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        });

        if (res.error) {
            setError(res.error.message || "Something went wrong.");
        } else {
            router.push("/dashboard");
        }
    }

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
                    アカウントサインアップ
                </span>
                <Divider
                    orientation="horizontal"
                    className="h-px w-full flex-1 rounded-4xl bg-d2 dark:bg-l2"
                />
            </div>
            <Form
                onSubmit={handleSubmit}
                className="flex w-full flex-col items-center justify-start gap-4"
            >
                <Input
                    isRequired
                    label="メールアドレス"
                    type="email"
                    maxLength={255}
                    className="[&>div:first-child]:h-16 [&>div:first-child]:px-4 [&>div:nth-child(2)]:bg-transparent [&>div]:rounded-3xl [&>div]:bg-l3 [&>div]:dark:bg-d3 [&_input]:text-base"
                />
                <Input
                    isRequired
                    label="パスワード"
                    type={isVisible ? "text" : "password"}
                    minLength={8}
                    maxLength={32}
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
                    aria-label="Submit SignUp Information"
                    type="submit"
                    className="my-4 h-16 w-full rounded-3xl bg-blue text-l1 transition-all duration-250"
                >
                    <span className="font-medium text-xl">サインアップ</span>
                </Button>
            </Form>
            <div className="flex flex-row items-center justify-center">
                <span className="font-medium text-base text-d2 dark:text-l2">
                    既にアカウントをサインアップ済:&emsp;
                </span>
                <Button
                    aria-label="SignUp Now"
                    className="bg-transparent hover:bg-blue/10 focus-visible:bg-blue/10 active:bg-blue/10"
                    onPress={switchToSignIn}
                >
                    <span className="font-medium text-base text-blue">サインイン</span>
                </Button>
            </div>
        </div>
    );
}