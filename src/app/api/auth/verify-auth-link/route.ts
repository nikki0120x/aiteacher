/* src\app\api\verify-link\route.ts */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    // パラメータ不足の場合
    if (!token || !email) {
        return NextResponse.json(
            { message: "不正なリクエストです" },
            { status: 400 }
        );
    }

    try {
        // 1. Verificationテーブルからトークンを検索
        const verificationRecord = await prisma.verification.findUnique({
            where: { identifier: email },
        });

        // 2. レコードが存在しない、またはトークンが不一致の場合
        if (!verificationRecord || verificationRecord.value !== token) {
            return NextResponse.json(
                { message: "無効なトークンです" },
                { status: 400 }
            );
            // ユーザー体験を良くする場合、ここでエラー画面へリダイレクトさせても良いです
            // return NextResponse.redirect(new URL('/auth/verify-error', request.url));
        }

        // 3. 有効期限切れのチェック
        if (new Date() > verificationRecord.expiresAt) {
            return NextResponse.json(
                { message: "リンクの有効期限が切れています" },
                { status: 400 }
            );
        }

        // 4. DB更新 (トランザクションで一貫性を保つ)
        // UserのemailVerifiedをtrueにし、Verificationレコードを削除する
        await prisma.$transaction([
            prisma.user.update({
                where: { email: email },
                data: { emailVerified: true },
            }),
            prisma.verification.delete({
                where: { identifier: email },
            }),
        ]);

        // 5. 成功時のリダイレクト
        // 処理が完了したので、サインインページ等へ飛ばします
        // クエリパラメータ ?verified=true をつけることで、画面側で「認証成功」と表示できます
        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json(
            { message: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}