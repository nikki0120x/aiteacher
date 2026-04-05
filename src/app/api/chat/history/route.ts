import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSession } from "@/lib/schema";

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

		if (id) {
			const data = await db.query.chatSession.findFirst({
				where: and(
					eq(chatSession.id, id),
					eq(chatSession.userId, session.user.id),
				),
			});
			return Response.json(data || { error: "Not Found" });
		}

		// flowDataも取得するように追加
		const list = await db
			.select({
				id: chatSession.id,
				title: chatSession.title,
				updatedAt: chatSession.updatedAt,
				flowData: chatSession.flowData,
			})
			.from(chatSession)
			.where(eq(chatSession.userId, session.user.id))
			.orderBy(desc(chatSession.updatedAt));

		// flowDataからカリキュラムのパスを抽出
		const mappedList = list.map((item) => {
			let curriculum = "未分類";
			try {
				const flow = item.flowData as any;
				// 問題判別された最初のメッセージを確認
				if (
					flow?.turns?.[0]?.pages?.[0]?.messages?.model?.[0]?.blocks?.[0]
						?.content
				) {
					const content =
						flow.turns[0].pages[0].messages.model[0].blocks[0].content;
					// "Curriculum: 教科/科目/単元" を抽出する正規表現
					const match = content.match(/Curriculum:\s*"?([^"\n]+)"?/);
					if (match?.[1].includes("/")) {
						curriculum = match[1].trim();
					}
				}
			} catch (e) {
				console.error("Parse error:", e);
			}

			return {
				id: item.id,
				title: item.title,
				curriculum, // 追加
			};
		});

		return Response.json(mappedList);
	} catch (error) {
		console.error("History fetching error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
