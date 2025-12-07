/* src\app\api\verify-link\route.ts */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
        return NextResponse.json(
            { message: "不正なリクエストです" },
            { status: 400 }
        );
    }

    try {
        const verificationRecord = await prisma.verification.findUnique({
            where: { identifier: email },
        });

        if (!verificationRecord || verificationRecord.value !== token) {
            return NextResponse.json(
                { message: "無効なトークンです" },
                { status: 400 }
            );
        }

        if (new Date() > verificationRecord.expiresAt) {
            return NextResponse.json(
                { message: "リンクの有効期限が切れています" },
                { status: 400 }
            );
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { email: email },
                data: { emailVerified: true },
            }),
            prisma.verification.delete({
                where: { identifier: email },
            }),
        ]);

        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json(
            { message: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}