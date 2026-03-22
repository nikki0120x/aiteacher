"use server";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { Resend } from "resend";
import AuthCodeEmail from "@/emails/AuthLinkEmail";
import { db } from "@/lib/db";
import { rateLimit, user, verification } from "@/lib/schema";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
	throw new Error("RESEND_API_KEY is not defined");
}
const resend = new Resend(apiKey);

const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 10;

const getIp = async () => {
	const fallback = "0.0.0.0";

	try {
		const forwardedFor = (await headers()).get("x-forwarded-for");
		if (forwardedFor) return forwardedFor.split(",")[0].trim();
		return fallback;
	} catch {
		return fallback;
	}
};

export async function checkActionRateLimit(
	action: "signin" | "signup" | "otp",
) {
	const ip = await getIp();
	const record = await db.query.rateLimit.findFirst({
		where: and(eq(rateLimit.ip, ip), eq(rateLimit.action, action)),
	});

	if (record?.lockoutUntil && record.lockoutUntil > new Date()) {
		return { locked: true, lockoutUntil: record.lockoutUntil.toISOString() };
	}
	return { locked: false };
}

export async function recordFailedAttempt(action: "signin" | "signup" | "otp") {
	const ip = await getIp();
	const record = await db.query.rateLimit.findFirst({
		where: and(eq(rateLimit.ip, ip), eq(rateLimit.action, action)),
	});

	const now = new Date();
	if (!record) {
		await db.insert(rateLimit).values({
			id: crypto.randomUUID(),
			ip,
			action,
			attempts: 1,
			updatedAt: now,
		});
		return { locked: false, attempts: 1 };
	}

	const newAttempts = record.attempts + 1;
	if (newAttempts >= MAX_ATTEMPTS) {
		const lockoutUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
		await db
			.update(rateLimit)
			.set({ attempts: newAttempts, lockoutUntil, updatedAt: now })
			.where(eq(rateLimit.id, record.id));
		return { locked: true, lockoutUntil: lockoutUntil.toISOString() };
	} else {
		await db
			.update(rateLimit)
			.set({ attempts: newAttempts, updatedAt: now })
			.where(eq(rateLimit.id, record.id));
		return { locked: false, attempts: newAttempts };
	}
}

export async function resetRateLimit(action: "signin" | "signup" | "otp") {
	const ip = await getIp();
	await db
		.delete(rateLimit)
		.where(and(eq(rateLimit.ip, ip), eq(rateLimit.action, action)));
}

export async function sendOtpCode(email: string) {
	if (!email || !email.includes("@"))
		return { error: "有効なメールアドレスを入力してください。" };

	const existingUser = await db.query.user.findFirst({
		where: eq(user.email, email),
	});
	if (existingUser)
		return { error: "このメールアドレスは既に登録されています。" };

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
	const limitCheck = await checkActionRateLimit("otp");
	if (limitCheck.locked) {
		return {
			error: "TOO_MANY_REQUESTS",
			lockoutUntil: limitCheck.lockoutUntil,
		};
	}

	const record = await db.query.verification.findFirst({
		where: and(
			eq(verification.identifier, email),
			eq(verification.value, code),
			gt(verification.expiresAt, new Date()),
		),
	});

	if (!record) {
		const failRecord = await recordFailedAttempt("otp");
		if (failRecord.locked) {
			return {
				error: "TOO_MANY_REQUESTS",
				lockoutUntil: failRecord.lockoutUntil,
			};
		}
		return { error: "認証コードが無効か、期限切れです。" };
	}

	await resetRateLimit("otp");
	await db.delete(verification).where(eq(verification.id, record.id));
	return { success: true };
}

export async function markEmailAsVerified(email: string) {
	await db
		.update(user)
		.set({ emailVerified: true })
		.where(eq(user.email, email));
}
