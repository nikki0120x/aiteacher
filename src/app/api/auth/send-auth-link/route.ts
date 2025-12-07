/* src\app\api\auth\send-auth-link\route.ts */
import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import AuthLinkEmail from "@/emails/AuthLinkEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: "メールアドレスが必要です" },
                { status: 400 }
            );
        }

        const verificationToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.verification.upsert({
            where: { identifier: email },
            update: {
                value: verificationToken,
                expiresAt: expiresAt,
            },
            create: {
                identifier: email,
                value: verificationToken,
                expiresAt: expiresAt,
                id: uuidv4(),
            },
        });

        const verificationUrl =
            `${process.env.NEXT_PUBLIC_BASE_URL}` +
            `/api/auth/verify-auth-link?token=${verificationToken}&email=${email}`;

        await resend.emails.send({
            from: "FoCalrina <noreply@focalrina.com>",
            to: [email],
            subject: "メールアドレスの認証をお願いします！",
            react: AuthLinkEmail({ verificationUrl }),
        });

        return NextResponse.json({ message: "認証リンクを送信しました" });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { message: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
