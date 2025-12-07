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

        // -----------------------------------------------------
        // ★ デバッグログ 1: トークンの内容確認
        // -----------------------------------------------------
        console.log("DB Email:", email);
        console.log("DB Token (Verification):", verificationRecord?.value);
        console.log("URL Token:", token);
        // -----------------------------------------------------

        // 2. レコードが存在しない、またはトークンが不一致の場合
        if (!verificationRecord || verificationRecord.value !== token) {
            console.error("Token Mismatch or Not Found");
            return NextResponse.json(
                { message: "無効なトークンです" },
                { status: 400 }
            );
        }

        // 3. 有効期限切れのチェック
        if (new Date() > verificationRecord.expiresAt) {
            console.error("Token Expired");
            // ... (期限切れとして処理)
        }

        // 4. DB更新 (トランザクションで一貫性を保つ)
        await prisma.$transaction([
            prisma.user.update({
                where: { email: email },
                data: { emailVerified: true },
            }),
            prisma.verification.delete({
                where: { identifier: email },
            }),
        ]);

        // -----------------------------------------------------
        // ★ デバッグログ 2: 成功ログ
        // -----------------------------------------------------
        console.log(`Verification SUCCESS for: ${email}`);
        // -----------------------------------------------------

        // 5. 成功時のリダイレクト
        return NextResponse.redirect(new URL('/dashboard', request.url));

    } catch (error) {
        // -----------------------------------------------------
        // ★ デバッグログ 3: トランザクション失敗時のエラー出力
        // -----------------------------------------------------
        console.error("Verification Transaction FAILED:", error);
        // -----------------------------------------------------
        return NextResponse.json(
            { message: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}