/* src/app/chat/page.tsx */
"use client";
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Accordion,
	AccordionItem,
	addToast,
	Button,
	Card,
	CardBody,
	Divider,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	ScrollShadow,
	type SharedSelection,
	Slider,
	Spinner,
	Switch,
	Textarea,
	Tooltip,
} from "@heroui/react";
import {
	BookCheck,
	Info,
	BookText,
	BowArrow,
	ChevronDown,
	Copy,
	Crop,
	ImageUp,
	LineSquiggle,
	Mic,
	MicOff,
	ZoomIn,
	Pause,
	ZoomOut,
	ScanSearch,
	ScrollText,
	SendHorizontal,
	Settings2,
	TriangleAlert,
	Type,
	X,
} from "lucide-react";
import { AnimatePresence, easeInOut, motion } from "motion/react";
import Image from "next/image";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { BlockMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useChatDisplay } from "@/hooks/useChatDisplay";
import { useChatLogic } from "@/hooks/useChatLogic";
import { responseModes, useChatSettings } from "@/hooks/useChatSettings";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useChatInput } from "@/hooks/useTextInput";
import { useChatStore } from "@/stores/useChat";
import type { ContentBlock, TurnItemProps } from "@/types/chat";

declare global {
	interface Window {
		__TAURI__?: unknown;
	}
}

const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
	const response = await fetch(blobUrl);
	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64data = reader.result as string;
			resolve(base64data.split(",")[1]);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

// ================================================================
//     WebP変換ヘルパー
// ================================================================

const convertFileToWebP = (file: File): Promise<File> => {
	if (!file.type.startsWith("image/") || file.type === "image/webp") {
		return Promise.resolve(file);
	}

	return new Promise((resolve) => {
		const img = document.createElement("img");
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				resolve(file);
				return;
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const newFileName = `${file.name.replace(/\.[^/.]+$/, "")}.webp`;
						const newFile = new File([blob], newFileName, {
							type: "image/webp",
							lastModified: Date.now(),
						});
						resolve(newFile);
					} else {
						resolve(file);
					}
				},
				"image/webp",
				0.75,
			);
		};
		img.onerror = () => resolve(file);
		img.src = URL.createObjectURL(file);
	});
};

const extractJsonArray = (jsonString: string, key: string): ContentBlock[] => {
	try {
		const parsed = JSON.parse(jsonString);
		return Array.isArray(parsed[key]) ? parsed[key] : [];
	} catch { }

	const regex = new RegExp(`"${key}"\\s*:\\s*\\[(.*?)(?:\\]|$)`, "s");
	const match = jsonString.match(regex);
	if (!match) return [];

	const innerContent = match[1];
	const objectMatches = innerContent.match(/\{[^{}]+\}/g);

	if (!objectMatches) return [];

	const results: ContentBlock[] = [];
	for (const objStr of objectMatches) {
		try {
			results.push(JSON.parse(objStr));
		} catch { }
	}
	return results;
};

// ================================================================
//     Zoomable Image Component (New)
// ================================================================

interface ZoomableImageProps {
	src: string;
	alt: string;
	isConverting: boolean;
	zoomLevel: number;
	onZoomChange: (zoom: number) => void;
	isSliderDragging: boolean;
}

