/* src\app\api\webhooks\better-auth\route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    // better-authからのシークレットなどでリクエストを検証する
    // ... (検証ロジック)

    const payload = await req.json();

    // better-authのペイロードからユーザーIDとメールアドレスを取得
    const { id: authId, email } = payload.user;

    if (payload.type === 'user.created') {
        try {
            await prisma.user.create({
                data: {
                    email: email,
                    better_auth_id: authId,
                },
            });
            return NextResponse.json({ success: true }, { status: 200 });
        } catch (error) {
            console.error("DB登録エラー:", error);
            return NextResponse.json({ error: "DB registration failed" }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });
}