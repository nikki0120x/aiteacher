// src/lib/prisma.ts の修正

import { PrismaClient } from "../../prisma/generated/prisma/client"

// 必須のAccelerate URLを環境変数から取得し、存在しない場合はエラーをスローする
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;

if (!accelerateUrl) {
	// 実行時にURLがないと必ず失敗するため、開発中に即座に知らせる
	throw new Error('PRISMA_ACCELERATE_URL が設定されていません。Prisma Accelerateを使用するには必須です。');
}

// グローバルな環境にPrismaClientのインスタンスを格納する場所を定義
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// 既存のインスタンスがあればそれを使用し、なければ新しく作成する
export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		// TypeScriptはここで accelerateUrl が string であることを保証します。
		accelerateUrl: accelerateUrl,
		log: ['query', 'info', 'warn', 'error'],
	});

// ... (シングルトンロジックの続き) ...