const ZoomableImage = ({ src, alt, isConverting, zoomLevel, onZoomChange, isSliderDragging, }: ZoomableImageProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
	const [isDragging, setIsDragging] = useState(false);
	const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

	const dragStart = useRef({ x: 0, y: 0 });
	const startTransform = useRef({ x: 0, y: 0 });
	const isPinching = useRef(false);
	const touchStartRef = useRef<{
		dist: number;
		center: { x: number; y: number };
		transform: { x: number; y: number; scale: number };
	} | null>(null);

	const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

	const MAX_SCALE_LIMIT = 10;

	const resetZoom = useCallback(() => {
		setTransform({ x: 0, y: 0, scale: 1 });
		onZoomChange(1);
	}, [onZoomChange]);

	useEffect(() => {
		resetZoom();
	}, [resetZoom, src]);

	const getBounds = useCallback(
		(scale: number, rect: DOMRect) => {
			if (naturalSize.w === 0 || naturalSize.h === 0) {
				return {
					minX: rect.width * (1 - scale),
					maxX: 0,
					minY: rect.height * (1 - scale),
					maxY: 0,
				};
			}

			const imgRatio = naturalSize.w / naturalSize.h;
			const containerRatio = rect.width / rect.height;

			let rw = rect.width;
			let rh = rect.height;

			if (imgRatio > containerRatio) {
				rh = rect.width / imgRatio;
			} else {
				rw = rect.height * imgRatio;
			}

			const offX = (rect.width - rw) / 2;
			const offY = (rect.height - rh) / 2;

			const upperX = -offX * scale;
			const upperY = -offY * scale;
			const lowerX = rect.width - (offX + rw) * scale;
			const lowerY = rect.height - (offY + rh) * scale;

			return {
				minX: lowerX > upperX ? (lowerX + upperX) / 2 : lowerX,
				maxX: lowerX > upperX ? (lowerX + upperX) / 2 : upperX,
				minY: lowerY > upperY ? (lowerY + upperY) / 2 : lowerY,
				maxY: lowerY > upperY ? (lowerY + upperY) / 2 : upperY,
			};
		},
		[naturalSize],
	);

	const clamp = (val: number, min: number, max: number) =>
		Math.min(Math.max(val, min), max);

	useEffect(() => {
		if (
			zoomLevel !== transform.scale &&
			!isPinching.current &&
			!isDragging &&
			containerRef.current
		) {
			const rect = containerRef.current.getBoundingClientRect();
			const targetScale = Math.min(Math.max(1, zoomLevel), MAX_SCALE_LIMIT);

			const cx = rect.width / 2;
			const cy = rect.height / 2;

			const pImgX = (cx - transform.x) / transform.scale;
			const pImgY = (cy - transform.y) / transform.scale;

			let newX = cx - pImgX * targetScale;
			let newY = cy - pImgY * targetScale;

			const bounds = getBounds(targetScale, rect);
			newX = clamp(newX, bounds.minX, bounds.maxX);
			newY = clamp(newY, bounds.minY, bounds.maxY);

			setTransform({ x: newX, y: newY, scale: targetScale });
		}
	}, [zoomLevel, naturalSize]);

	const handleWheel = (e: React.WheelEvent) => {
		if (isConverting) return;
		e.preventDefault();
		if (!containerRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const delta = -e.deltaY * 0.001;
		const newScale = Math.min(
			Math.max(1, transform.scale + delta * transform.scale),
			MAX_SCALE_LIMIT,
		);

		if (newScale === 1) {
			resetZoom();
			return;
		}

		const ratio = newScale / transform.scale;
		const bounds = getBounds(newScale, rect);
		const newX = clamp(x - (x - transform.x) * ratio, bounds.minX, bounds.maxX);
		const newY = clamp(y - (y - transform.y) * ratio, bounds.minY, bounds.maxY);

		setTransform({ x: newX, y: newY, scale: newScale });
		onZoomChange(newScale);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		if (isConverting) return;

		if (e.touches.length === 2) {
			isPinching.current = true;
			setIsDragging(false);

			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;

			const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
			const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
			const cy = (t1.clientY + t2.clientY) / 2 - rect.top;

			touchStartRef.current = {
				dist,
				center: { x: cx, y: cy },
				transform: { ...transform },
			};
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (isConverting) return;

		if (
			isPinching.current &&
			e.touches.length === 2 &&
			touchStartRef.current &&
			containerRef.current
		) {
			e.preventDefault();
			e.stopPropagation();

			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const rect = containerRef.current.getBoundingClientRect();

			const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
			const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
			const cy = (t1.clientY + t2.clientY) / 2 - rect.top;

			const {
				dist: startDist,
				center: startCenter,
				transform: startTransform,
			} = touchStartRef.current;

			const scaleRatio = dist / startDist;
			let newScale = startTransform.scale * scaleRatio;
			newScale = Math.min(Math.max(1, newScale), MAX_SCALE_LIMIT);

			const pImgX = (startCenter.x - startTransform.x) / startTransform.scale;
			const pImgY = (startCenter.y - startTransform.y) / startTransform.scale;

			let newX = cx - pImgX * newScale;
			let newY = cy - pImgY * newScale;

			const bounds = getBounds(newScale, rect);
			newX = clamp(newX, bounds.minX, bounds.maxX);
			newY = clamp(newY, bounds.minY, bounds.maxY);

			setTransform({ x: newX, y: newY, scale: newScale });
			onZoomChange(newScale);
		}
	};

	const handleTouchEnd = () => {
		if (isPinching.current) {
			isPinching.current = false;
			touchStartRef.current = null;
		}
	};

	const handlePointerDown = (e: React.PointerEvent) => {
		if (isConverting || isPinching.current) return;

		const now = Date.now();
		const { time: lastTime, x: lastX, y: lastY } = lastTapRef.current;

		const isDoubleTap =
			now - lastTime < 250 &&
			Math.abs(e.clientX - lastX) < 16 &&
			Math.abs(e.clientY - lastY) < 16;

		if (isDoubleTap) {
			e.preventDefault();
			e.stopPropagation();

			if (containerRef.current) {
				if (transform.scale > 1) {
					resetZoom();
				} else {
					const rect = containerRef.current.getBoundingClientRect();
					const x = e.clientX - rect.left;
					const y = e.clientY - rect.top;

					const targetScale = MAX_SCALE_LIMIT;
					const bounds = getBounds(targetScale, rect);
					const newX = clamp(x - x * targetScale, bounds.minX, bounds.maxX);
					const newY = clamp(y - y * targetScale, bounds.minY, bounds.maxY);

					setTransform({ x: newX, y: newY, scale: targetScale });
					onZoomChange(targetScale);
				}
			}
			lastTapRef.current = { time: 0, x: 0, y: 0 };
			setIsDragging(false);
			return;
		}

		lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

		e.stopPropagation();
		setIsDragging(true);
		dragStart.current = { x: e.clientX, y: e.clientY };
		startTransform.current = { x: transform.x, y: transform.y };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isDragging || !containerRef.current || isPinching.current) return;
		e.preventDefault();
		e.stopPropagation();

		const dx = e.clientX - dragStart.current.x;
		const dy = e.clientY - dragStart.current.y;

		let nextX = startTransform.current.x + dx;
		let nextY = startTransform.current.y + dy;

		const rect = containerRef.current.getBoundingClientRect();
		const bounds = getBounds(transform.scale, rect);

		nextX = clamp(nextX, bounds.minX, bounds.maxX);
		nextY = clamp(nextY, bounds.minY, bounds.maxY);

		setTransform({ ...transform, x: nextX, y: nextY });
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (isDragging) {
			setIsDragging(false);
			(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		}
	};

	return (
		<div
			ref={containerRef}
			className="overflow-hidden relative size-full cursor-grab active:cursor-grabbing touch-none select-none"
			onWheel={handleWheel}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<div
				style={{
					transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
					transformOrigin: "0 0",
					transitionDuration: isDragging || isPinching.current || isSliderDragging ? "0s" : "0.25s",
					transitionTimingFunction: "ease-in-out",
					transitionProperty: "transform, opacity",
					width: "100%",
					height: "100%",
					position: "absolute",
					inset: 0,
					willChange: "transform",
					backfaceVisibility: "hidden",
					WebkitBackfaceVisibility: "hidden",
					opacity: isConverting ? 0.5 : 1,
				}}
			>
				<Image
					src={src}
					alt={alt}
					fill
					draggable={false}
					className="object-contain"
					unoptimized
					onLoadingComplete={(img) => {
						setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
					}}
				/>
			</div>

			{isConverting && (
				<div className="flex absolute inset-0 z-10 justify-center items-center size-full backdrop-blur-xs cursor-progress bg-l1/50 dark:bg-d1/50">
					<Spinner size="lg" color="primary" />
				</div>
			)}
		</div>
	);
};

// ================================================================
//     Sortable Image Components
// ================================================================

interface SortableImageProps {
	id: string;
	item: { id: string; fileName: string; src: string };
	onClick: () => void;
	isConverting: boolean;
}

const SortableImageItem = ({
	id,
	item,
	onClick,
	isConverting,
}: SortableImageProps) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: isDragging
			? "scale 250ms ease, opacity 250ms ease"
			: `${transition}, scale 250ms ease, opacity 250ms ease`,
		zIndex: isDragging ? 50 : "auto",
		scale: isDragging ? 1.1 : 1,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<Tooltip
			content={item.fileName}
			placement="bottom"
			delay={0}
			closeDelay={0}
			radius="full"
			size="md"
			shadow="md"
			color="primary"
			isDisabled={isDragging}
		>
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				className="relative shrink-0 outline-none cursor-grab active:cursor-grabbing touch-none group"
			>
				<Image
					src={item.src}
					alt={item.fileName}
					width={160}
					height={160}
					className="aspect-square object-cover rounded-3xl pointer-events-none"
				/>
				<div
					role="button"
					tabIndex={0}
					className="flex absolute inset-0 justify-center items-center size-full rounded-3xl transition-all duration-250 group-hover:bg-l1/50 group-hover:dark:bg-d1/50"
					onClick={() => onClick()}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							onClick();
						}
					}}
				>
					<ScanSearch
						size={64}
						className="text-d1/50 dark:text-l1/50 opacity-0 group-hover:opacity-100 transition-all duration-250"
					/>
				</div>
				{isConverting && (
					<div className="flex absolute inset-0 z-10 justify-center items-center rounded-3xl cursor-progress bg-l1/50 dark:bg-d1/50">
						<Spinner size="lg" color="primary" />
					</div>
				)}
			</div>
		</Tooltip>
	);
};

