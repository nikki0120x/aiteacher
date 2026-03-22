import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const payload = await request.json();
		const { from, to, subject, text, html } = payload.data;

		console.log("メールを受信しました:", { from, subject });

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (_error) {
		return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
	}
}
