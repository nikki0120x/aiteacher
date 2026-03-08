// src/app/api/upload/route.ts
import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || "file";

    if (!request.body) return NextResponse.json({ error: "No body" }, { status: 400 });

    const blob = await put(filename, request.body, {
        access: "public",
        addRandomSuffix: true,
    });

    return NextResponse.json(blob);
}

export async function DELETE(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const urlToDelete = searchParams.get("url");

    if (!urlToDelete) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        await del(urlToDelete);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}