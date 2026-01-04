/* src/app/chat/page.tsx */
"use client";
import { DndContext } from "@dnd-kit/core";
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
	BookText,
	BowArrow,
	ChevronDown,
	Copy,
	ImageUp,
	Mic,
	MicOff,
	Pause,
	ScrollText,
	SendHorizontal,
	Settings2,
	TriangleAlert,
	X,
} from "lucide-react";
import { AnimatePresence, easeInOut, motion } from "motion/react";
import Image from "next/image";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

const extractJsonArray = (jsonString: string, key: string): ContentBlock[] => {
	try {
		const parsed = JSON.parse(jsonString);
		return Array.isArray(parsed[key]) ? parsed[key] : [];
	} catch {}

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
		} catch {}
	}
	return results;
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

		// ================================================================
		//     数学ブロック
		// ================================================================

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

		// ================================================================
		//     レンダリングヘルパー
		// ================================================================

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

	const {
		images,
		setImages,
		problemInputRef,
		handleFiles,
		handleDrop,
		handleImageRemove,
	} = useImageUpload();

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

	// ================================================================
	//     送信と中断
	// ================================================================

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

			await chatLogicHandleSend(
				inputText,
				images.problem,
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

	// ================================================================
	//     入力欄
	// ================================================================

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

			await chatLogicHandleSend(
				text,
				images.problem,
				sliders,
				switchState,
				() => {},
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

	// ================================================================
	//     プレビューモーダル管理用ステート
	// ================================================================

	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewId, setPreviewId] = useState<string | null>(null);

	const [prevImages, setPrevImages] = useState(images.problem);

	const activePreviewImage = useMemo(() => {
		if (images.problem.length === 0) return null;

		const found = images.problem.find((img) => img.id === previewId);
		if (previewId && found) {
			return found;
		}

		return images.problem[images.problem.length - 1];
	}, [images.problem, previewId]);

	// ================================================================
	//     画像欄
	// ================================================================

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

	const handleGlobalDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsGlobalDragActive(false);
		globalDragCounter.current = 0;

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			if (!isPreviewOpen) {
				setPrevImages(images.problem);
			}

			handleDrop("problem", e);

			if (activeContent !== "images") {
				setActiveContent("images");
			}

			setIsPreviewOpen(true);
			setPreviewId(null);
		}
	};

	const DroppableArea = ({
		tabKey,
		children,
		inputRef,
	}: {
		tabKey: string;
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

		const handleDropAndReset = (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();

			if (!isPreviewOpen) {
				setPrevImages(images.problem);
			}

			handleDrop(tabKey, e);
			dragCounter.current = 0;
			setIsDragActive(false);

			setIsPreviewOpen(true);
		};

		const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				if (!isPreviewOpen) {
					setPrevImages(images.problem);
				}

				handleFiles(tabKey, e.target.files);

				setIsPreviewOpen(true);
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
				className={`flex flex-col justify-center p-2 size-full rounded-4xl border-2 border-dashed transition-all duration-250 ${
					isDragActive
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

	// ================================================================
	//     フロントエンド
	// ================================================================

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
						<div className="flex flex-col gap-2 justify-center items-center size-full rounded-4xl border-2 border-blue border-dashed">
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

			{/* ============================================================= */}
			{/* 	カスタム画像プレビューモーダル */}
			{/* ============================================================= */}

			<AnimatePresence>
				{isPreviewOpen && activePreviewImage && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="flex absolute inset-0 z-50 justify-center items-center p-8 backdrop-blur-lg bg-l1/50 no-select dark:bg-d1/50"
					>
						{/* モーダルコンテンツ本体 */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
							className="flex overflow-hidden relative flex-col size-full rounded-4xl border-1 border-l5 dark:border-d5 bg-l1 dark:bg-d1"
						>
							{/* ヘッダー */}
							<div className="flex flex-row justify-between items-center w-full h-16 border-b-1 border-l5 dark:border-d5 bg-l2 dark:bg-d2">
								<div className="flex"></div>
								<div className="flex justify-center items-center">
									<span className="text-lg font-medium text-d2 dark:text-l2 text-center">
										{activePreviewImage.fileName}
									</span>
								</div>
								<div className="flex justify-center items-center">
									<Button
										isIconOnly
										onPress={() => {
											setImages((prev) => ({ ...prev, problem: prevImages }));
											setIsPreviewOpen(false);
										}}
										className="size-16 bg-transparent rounded-none hover:bg-l3 dark:hover:bg-d3"
									>
										<X size={24} className="text-d2 dark:text-l2" />
									</Button>
								</div>
							</div>

							{/* メインプレビュー */}
							<div className="flex flex-1 justify-center items-center p-4 bg-l1 dark:bg-d1">
								<div className="flex relative justify-center items-center size-full">
									<Image
										src={activePreviewImage.src}
										alt={activePreviewImage.fileName}
										fill
										className="object-contain"
										unoptimized
									/>
								</div>
							</div>

							{/* 画像リスト */}
							<div className="flex flex-col shrink-0 gap-4 p-4 border-l5 border-t-1 dark:border-d5 bg-l2 dark:bg-d2">
								<div className="flex flex-row gap-2 items-center pl-1">
									<ImageUp size={24} className="text-d2 dark:text-l2" />
									<span className="text-lg font-bold text-d2 dark:text-l2 text-left">
										アップロード済
									</span>
								</div>
								<div
									ref={imageListRef}
									className="flex overflow-x-scroll gap-4 px-2 py-4"
								>
									{images.problem.map((img) => {
										const isActive = activePreviewImage.id === img.id;
										return (
											<div
												role="button"
												tabIndex={0}
												key={img.id}
												className={`relative shrink-0 size-20 rounded-2xl transition-all duration-250 cursor-pointer group ${
													isActive
														? "ring-2 ring-blue scale-105 opacity-100"
														: "opacity-50 hover:opacity-100 hover:scale-105"
												}`}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														setPreviewId(img.id);
													}
												}}
												onClick={() => setPreviewId(img.id)}
											>
												<Image
													src={img.src}
													alt={img.fileName}
													fill
													className="aspect-square object-cover rounded-2xl"
												/>
												<button
													type="button"
													className="absolute -top-2 -right-2 p-1 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 bg-red"
													onClick={(e) => {
														e.stopPropagation();
														handleImageRemove("problem", img.id);
														if (isActive) setPreviewId(null);
													}}
												>
													<X size={12} />
												</button>
											</div>
										);
									})}
								</div>
								<div className="flex justify-end">
									<Button
										className="rounded-4xl bg-blue"
										onPress={() => {
											setIsPreviewOpen(false);
										}}
									>
										<span className="text-base font-medium text-l1 text-center">
											完了
										</span>
									</Button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div className="flex flex-col justify-center items-center size-full max-w-3xl">
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
											<DndContext>
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
																className="flex overflow-x-auto overflow-y-hidden flex-row flex-nowrap gap-2 p-2"
															>
																{images.problem.map((item) => (
																	<Tooltip
																		key={item.id}
																		content={item.fileName}
																		placement="bottom"
																		delay={0}
																		closeDelay={0}
																		radius="full"
																		size="md"
																		shadow="md"
																		color="primary"
																	>
																		<div
																			role="button"
																			tabIndex={0}
																			className="relative shrink-0 outline-none cursor-pointer"
																			onKeyDown={(e) => {
																				if (
																					e.key === "Enter" ||
																					e.key === " "
																				) {
																					setPreviewId(item.id);
																					setIsPreviewOpen(true);
																				}
																			}}
																			onClick={() => {
																				setPreviewId(item.id);
																				setIsPreviewOpen(true);
																			}}
																		>
																			<Image
																				src={item.src}
																				alt={item.fileName}
																				width={160}
																				height={160}
																				className="aspect-square object-cover rounded-3xl"
																			/>
																			<Button
																				isIconOnly
																				size="sm"
																				radius="full"
																				className="absolute top-2 right-2 text-l2 bg-red"
																				onPress={() => {
																					handleImageRemove("problem", item.id);
																				}}
																			>
																				<X />
																			</Button>
																		</div>
																	</Tooltip>
																))}
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
