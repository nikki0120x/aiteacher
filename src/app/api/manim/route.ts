import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { formula, code } = await request.json();
        const payload = code ? { code } : { formula };
        const MODAL_URL = " https://nikki0120x--manim-app-v2-generate-graph-image.modal.run";

        const response = await fetch(MODAL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Modal Error [${response.status}]:`, errorText);
            throw new Error(`Modal generation failed: ${response.status} ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        return NextResponse.json({
            image: `data:image/png;base64,${base64}`
        });
    } catch (error) {
        console.error("Manim API Error:", error);
        return NextResponse.json({ error: "Failed to generate graph" }, { status: 500 });
    }
}