import { Storage } from "@google-cloud/storage";
import { NextResponse } from "next/server";
import { v7 as uuidv7 } from "uuid";

const project = process.env.GOOGLE_CLOUD_PROJECT || "aiteacher-0120";
const bucketName = process.env.GCS_BUCKET_NAME || "aiteacher-media";

const client_email = process.env.GOOGLE_CLIENT_EMAIL;
let private_key = process.env.GOOGLE_PRIVATE_KEY;

if (private_key) {
    private_key = private_key
        .replace(/\\n/g, "\n")
        .replace(/\r/g, "")
        .replace(/^"|"$/g, "");
}

const credentials =
    client_email && private_key
        ? { client_email, private_key }
        : undefined;

// GCSクライアントの初期化
const storage = new Storage({
    projectId: project,
    credentials,
});
const bucket = storage.bucket(bucketName);

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const originalFilename = searchParams.get("filename") || "file";

    // UUIDを追加してファイル名の重複を防ぐ
    const filename = `${uuidv7()}-${originalFilename}`;

    if (!request.body) return NextResponse.json({ error: "No body" }, { status: 400 });

    try {
        const file = bucket.file(filename);
        const buffer = Buffer.from(await request.arrayBuffer());
        const contentType = request.headers.get("content-type") || "application/octet-stream";

        // GCSに保存
        await file.save(buffer, {
            resumable: false,
            metadata: {
                contentType: contentType,
            },
        });

        // フロントエンドでのプレビュー用に公開URLを生成
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error("GCS Upload Error:", error);
        return NextResponse.json({ error: "Failed to upload to GCS", details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const urlToDelete = searchParams.get("url");

    if (!urlToDelete) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        // 公開URLからファイル名を抽出して削除
        const urlPattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
        const match = urlToDelete.match(urlPattern);

        if (match && match[1]) {
            const filename = decodeURIComponent(match[1]);
            await bucket.file(filename).delete();
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("GCS Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete", details: error.message }, { status: 500 });
    }
}