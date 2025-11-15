/* src\hooks\useImageUpload.ts */
import { useState, useRef, useCallback } from "react";
import type { ImageItem } from "@/types/chat";

const compressImage = (
	base64Src: string,
	maxWidth: number = 1024,
	quality: number = 0.8,
): Promise<{ base64: string; mimeType: string }> => {
	return new Promise((resolve) => {
		const originalBase64Data = base64Src.split(",")[1] || "";
		const originalSizeKB = (originalBase64Data.length * 0.75) / 1024;

		const img = new window.Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			let width = img.width;
			let height = img.height;

			if (width > maxWidth) {
				height *= maxWidth / width;
				width = maxWidth;
			}

			canvas.width = width;
			canvas.height = height;

			if (ctx) {
				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0, width, height);
			}

			const mimeType = "image/webp";
			const compressedDataUrl = canvas.toDataURL(mimeType, quality);
			const compressedBase64Only = compressedDataUrl.split(",")[1] || "";
			const compressedSizeKB = (compressedBase64Only.length * 0.75) / 1024;

			console.log(
				`[Compression Log] File Size: Original: ${originalSizeKB.toFixed(
					2,
				)} KB -> Compressed (${mimeType}, Quality ${
					quality * 100
				}%): ${compressedSizeKB.toFixed(2)} KB`,
			);

			resolve({ base64: compressedBase64Only, mimeType: mimeType });
		};
		img.src = base64Src;
	});
};

type ImageSet = { [key: string]: ImageItem[] };

export const useImageUpload = (initialImages: ImageSet = { problem: [] }) => {
	const [images, setImages] = useState<ImageSet>(initialImages);
	const problemInputRef = useRef<HTMLInputElement>(null);

	const handleFiles = useCallback((tabKey: string, files: FileList | null) => {
		if (!files) return;
		const fileArray = Array.from(files).filter((file) =>
			file.type.startsWith("image/"),
		);

		fileArray.forEach((file) => {
			const reader = new FileReader();
			reader.onload = async () => {
				const base64Src = reader.result?.toString();
				if (base64Src) {
					// 圧縮ロジックを独立関数として使用
					const { base64: compressedBase64, mimeType } =
						await compressImage(base64Src);

					const newImageItem: ImageItem = {
						id: crypto.randomUUID(),
						src: `data:${mimeType};base64,${compressedBase64}`,
						fileName: file.name,
					};
					setImages((prev) => ({
						...prev,
						[tabKey]: [...prev[tabKey], newImageItem],
					}));
				}
			};
			reader.readAsDataURL(file);
		});
	}, []);

	/**
	 * ドラッグ&ドロップイベントを処理
	 */
	const handleDrop = useCallback(
		(tabKey: string, event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			handleFiles(tabKey, event.dataTransfer.files);
		},
		[handleFiles],
	);

	/**
	 * 画像を状態から削除
	 */
	const handleImageRemove = useCallback(
		(tabKey: string, idToRemove: string) => {
			setImages((prev) => ({
				...prev,
				[tabKey]: prev[tabKey].filter((item) => item.id !== idToRemove),
			}));
		},
		[],
	);

	return {
		images,
		setImages,
		problemInputRef,
		handleFiles,
		handleDrop,
		handleImageRemove,
	};
};