// モーダル用のソート可能アイテムコンポーネント
interface SortableModalImageItemProps {
	id: string;
	item: { id: string; fileName: string; src: string };
	isActive: boolean;
	isConverting: boolean;
	onClick: () => void;
	onRemove: () => void;
}

const SortableModalImageItem = ({
	id,
	item,
	isActive,
	isConverting,
	onClick,
	onRemove,
}: SortableModalImageItemProps) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: isDragging
			? "scale 250ms ease, opacity 250ms ease"
			: `${transition}, scale 250ms ease, opacity 250ms ease`,
		zIndex: isDragging ? 50 : "auto",
		scale: isDragging ? 1.1 : 1,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			role="button"
			tabIndex={0}
			className={`relative shrink-0 size-20 rounded-2xl outline-none transition-all duration-250 cursor-grab active:cursor-grabbing touch-none group ${isActive
				? "ring-2 ring-blue scale-105 opacity-100"
				: "opacity-50 hover:opacity-100 hover:scale-105"
				}`}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick();
				}
			}}
		>
			<Image
				src={item.src}
				alt={item.fileName}
				fill
				className="aspect-square object-cover rounded-2xl pointer-events-none"
			/>
			{isConverting && (
				<div className="flex absolute inset-0 z-10 justify-center items-center size-full rounded-2xl cursor-progress bg-l1/50 dark:bg-d1/50">
					<Spinner size="lg" color="primary" />
				</div>
			)}
			<button
				type="button"
				className="flex absolute -top-2 -right-2 z-20 justify-center items-center p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-250 hover:scale-105 cursor-pointer bg-red"
				onPointerDown={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation();
					onRemove();
				}}
			>
				<X size={20} className="text-l1" />
			</button>
		</div>
	);
};

