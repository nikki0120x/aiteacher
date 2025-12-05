// src/actions/auth-actions.ts の修正

"use server";
// 以下のコードは、PrismaClientの直接利用であり、シングルトン化により不要になりました。
// import { PrismaClient } from "@prisma/client"; 
// const prisma = new PrismaClient(); 

// 修正点: src/lib/prisma から名前付きエクスポートの 'prisma' をインポートします
import { prisma } from "@/lib/prisma";

// better-authのユーザーIDとメールアドレスを引数に取る
export async function createUserInDb(email: string, authId: string) {
    try {
        await prisma.user.create({
            data: {
                email: email,
                better_auth_id: authId, // スキーマに合わせてください
            },
        });
        return null; // 成功
    } catch (e) {
        console.error("データベース登録エラー:", e);
        return { message: "DBへのユーザーレコード作成に失敗しました。" };
    }
}