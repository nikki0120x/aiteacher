"use server";
import { db } from "@/lib/db";
import { user, verification } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import { Resend } from "resend";
import AuthCodeEmail from "@/emails/AuthLinkEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendOtpCode(email: string) {
    if (!email || !email.includes("@")) return { error: "有効なメールアドレスを入力してください。" };

    const existingUser = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existingUser) return { error: "このメールアドレスは既に登録されています。" };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.delete(verification).where(eq(verification.identifier, email));
    await db.insert(verification).values({
        id: crypto.randomUUID(),
        identifier: email,
        value: code,
        expiresAt,
    });

    try {
        await resend.emails.send({
            from: "FoCalrina <noreply@focalrina.com>",
            to: email,
            subject: `${code}`,
            react: AuthCodeEmail({ validationCode: code }),
        });
        return { success: true };
    } catch {
        return { error: "メールの送信に失敗しました。" };
    }
}

export async function verifyOtpCode(email: string, code: string) {
    const record = await db.query.verification.findFirst({
        where: and(
            eq(verification.identifier, email),
            eq(verification.value, code),
            gt(verification.expiresAt, new Date())
        )
    });

    if (!record) return { error: "認証コードが無効か、期限切れです。" };
    await db.delete(verification).where(eq(verification.id, record.id));
    return { success: true };
}

export async function markEmailAsVerified(email: string) {
    await db.update(user).set({ emailVerified: true }).where(eq(user.email, email));
}