const TurnItem = React.memo(
	({
		turn,
		isLatestTurn,
		chatHistoryHeight,
		selectedKeys,
		onSelectionChange,
		switchState,
	}: TurnItemProps) => {
		const msg = turn.model;

		const parsedSections = React.useMemo(() => {
			if (!msg) return null;

			const state = msg.sectionsState ?? switchState;
			const sectionDefs = [
				{ key: "summary", title: "要約" },
				{ key: "guidance", title: "指針" },
				{ key: "explanation", title: "解説" },
				{ key: "answer", title: "解答" },
			] as const;

			const isNotProblem =
				msg.text.includes('"isProblem": false') ||
				msg.text.includes('"isProblem":false');

			const hasStartedStructure = sectionDefs.some(
				(def) => state[def.key] && msg.text.includes(`"${def.key}"`),
			);

			const showGenericResponse = isNotProblem || !hasStartedStructure;

			const sectionsData = sectionDefs.map((sec) => ({
				...sec,
				isActive: state[sec.key],
				blocks: state[sec.key] ? extractJsonArray(msg.text, sec.key) : [],
			}));

			return {
				isNotProblem,
				showGenericResponse,
				sectionsData,
			};
		}, [msg, switchState]);

		const FormulaBlock = ({ content }: { content: string }) => {
			const scrollRef = useHorizontalScroll<HTMLDivElement>();
			return (
				<div
					ref={scrollRef}
					className="block overflow-x-auto overflow-y-hidden w-full touch-pan-x custom-scrollbar"
				>
					<div className="px-4 py-6 mx-auto w-fit min-w-full text-xl font-medium text-d3 dark:text-l3">
						<BlockMath math={content} />
					</div>
				</div>
			);
		};

		const renderContentBlocks = (blocks: ContentBlock[]) => {
			return blocks.map((block, idx) => {
				const blockKey = `block-${idx}`;
				if (block.type === "formula") {
					const handleCopy = async () => {
						try {
							const formattedFormula = `$$\n${block.content}\n$$`;
							await navigator.clipboard.writeText(formattedFormula);
							addToast({
								variant: "solid",
								radius: "full",
								title: "コピー完了！",
								description: "数式をクリップボードにコピーしました。",
								color: "success",
							});
						} catch (err) {
							console.error("コピーに失敗しました", err);
						}
					};

					return (
						<div
							key={blockKey}
							className="relative p-2 my-2 w-full min-w-0 max-w-full"
						>
							<div className="flex overflow-hidden flex-col w-full rounded-4xl bg-l3 dark:bg-d3">
								<div className="flex flex-row justify-between items-center px-4 py-2 w-full border-b-2 border-l5 dark:border-d5 no-select">
									<span className="mx-2 text-sm font-medium text-d3 dark:text-l3">
										数式
									</span>
									<Button
										isIconOnly
										onPress={handleCopy}
										className="bg-transparent rounded-full"
									>
										<Copy size={16} className="text-d3 dark:text-l3" />
									</Button>
								</div>
								<FormulaBlock content={block.content} />
							</div>
						</div>
					);
				}

				return (
					<div
						key={blockKey}
						className="text-lg font-medium text-d2 dark:text-l2 prose dark:prose-invert"
					>
						<ReactMarkdown
							remarkPlugins={[remarkGfm, remarkMath]}
							rehypePlugins={[rehypeRaw, rehypeKatex]}
						>
							{block.content}
						</ReactMarkdown>
					</div>
				);
			});
		};

		return (
			<motion.div
				style={{
					minHeight:
						isLatestTurn && chatHistoryHeight
							? `${chatHistoryHeight}px`
							: undefined,
				}}
				className="flex flex-col gap-4 items-center py-8 w-full"
			>
				<Card
					shadow="none"
					className="shrink-0 p-2 w-full text-lg font-medium text-d2 dark:text-l2 rounded-4xl bg-l2 dark:bg-d2"
				>
					<CardBody>
						<div>
							<ReactMarkdown
								remarkPlugins={[remarkGfm, remarkMath]}
								rehypePlugins={[rehypeRaw, rehypeKatex]}
							>
								{turn.user.text}
							</ReactMarkdown>
						</div>
					</CardBody>
				</Card>

				{msg && parsedSections && (
					<Accordion
						selectionMode="multiple"
						variant="bordered"
						keepContentMounted={false}
						selectedKeys={selectedKeys}
						onSelectionChange={onSelectionChange}
						className="shrink-0 p-4 w-full rounded-4xl border-none bg-l2 dark:bg-d2"
					>
						{(() => {
							if (parsedSections.showGenericResponse) {
								let displayTitle: React.ReactNode;

								if (parsedSections.isNotProblem) {
									displayTitle = (
										<div className="flex relative flex-row gap-4 items-center">
											<TriangleAlert size={32} className="text-yellow" />
											<span className="text-xl font-bold text-yellow">
												失敗！
											</span>
										</div>
									);
								} else {
									displayTitle = (
										<div className="flex flex-row gap-4 items-center">
											<Spinner variant="spinner" size="md" color="primary" />
											<span className="text-xl font-bold text-blue animate-pulse">
												応答中
											</span>
											<Spinner
												variant="dots"
												size="sm"
												color="primary"
												className="top-2 right-4 animate-pulse"
											/>
										</div>
									);
								}

								return (
									<AccordionItem
										title={displayTitle}
										classNames={{ trigger: "px-2 cursor-pointer" }}
									>
										<div className="p-2 w-full text-lg font-medium text-d3 dark:text-l3 wrap-break-word">
											{parsedSections.isNotProblem ? (
												<div className="flex flex-col gap-4 justify-center items-center p-8 rounded-4xl bg-l3 dark:bg-d3">
													<p className="text-lg font-bold text-d3 dark:text-l3 text-center">
														質問を聴き取ることができませんでした
													</p>
													<p className="text-base font-medium text-d3/75 dark:text-l3/75 text-center">
														よかったら再度、AI に質問を訊いてみてね！
													</p>
												</div>
											) : (
												<div className="flex flex-col gap-4 justify-center items-center p-8 rounded-4xl bg-l3 dark:bg-d3">
													<Spinner
														variant="default"
														size="lg"
														color="primary"
													/>
													<div className="flex flex-row">
														<p className="text-lg font-bold text-blue text-center animate-pulse">
															先生が考えています
														</p>
														<Spinner
															variant="dots"
															size="sm"
															color="primary"
															className="top-2 animate-pulse"
														/>
													</div>
													<p className="text-base font-medium text-d3/75 dark:text-l3/75 text-center">
														返答を準備中ですから、少々お待ちください。
													</p>
												</div>
											)}
										</div>
									</AccordionItem>
								);
							}

							return parsedSections.sectionsData
								.filter((sec) => sec.isActive)
								.map((sec) => {
									let icon = null;
									let titleClassName = "";

									switch (sec.title) {
										case "要約":
											icon = <ScrollText size={32} className="text-blue" />;
											titleClassName = "text-xl font-bold text-blue";
											break;
										case "指針":
											icon = <BowArrow size={32} className="text-orange" />;
											titleClassName = "text-xl font-bold text-orange";
											break;
										case "解説":
											icon = <BookText size={32} className="text-red" />;
											titleClassName = "text-xl font-bold text-red";
											break;
										case "解答":
											icon = <BookCheck size={32} className="text-lime" />;
											titleClassName = "text-xl font-bold text-lime";
											break;
									}

									const isInitialPlaceholder = sec.blocks.length === 0;

									return (
										<AccordionItem
											key={sec.key}
											aria-label={sec.title}
											title={
												<span className={titleClassName}>{sec.title}</span>
											}
											startContent={icon}
											classNames={{ trigger: "px-2 cursor-pointer" }}
										>
											<div className="p-2 w-full text-lg font-medium text-d3 dark:text-l3 wrap-break-word">
												{isInitialPlaceholder ? (
													<div className="animate-pulse"></div>
												) : (
													<div className="flex flex-col gap-4">
														{renderContentBlocks(sec.blocks)}
													</div>
												)}
											</div>
										</AccordionItem>
									);
								});
						})()}
					</Accordion>
				)}
			</motion.div>
		);
	},

	(prev, next) => {
		return (
			prev.turn === next.turn &&
			prev.isLatestTurn === next.isLatestTurn &&
			prev.chatHistoryHeight === next.chatHistoryHeight &&
			prev.selectedKeys === next.selectedKeys &&
			prev.switchState === next.switchState
		);
	},
);

