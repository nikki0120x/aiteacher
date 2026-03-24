import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSession } from "@/lib/schema";
import { headers } from "next/headers";
import { desc, eq, and } from "drizzle-orm";
import { type NextRequest } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { id, title, flowData } = await req.json();

        if (!id || !flowData) {
            return new Response("Bad Request: Missing required fields", {
                status: 400,
            });
        }

        await db
            .insert(chatSession)
            .values({
                id,
                userId: session.user.id,
                title: title || "新しい会話",
                flowData,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: chatSession.id,
                set: {
                    title: title || "新しい会話",
                    flowData,
                    updatedAt: new Date(),
                },
            });

        return Response.json({ success: true });
    } catch (error) {
        console.error("History saving error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const id = req.nextUrl.searchParams.get("id");

        // IDが指定されている場合は個別データを返す（チャット復元用）
        if (id) {
            const data = await db.query.chatSession.findFirst({
                where: and(
                    eq(chatSession.id, id),
                    eq(chatSession.userId, session.user.id)
                ),
            });
            return Response.json(data || { error: "Not Found" });
        }

        // IDがない場合は一覧を返す（サイドバーリスト用）
        const list = await db
            .select({
                id: chatSession.id,
                title: chatSession.title,
                updatedAt: chatSession.updatedAt,
            })
            .from(chatSession)
            .where(eq(chatSession.userId, session.user.id))
            .orderBy(desc(chatSession.updatedAt));

        return Response.json(list);
    } catch (error) {
        console.error("History fetching error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}