export default function Chat() {
	const { isSent, isLoading, activeContent, setActiveContent } = useChatStore();

	const { images, setImages, problemInputRef, handleImageRemove } =
		useImageUpload();

	const {
		responseMode,
		selectedModeLabel,
		handleResponseModeSelection,
		switchState,
		handleSwitchChange,
		sliders,
		handleSliderChange,
	} = useChatSettings();

	const { turns, lastTurnId, chatHistoryRef, chatHistoryHeight } =
		useChatDisplay();

	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const imageListRef = useHorizontalScroll<HTMLDivElement>();
	const inputImageListRef = useHorizontalScroll<HTMLDivElement>();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 16,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setImages((prev) => {
				const oldIndex = prev.problem.findIndex(
					(item) => item.id === active.id,
				);
				const newIndex = prev.problem.findIndex((item) => item.id === over.id);

				return {
					...prev,
					problem: arrayMove(prev.problem, oldIndex, newIndex),
				};
			});
		}
	};

	const { handleSend: chatLogicHandleSend, handleAbort: chatLogicHandleAbort } =
		useChatLogic();

	const handleSend = async () => {
		if (inputText.trim() !== "" || images.problem.length > 0) {
			setAccordionKeys({});

			setTimeout(() => {
				virtuosoRef.current?.scrollToIndex({
					index: turns.length,
					align: "start",
					behavior: "auto",
				});
			}, 50);

			// --- 追加: 画像をBase64に変換 ---
			let imagesForApi = images.problem;
			if (images.problem.length > 0) {
				try {
					imagesForApi = await Promise.all(
						images.problem.map(async (img) => ({
							...img,
							// APIには blob: ではなく base64文字列 を渡す
							src: await blobUrlToBase64(img.src),
						}))
					);
				} catch (e) {
					console.error("Image conversion failed", e);
					// エラーハンドリング (必要に応じてトースト表示など)
					return;
				}
			}
			// ------------------------------

			await chatLogicHandleSend(
				inputText,
				imagesForApi, // 変換後の画像を渡す
				sliders,
				switchState,
				setInputText,
				setImages,
			);
		}
	};

	const handleAbort = () => {
		chatLogicHandleAbort();
	};

	const wrappedHandleSend = useCallback(
		async (text: string) => {
			setAccordionKeys({});

			setTimeout(() => {
				virtuosoRef.current?.scrollToIndex({
					index: turns.length,
					align: "start",
					behavior: "auto",
				});
			}, 0);

			// --- 追加: 画像をBase64に変換 ---
			let imagesForApi = images.problem;
			if (images.problem.length > 0) {
				try {
					imagesForApi = await Promise.all(
						images.problem.map(async (img) => ({
							...img,
							src: await blobUrlToBase64(img.src),
						}))
					);
				} catch (e) {
					console.error("Image conversion failed", e);
					return;
				}
			}
			// ------------------------------

			await chatLogicHandleSend(
				text,
				imagesForApi, // 変換後の画像を渡す
				sliders,
				switchState,
				() => { },
				setImages,
			);
		},
		[
			chatLogicHandleSend,
			images.problem,
			sliders,
			switchState,
			setImages,
			turns.length,
		],
	);

	const { inputText, setInputText, isListening, toggleListening, isMobile } =
		useChatInput(wrappedHandleSend);

	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewId, setPreviewId] = useState<string | null>(null);
	const [prevImages, setPrevImages] = useState(images.problem);
	const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());

	const [previewZoomLevel, setPreviewZoomLevel] = useState(1);
	const [isSliderDragging, setIsSliderDragging] = useState(false);

	const activePreviewImage = useMemo(() => {
		if (images.problem.length === 0) return null;

		const found = images.problem.find((img) => img.id === previewId);
		if (previewId && found) {
			return found;
		}

		return images.problem[images.problem.length - 1];
	}, [images.problem, previewId]);

	const handleUploadAndConvert = async (
		files: FileList | null,
		tabKey: "problem",
	) => {
		if (!files || files.length === 0) return;

		// 1. 既存の画像表示状態を保持
		if (!isPreviewOpen) {
			setPrevImages(images.problem);
		}

		if (activeContent !== "images") {
			setActiveContent("images");
		}

		const fileArray = Array.from(files);

		// 2. まず「一時的な画像オブジェクト」を作成 (WebP変換はまだしない)
		// URL.createObjectURL は同期処理ですが非常に高速です
		const tempImages = fileArray.map((file) => ({
			id: crypto.randomUUID(),
			file: file,
			fileName: file.name,
			src: URL.createObjectURL(file), // まずは生データのURLを入れる
		}));

		// 3. UIの状態を「即座に」更新する
		// これにより、変換を待たずにモーダルが開き、スピナーが回り始めます
		setConvertingIds((prev) => {
			const next = new Set(prev);
			for (const img of tempImages) {
				next.add(img.id);
			}
			return next;
		});

		// 画像リストに追加
		const imagesForState = tempImages.map(({ file, ...rest }) => rest);
		setImages((prev) => ({
			...prev,
			[tabKey]: [...prev[tabKey], ...imagesForState],
		}));

		// モーダルを開く (ここでUI描画が走るようにする)
		setPreviewId(tempImages[tempImages.length - 1].id);
		setPreviewZoomLevel(1);
		setIsPreviewOpen(true);

		// 4. 重たいWebP変換処理を「非同期」かつ「遅延」させて実行
		// setTimeout(..., 100) を使うことで、ブラウザがモーダルを描画する時間を確保します
		setTimeout(async () => {
			for (const imgObj of tempImages) {
				try {
					// ここで初めて重い処理が走る
					const webpFile = await convertFileToWebP(imgObj.file);
					const newSrc = URL.createObjectURL(webpFile);

					// 変換完了次第、画像を差し替える
					setImages((prev) => {
						const targetList = prev[tabKey];
						const index = targetList.findIndex((item) => item.id === imgObj.id);
						if (index === -1) return prev;

						// 配列をコピーして更新
						const updatedList = [...targetList];
						updatedList[index] = {
							...updatedList[index],
							fileName: webpFile.name, // 拡張子をwebpに変更したファイル名
							src: newSrc,             // 軽量化されたURLに置換
						};
						return { ...prev, [tabKey]: updatedList };
					});
				} catch (e) {
					console.error("WebP変換に失敗しました:", e);
				} finally {
					// 完了フラグを外す（スピナーが消える）
					setConvertingIds((prev) => {
						const next = new Set(prev);
						next.delete(imgObj.id);
						return next;
					});

					// 連続処理でUIが固まらないように、1枚ごとに少しだけ休憩を入れる
					await new Promise(resolve => requestAnimationFrame(resolve));
				}
			}
		}, 100);
	};

	const [isGlobalDragActive, setIsGlobalDragActive] = useState(false);
	const globalDragCounter = useRef(0);

	const handleGlobalDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		const isFile = e.dataTransfer.types.includes("Files");

		if (isFile) {
			globalDragCounter.current++;
			setIsGlobalDragActive(true);
		}
	};

	const handleGlobalDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		globalDragCounter.current--;
		if (globalDragCounter.current === 0) {
			setIsGlobalDragActive(false);
		}
	};

	const handleGlobalDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsGlobalDragActive(false);
		globalDragCounter.current = 0;

		await handleUploadAndConvert(e.dataTransfer.files, "problem");
	};

	const DroppableArea = ({
		tabKey,
		children,
		inputRef,
	}: {
		tabKey: "problem";
		children: React.ReactNode;
		inputRef: React.RefObject<HTMLInputElement | null>;
	}) => {
		const [isDragActive, setIsDragActive] = useState(false);
		const dragCounter = useRef(0);

		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				inputRef.current?.click();
			}
		};

		const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			dragCounter.current++;
			if (dragCounter.current === 1) setIsDragActive(true);
		};

		const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			dragCounter.current--;
			if (dragCounter.current === 0) setIsDragActive(false);
		};

		const handleDropAndReset = async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			dragCounter.current = 0;
			setIsDragActive(false);

			await handleUploadAndConvert(e.dataTransfer.files, tabKey);
		};

		const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
			await handleUploadAndConvert(e.target.files, tabKey);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		};

		return (
			<div
				role="button"
				tabIndex={0}
				onDrop={handleDropAndReset}
				onDragOver={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onKeyDown={handleKeyDown}
				className={`flex flex-col justify-center p-2 size-full rounded-4xl border-2 border-dashed transition-all duration-250 ${isDragActive
					? "border-blue bg-l2 dark:bg-d2"
					: "border-l5 dark:border-d5"
					}`}
			>
				{children}
				<input
					ref={inputRef}
					type="file"
					accept="image/*, image/heif, image/heic"
					multiple
					className="hidden"
					onChange={onInputChange}
				/>
			</div>
		);
	};

	const [hasMounted, setHasMounted] = useState(false);
	const [accordionKeys, setAccordionKeys] = useState<
		Record<string, SharedSelection>
	>({});

	return (
		<div
			onDragEnter={handleGlobalDragEnter}
			onDragLeave={handleGlobalDragLeave}
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleGlobalDrop}
			className="flex relative flex-none justify-center items-center px-4 pb-4 size-full"
		>
			<AnimatePresence>
				{isGlobalDragActive && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="flex absolute inset-0 z-100 justify-center items-center p-4 size-full backdrop-blur-lg pointer-events-none bg-l1/50 no-select dark:bg-d1/50"
					>
						<div className="flex flex-col gap-2 justify-center items-center p-4 size-full rounded-4xl border-2 border-blue border-dashed">
							<ImageUp size={64} className="text-blue animate-bounce" />
							<span className="text-2xl font-bold text-blue text-center">
								此処へファイルをドロップせよ
							</span>
							<span className="text-xl font-medium text-ld text-center">
								対応形式: APNG, AVIF, GIF, JPEG, PNG, SVG, WebP, BMP, ICO, TIFF,
								HEIF, HEIC
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isPreviewOpen && activePreviewImage && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="flex absolute inset-0 z-50 justify-center items-center p-8 backdrop-blur-lg bg-l1/50 no-select dark:bg-d1/50"
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
							className="flex overflow-hidden relative flex-col size-full max-w-5xl rounded-4xl border-1 border-l5 dark:border-d5 bg-l1 dark:bg-d1"
						>
							<div className="flex flex-row shrink-0 justify-between items-center p-2 w-full border-b-1 border-l5 dark:border-d5 bg-l2 dark:bg-d2">
								<div className="flex flex-row gap-2 items-center justify-left">
									<Button
										isIconOnly
										className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
									>
										<Crop size={24} className="text-d2 dark:text-l2" />
									</Button>
									<Button
										isIconOnly
										className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
									>
										<Type size={24} className="text-d2 dark:text-l2" />
									</Button>
									<Button
										isIconOnly
										className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
									>
										<LineSquiggle size={24} className="text-d2 dark:text-l2" />
									</Button>
								</div>
								<div className="flex justify-center items-center">
									<Button
										isIconOnly
										onPress={() => {
											setImages((prev) => ({ ...prev, problem: prevImages }));
											setIsPreviewOpen(false);
											setPreviewZoomLevel(1);
										}}
										className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
									>
										<X size={24} className="text-d2 dark:text-l2" />
									</Button>
								</div>
							</div>

							<div className="flex flex-1 justify-center items-center size-full bg-l1 dark:bg-d1">
								<div className="flex relative justify-center items-center size-full">
									<ZoomableImage
										src={activePreviewImage.src}
										alt={activePreviewImage.fileName}
										isConverting={convertingIds.has(activePreviewImage.id)}
										zoomLevel={previewZoomLevel}
										onZoomChange={setPreviewZoomLevel}
										isSliderDragging={isSliderDragging}
									/>
								</div>
							</div>

							<div className="flex flex-row shrink-0 justify-between items-center p-2 w-full border-l5 border-t-1 dark:border-d5 bg-l2 dark:bg-d2">
								<div className="flex justify-start items-center">
									<Button
										isIconOnly
										className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
									>
										<Info size={24} className="text-d2 dark:text-l2" />
									</Button>
								</div>
								<div className="flex justify-center items-center w-full max-w-xs">
									<Slider
										aria-label="Zoom Level"
										size="sm"
										color="foreground"
										step={0.01}
										minValue={1}
										maxValue={10}
										value={previewZoomLevel}
										onChange={(v) => {
											setIsSliderDragging(true);
											setPreviewZoomLevel(Array.isArray(v) ? v[0] : v);
										}}
										onChangeEnd={() => setIsSliderDragging(false)}
										startContent={
											<Button
												isIconOnly
												className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
												onPress={() => setPreviewZoomLevel((p) => Math.max(1, p - 0.5))}
											>
												<ZoomOut size={24} className="text-d2 dark:text-l2" />
											</Button>
										}
										endContent={
											<Button
												isIconOnly
												className="bg-transparent rounded-full hover:bg-l3 dark:hover:bg-d3"
												onPress={() => setPreviewZoomLevel((p) => Math.min(10, p + 0.5))}
											>
												<ZoomIn size={24} className="text-d2 dark:text-l2" />
											</Button>
										}
										className="max-w-md"
									/>
								</div>
								<div className="flex justify-end items-center"></div>
							</div>

							<div className="flex flex-col shrink-0 w-full border-l5 border-t-1 dark:border-d5 bg-l3 dark:bg-d3">
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									modifiers={[restrictToHorizontalAxis]}
									onDragEnd={handleDragEnd}
								>
									<div
										ref={imageListRef}
										className="flex overflow-x-scroll gap-4 p-4 touch-pan-x"
									>
										<SortableContext
											items={images.problem.map((i) => i.id)}
											strategy={horizontalListSortingStrategy}
										>
											{images.problem.map((img) => {
												const isActive = activePreviewImage.id === img.id;
												const isConverting = convertingIds.has(img.id);
												return (
													<SortableModalImageItem
														key={img.id}
														id={img.id}
														item={img}
														isActive={isActive}
														isConverting={isConverting}
														onClick={() => {
															setPreviewId(img.id);
															setIsPreviewOpen(true);
														}}
														onRemove={() => {
															handleImageRemove("problem", img.id);
															if (isActive) setPreviewId(null);
														}}
													/>
												);
											})}
										</SortableContext>
									</div>
								</DndContext>
								<div className="flex flex-row gap-2 justify-between items-center p-4 w-full">
									<div></div>
									<div className="flex flex-row gap-2 justify-end items-center">
										<Button
											onPress={() => {
												setImages((prev) => ({ ...prev, problem: prevImages }));
												setIsPreviewOpen(false);
											}}
											className="rounded-full bg-l4 hover:bg-l5 dark:bg-d4 dark:hover:bg-d5"
										>
											<span className="text-base font-medium text-d4 dark:text-l4 text-center">
												取消
											</span>
										</Button>
										<Button
											className="flex justify-center items-center rounded-full disabled:cursor-not-allowed disabled:pointer-events-auto bg-blue"
											isDisabled={convertingIds.size > 0}
											onPress={() => {
												setPrevImages(images.problem);
												setIsPreviewOpen(false);
											}}
										>
											{convertingIds.size > 0 ? (
												<Spinner size="sm" color="white" />
											) : (
												<span className="text-base font-medium text-l1 text-center">
													完了
												</span>
											)}
										</Button>
									</div>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div className="flex flex-col justify-center items-center size-full max-w-4xl">
				<motion.div
					initial={{ flex: 0, height: 0, opacity: 0 }}
					animate={{
						flex: isSent ? 1 : 0,
						height: isSent ? "auto" : 0,
						opacity: isSent ? 1 : 0,
					}}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="flex overflow-hidden flex-col size-full"
					ref={chatHistoryRef}
				>
					<Virtuoso
						ref={virtuosoRef}
						data={turns}
						followOutput={false}
						initialTopMostItemIndex={turns.length > 0 ? turns.length - 1 : 0}
						alignToBottom={false}
						increaseViewportBy={{ top: 270, bottom: 1040 }}
						overscan={540}
						className="size-full no-scrollbar"
						itemContent={(_, turn) => {
							const isLatestTurn = turn.user.id === lastTurnId;

							return (
								<div>
									<TurnItem
										key={turn.user.id}
										turn={turn}
										isLatestTurn={isLatestTurn}
										chatHistoryHeight={chatHistoryHeight}
										selectedKeys={
											accordionKeys[turn.user.id] ??
											(new Set([]) as unknown as SharedSelection)
										}
										onSelectionChange={(keys) => {
											setAccordionKeys((prev) => ({
												...prev,
												[turn.user.id]: keys,
											}));
										}}
										switchState={switchState}
									/>
									{!isLatestTurn && (
										<Divider className="shrink-0 w-[calc(100%-1rem)] bg-l4 dark:bg-d4" />
									)}
								</div>
							);
						}}
					/>
				</motion.div>
				<motion.div
					initial={{ flex: 1, height: 1, opacity: 1 }}
					animate={{
						flex: isSent ? 0 : 1,
						height: "auto",
						opacity: 1,
					}}
					transition={{ duration: 0.5, ease: "easeInOut" }}
					className="flex flex-col gap-10 justify-center items-center size-full no-select"
				>
					<AnimatePresence>
						{!isSent && (
							<motion.div
								key="heading"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.5, ease: "easeInOut" }}
								className="flex flex-row gap-4 justify-center items-center w-full"
							>
								<Divider className="flex-1 mr-8 bg-d5 dark:bg-l5" />
								<span className="overflow-hidden text-xl font-medium text-d5 dark:text-l5 text-center text-ellipsis whitespace-nowrap">
									質問
								</span>
								<Divider className="flex-1 ml-8 bg-d5 dark:bg-l5" />
							</motion.div>
						)}
					</AnimatePresence>

					<div className="flex flex-col justify-center px-4 py-2 w-full rounded-4xl border-1 border-l5 dark:border-d5">
						<AnimatePresence>
							<motion.div
								key="chatArea"
								initial={
									hasMounted
										? { opacity: 0, height: 0 }
										: { opacity: 0, height: "auto" }
								}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.5, ease: "easeInOut" }}
								className="flex flex-col justify-center"
								onAnimationComplete={() => setHasMounted(true)}
							>
								<div className="flex flex-row">
									<Textarea
										isRequired
										cacheMeasurements={true}
										minRows={1}
										maxRows={3}
										size="lg"
										variant="underlined"
										validationBehavior="aria"
										placeholder="AI に訊きたい質問はある？"
										className="text-d1 dark:text-l1 no-after-content"
										value={inputText}
										onChange={(e) => setInputText(e.target.value)}
										onKeyDown={(e) => {
											if (!isMobile && e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handleSend();
											}
										}}
									/>
									<Button
										isIconOnly
										radius="full"
										className={`${isListening ? "bg-red text-l2" : "bg-transparent hover:bg-l2 dark:hover:bg-d2 text-d2 dark:text-l2"}`}
										onPress={toggleListening}
									>
										{isListening ? <Mic /> : <MicOff />}
									</Button>
								</div>
								<div className="flex flex-row justify-between pb-2">
									<div className="flex flex-row gap-2">
										<Button
											isIconOnly
											radius="full"
											className={`text-d2 dark:text-l2 ${activeContent === "sliders" ? "bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3" : "bg-transparent hover:bg-l2 dark:hover:bg-d2"}`}
											onPress={() =>
												setActiveContent(
													activeContent === "sliders" ? null : "sliders",
												)
											}
										>
											<Settings2 />
										</Button>
										<Button
											isIconOnly
											radius="full"
											className={`text-d2 dark:text-l2 ${activeContent === "images" ? "bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3" : "bg-transparent hover:bg-l2 dark:hover:bg-d2"}`}
											onPress={() =>
												setActiveContent(
													activeContent === "images" ? null : "images",
												)
											}
										>
											<ImageUp />
										</Button>
									</div>
									<div className="flex flex-row gap-2">
										<Dropdown
											placement="bottom"
											classNames={{
												content: "text-d2 dark:text-l2 bg-l2 dark:bg-d2",
											}}
										>
											<DropdownTrigger>
												<Button
													radius="full"
													className="text-base font-medium text-d2 dark:text-l2 bg-transparent hover:bg-l2 dark:hover:bg-d2"
												>
													{selectedModeLabel} <ChevronDown size={16} />
												</Button>
											</DropdownTrigger>
											<DropdownMenu
												disallowEmptySelection
												selectedKeys={[responseMode]}
												selectionMode="single"
												onSelectionChange={handleResponseModeSelection}
											>
												<DropdownItem
													key="standard"
													description={responseModes.standard.description}
												>
													{responseModes.standard.label}
												</DropdownItem>
												<DropdownItem
													key="learning"
													description={responseModes.learning.description}
												>
													{responseModes.learning.label}
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
										<Button
											isIconOnly
											radius="full"
											className={`${isLoading ? "bg-red text-l2" : inputText.trim() !== "" || images.problem.length > 0 ? "bg-blue text-l2" : "bg-l2 text-d2 dark:bg-d2 dark:text-l2"}`}
											onPress={() => (isLoading ? handleAbort() : handleSend())}
											disabled={
												!isLoading &&
												!(inputText.trim() !== "" || images.problem.length > 0)
											}
										>
											{isLoading ? <Pause /> : <SendHorizontal />}
										</Button>
									</div>
								</div>
								<div className="flex flex-col w-full">
									<motion.div
										initial="closed"
										animate={activeContent === "sliders" ? "open" : "closed"}
										variants={{
											open: { height: "auto", opacity: 1 },
											closed: { height: 0, opacity: 0 },
										}}
										transition={{ duration: 0.5, ease: easeInOut }}
										className="overflow-hidden w-full"
									>
										<ScrollShadow
											hideScrollBar
											visibility="none"
											className="size-full"
										>
											<div className="flex flex-col gap-8 justify-center p-2 size-full">
												<Slider
													className="w-full"
													value={sliders.politeness}
													formatOptions={{ style: "percent" }}
													label="丁寧度"
													marks={[
														{ value: 0.25, label: "難しい" },
														{ value: 0.5, label: "普通" },
														{ value: 0.75, label: "易しい" },
													]}
													maxValue={1}
													minValue={0}
													step={0.25}
													showSteps
													showTooltip
													size="lg"
													onChange={(v) => handleSliderChange("politeness", v)}
												/>
												<Divider className="bg-l5 dark:bg-d5" />
												<div className="flex flex-row flex-wrap gap-4">
													<Switch
														size="lg"
														isSelected={switchState.summary}
														onChange={() => handleSwitchChange("summary")}
													>
														要約
													</Switch>
													<Switch
														size="lg"
														isSelected={switchState.guidance}
														onChange={() => handleSwitchChange("guidance")}
													>
														指針
													</Switch>
													<Switch
														size="lg"
														isSelected={switchState.explanation}
														onChange={() => handleSwitchChange("explanation")}
													>
														解説
													</Switch>
													<Switch
														size="lg"
														isSelected={switchState.answer}
														onChange={() => handleSwitchChange("answer")}
													>
														解答
													</Switch>
												</div>
											</div>
										</ScrollShadow>
									</motion.div>

									<motion.div
										initial="closed"
										animate={activeContent === "images" ? "open" : "closed"}
										variants={{
											open: { height: "auto", opacity: 1 },
											closed: { height: 0, opacity: 0 },
										}}
										transition={{ duration: 0.5, ease: easeInOut }}
										className="overflow-hidden w-full"
									>
										<ScrollShadow
											hideScrollBar
											visibility="none"
											className="size-full"
										>
											<DndContext
												sensors={sensors}
												collisionDetection={closestCenter}
												modifiers={[restrictToHorizontalAxis]}
												onDragEnd={handleDragEnd}
											>
												<div className="w-full h-full min-h-50">
													<DroppableArea
														tabKey="problem"
														inputRef={problemInputRef}
													>
														{images.problem.length === 0 ? (
															<div className="flex flex-col gap-2 justify-center items-center p-8 size-full">
																<Button
																	size="lg"
																	radius="full"
																	className="bg-blue"
																	onPress={() =>
																		problemInputRef.current?.click()
																	}
																>
																	<span className="text-xl font-bold text-l1 text-center">
																		アップロード
																	</span>
																</Button>
																<span className="text-lg font-medium text-ld text-center">
																	ファイルをドラッグ&ドロップせよ
																</span>
															</div>
														) : (
															<div
																ref={inputImageListRef}
																className="flex overflow-x-auto overflow-y-hidden flex-row flex-nowrap gap-2 p-2 touch-pan-x"
															>
																<SortableContext
																	items={images.problem.map((i) => i.id)}
																	strategy={horizontalListSortingStrategy}
																>
																	{images.problem.map((item) => (
																		<SortableImageItem
																			key={item.id}
																			id={item.id}
																			item={item}
																			isConverting={convertingIds.has(item.id)}
																			onClick={() => {
																				setPrevImages(images.problem);
																				setPreviewId(item.id);
																				setIsPreviewOpen(true);
																			}}
																		/>
																	))}
																</SortableContext>
															</div>
														)}
													</DroppableArea>
												</div>
											</DndContext>
										</ScrollShadow>
									</motion.div>
								</div>
							</motion.div>
						</AnimatePresence>
					</div>
				</motion.div>
			</motion.div>
		</div>
	);
}
