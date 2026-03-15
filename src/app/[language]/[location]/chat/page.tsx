"use client";
import {
	AudioLines,
	Maximize2,
	Mic,
	Minimize2,
	Paperclip,
	Plus,
	SendHorizontal,
	Square,
	Trash2,
	Zap,
	Sparkles,
	ChevronDown,
	Brain,
	ScrollText,
	BookText,
	BookCheck,
	BowArrow,
} from "lucide-react";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AnimatePresence, motion } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { Virtuoso } from "react-virtuoso";
import { useChatView } from "@/app/[language]/[location]/views/viewChat";
import { VoiceVisualizer } from "@/components/dedicated/voiceVisualizer";
import { Button, Input, Label } from "@/components/ui";
import type { VirtuosoHandle } from "react-virtuoso";
import curriculumData from "@/assets/curriculum/JP/high-school/vol-1.json";

const ICON_MAP: Record<string, React.ElementType> = {
	"要約": ScrollText,
	"指針": BowArrow,
	"解説": BookText,
	"解答": BookCheck,
};

const COLOR_MAP: Record<string, string> = {
	"要約": "text-blue",
	"指針": "text-orange",
	"解説": "text-red",
	"解答": "text-green",
};

const CustomAccordion = ({ title, children, defaultOpen }: { title: string, children: React.ReactNode, defaultOpen: boolean }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const matchKey = Object.keys(ICON_MAP).find(key => title.includes(key));
	const IconComponent = matchKey ? ICON_MAP[matchKey] : null;
	const colorClass = matchKey ? COLOR_MAP[matchKey] : "text-blue";

	const toggleAccordion = (e: React.MouseEvent | React.KeyboardEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen((prev) => !prev);
	};

	return (
		<div className="w-full rounded-3xl mb-4 bg-l2 dark:bg-d2 shadow-lg colors overflow-hidden">
			<Button
				onClick={toggleAccordion}
				className="w-full flex justify-center items-center px-6 py-4 hover:bg-l3 dark:hover:bg-d3 focus-visible:bg-l3 dark:focus-visible:bg-d3 colors"
			>
				<div className="scale-100! w-full flex flex-row justify-between items-center select-none">
					<div className="flex flex-row justify-start items-center gap-4">
						{IconComponent && <IconComponent className={`${colorClass} colors`} />}

						<motion.span
							transition={{ duration: 0.5, ease: "backOut" }}
							className={`text-center text-lg font-bold ${colorClass} colors`}
						>
							{title}
						</motion.span>
					</div>

					<motion.div
						animate={{ rotate: isOpen ? 180 : 0 }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="flex items-center justify-center"
					>
						<ChevronDown className="text-blue colors" />
					</motion.div>
				</div>
			</Button>

			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						key="content"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						className="overflow-hidden select-text"
					>
						<div className="px-8 py-4 prose dark:prose-invert max-w-none font-medium text-base text-d1 dark:text-l1 prose-p:leading-relaxed">
							{children}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

const MediaPreviewItem = ({
	media,
	progress,
}: {
	media: { mimeType: string; src: string; fileName: string };
	progress?: number;
}) => {
	const [duration, setDuration] = useState<string | null>(null);

	const isImage = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(media.mimeType);
	const isVideo = ["video/x-flv", "video/quicktime", "video/mpeg", "video/mpegs", "video/mpg", "video/mp4", "video/webm", "video/wmv", "video/3gpp"].includes(media.mimeType);

	const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
		const seconds = e.currentTarget.duration;
		if (!Number.isNaN(seconds) && seconds !== Infinity) {
			const m = Math.floor(seconds / 60);
			const s = Math.floor(seconds % 60);
			setDuration(`${m}:${s.toString().padStart(2, "0")}`);
		}
	};

	const CircularProgress = () => {
		if (progress === undefined || progress >= 100) return null;
		const radius = 20;
		const circumference = 2 * Math.PI * radius;
		const strokeDashoffset = circumference - (progress / 100) * circumference;

		return (
			<div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-l1/50 dark:bg-d1/50 backdrop-blur-lg colors">
				<svg
					className="h-12 w-12 -rotate-90 transform"
					viewBox="0 0 48 48"
					aria-labelledby="upload-progress-title"
					role="img"
				>
					<title id="upload-progress-title">Uploading progress: {Math.round(progress)}%</title>

					<circle
						cx="24"
						cy="24"
						r={radius}
						stroke="currentColor"
						strokeWidth="4"
						fill="transparent"
						className="text-l5 dark:text-d5 colors"
					/>

					<circle
						cx="24"
						cy="24"
						r={radius}
						stroke="currentColor"
						strokeWidth="4"
						fill="transparent"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						className="text-blue colors"
					/>
				</svg>

				<motion.span
					layout
					transition={{ duration: 0.5, ease: "backOut" }}
					className="absolute text-xs font-medium text-d1 dark:text-l1 colors"
				>
					{Math.round(progress)}%
				</motion.span>
			</div>
		);
	};

	if (isImage) {
		return (
			<div className="relative size-full">
				<CircularProgress />

				<img src={media.src} alt={media.fileName} className="size-full object-cover" />
			</div>
		);
	}

	if (isVideo) {
		return (
			<div className="relative size-full">
				<CircularProgress />
				<video
					src={media.src}
					className="size-full object-cover"
					onLoadedMetadata={handleLoadedMetadata}
					preload="metadata"
				/>

				{duration && (
					<div className="flex justify-center items-center absolute bottom-1 left-1 rounded-full px-2 py-1 bg-l1/50 dark:bg-d1/50 backdrop-blur-lg colors">
						<motion.span
							layout
							transition={{ duration: 0.5, ease: "backOut" }}
							className="text-d1 dark:text-l1 text-left text-sm font-medium colors"
						>
							{duration}
						</motion.span>
					</div>
				)}
			</div>
		);
	}

	const lastDotIndex = media.fileName.lastIndexOf(".");
	const hasExtension = lastDotIndex !== -1 && lastDotIndex !== 0 && lastDotIndex !== media.fileName.length - 1;

	const name = hasExtension ? media.fileName.slice(0, lastDotIndex) : media.fileName;
	const extension = hasExtension ? media.fileName.slice(lastDotIndex + 1).toUpperCase() : "";

	return (
		<div className="relative flex size-full flex-col items-center justify-center p-2">
			<CircularProgress />

			<motion.span
				layout
				transition={{ duration: 0.5, ease: "backOut" }}
				className="colors break-all text-center font-medium text-base text-d1 dark:text-l1 line-clamp-2"
			>
				{name}
			</motion.span>

			{extension && (
				<div className="flex justify-center items-center absolute bottom-1 left-1 rounded-full px-2 py-1 bg-l1/50 dark:bg-d1/50 backdrop-blur-lg colors">
					<motion.span
						layout
						transition={{ duration: 0.5, ease: "backOut" }}
						className="text-d1 dark:text-l1 text-left text-sm font-medium colors"
					>
						{extension}
					</motion.span>
				</div>
			)}
		</div>
	);
};

const MarkdownP = React.memo(({ children }: { children: React.ReactNode }) => (
	<motion.p
		layout
		transition={{ duration: 0.5, ease: "backOut" }}
		className="select-text scale-100! colors px-8 py-4 font-medium text-base text-left text-d1 dark:text-l1"
	>
		{children}
	</motion.p>
));

const MarkdownH3 = React.memo(({ children }: { children: React.ReactNode }) => {
	const rawText = String(children).replace(/["']/g, "").trim();
	let parts = ["Unknown"];

	if (rawText.startsWith("Curriculum:")) {
		const cleanText = rawText.replace("Curriculum:", "").trim();

		const extractedParts = cleanText.split("/").map(p => p.trim());

		if (extractedParts.length === 3) {
			const [subject, course, unit] = extractedParts;

			type CurriculumStructure = Record<string, Record<string, string[]>>;
			const data = curriculumData as CurriculumStructure;

			const isValid = data[subject]?.[course]?.includes(unit);

			if (isValid) {
				parts = extractedParts;
			}
		}
	}
	return (
		<div className="scale-100! flex flex-row gap-2 justify-end items-center w-full px-4 py-2">
			{parts.map((part) => (
				<div key={part} className="bg-l3 dark:bg-d3 group-hover:bg-l4 group-focus-visible:bg-l4 dark:group-focus-visible:bg-d4 dark:group-hover:bg-d4 px-2 py-1 rounded-lg colors shadow-lg">
					<motion.span
						layout
						transition={{ duration: 0.5, ease: "backOut" }}
						className="text-sm font-medium text-d3 dark:text-l3 text-center colors whitespace-nowrap"
					>
						{part}
					</motion.span>
				</div>
			))}
		</div>
	);
});

const MarkdownH1 = React.memo(({ children, problemIndex }: { children: React.ReactNode, problemIndex: number }) => {
	const rawText = String(children);
	let originalNumParts: string[] = [];

	if (rawText.includes("Problem:")) {
		const numStr = rawText.replace("Problem:", "").trim();
		if (numStr) {
			originalNumParts = numStr.split("/").map(p => p.trim());
		}
	}

	return (
		<div className="scale-100! flex flex-row justify-between w-full items-center">
			<div className="bg-blue px-4 py-2 rounded-br-3xl">
				<motion.h1
					layout
					transition={{ duration: 0.5, ease: "backOut" }}
					className="colors text-l1 font-bold text-lg text-left whitespace-nowrap"
				>
					問題 {problemIndex}
				</motion.h1>
			</div>

			{originalNumParts.length > 0 && (
				<div className="px-4 py-2 flex flex-row justify-end items-center gap-2">
					{originalNumParts.map((part, idx) => {
						const uniqueKey = `num-tag-${part}-${idx}`;

						return (
							<div
								key={uniqueKey}
								className="colors bg-blue rounded-lg px-2"
							>
								<motion.span
									layout
									transition={{ duration: 0.5, ease: "backOut" }}
									className="colors text-l1 font-bold text-lg text-right whitespace-nowrap"
								>
									{part}
								</motion.span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
});

const MarkdownSpan = React.memo(({ node, className, children, ...props }: any) => {
	if (className && typeof className === "string" && className.includes("katex-display")) {
		return (
			<div className="scale-100! w-full overflow-x-auto my-6 py-4 px-6 bg-l3 dark:bg-d3 rounded-2xl shadow-inner flex justify-center items-center colors">
				<span className={className} {...props}>
					{children}
				</span>
			</div>
		);
	}

	return <span className={className} {...props}>{children}</span>;
});

interface TurnItemProps {
	turn: any;
	isLatestTurn: boolean;
	chatAreaHeight: number | string;
	handleSolve: (content: string, turnId: string) => void;
}

const TurnItem = React.memo(
	({ turn, isLatestTurn, chatAreaHeight, handleSolve }: TurnItemProps) => {
		const problemItems = React.useMemo(() => {
			return turn.pages
				.filter((page: any) => page.messages.model && page.messages.model.length > 0)
				.map((page: any) => ({
					id: page.messages.model?.[0]?.modelMessageId || `prob-${page.pageIndex}`,
					content: page.messages.model?.[0]?.blocks[0]?.content as string,
					index: page.pageIndex,
				}));
		}, [turn.pages]);

		const firstPage = turn.pages[0];
		const userContent = typeof firstPage?.messages?.user?.blocks[0]?.content === "string"
			? firstPage.messages.user.blocks[0].content
			: "";
		const userMedia = firstPage?.messages?.user?.media || [];
		const hasUserInput = userContent.trim() !== "" || userMedia.length > 0;

		const solveRequestComponents = React.useMemo(() => ({
			h1: ({ children }: any) => <MarkdownH1 problemIndex={problemItems[0]?.index + 1 || 1}>{children}</MarkdownH1>,
			p: ({ children }: any) => <MarkdownP>{children}</MarkdownP>,
			h3: ({ children }: any) => <MarkdownH3>{children}</MarkdownH3>,
			span: MarkdownSpan,
		}), [problemItems]);

		if (turn.title === "solve_request") {
			const modelContent = firstPage?.messages?.model?.[0]?.blocks[0]?.content as string || "";

			// 受け取ったテキストを [SECTION: xxx] ごとに分割する関数
			const parseSections = (content: string) => {
				const sections: { title: string, content: string }[] = [];
				const regex = /\[SECTION:\s*(.+?)\]\n([\s\S]*?)(?=\n\[SECTION:|$)/g;
				let match;
				let hasSections = false;

				while ((match = regex.exec(content)) !== null) {
					hasSections = true;
					sections.push({
						title: match[1].trim(),
						content: match[2].trim()
					});
				}

				// 万が一フォーマット通りに来なかった場合の保険
				if (!hasSections && content.trim()) {
					sections.push({ title: "解答・解説", content: content.trim() });
				}

				return sections;
			};

			const sections = parseSections(modelContent);

			return (
				<div style={{ minHeight: isLatestTurn ? chatAreaHeight : 0 }} className="flex w-full flex-col justify-start">
					{hasUserInput && (
						<motion.div
							initial={isLatestTurn ? { y: 16, opacity: 0, filter: "blur(1rem)" } : false}
							animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
							transition={{ duration: 0.5, ease: "backOut" }}
							className="flex w-full flex-col items-end justify-start mt-8"
						>
							<div className="flex w-full justify-end items-center">
								<div className="colors justify-start items-start flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 shadow-lg h-full overflow-hidden">
									<ReactMarkdown
										remarkPlugins={[remarkMath]}
										rehypePlugins={[rehypeKatex, rehypeRaw]}
										components={solveRequestComponents}
									>
										{userContent}
									</ReactMarkdown>
								</div>
							</div>
						</motion.div>
					)}

					{modelContent && (
						<motion.div
							initial={isLatestTurn ? { y: 16, opacity: 0, filter: "blur(1rem)" } : false}
							animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
							transition={{ duration: 0.5, ease: "backOut" }}
							className="flex w-full justify-center items-center my-8"
						>
							<div className="colors flex w-full flex-col h-full cursor-text select-text">
								{sections.map((sec, idx) => (
									<CustomAccordion key={idx} title={sec.title} defaultOpen={false}>
										<ReactMarkdown
											remarkPlugins={[remarkMath]}
											rehypePlugins={[rehypeKatex, rehypeRaw]}
											components={{
												span: MarkdownSpan,
											}}
										>
											{sec.content}
										</ReactMarkdown>
									</CustomAccordion>
								))}
							</div>
						</motion.div>
					)}
				</div>
			);
		}

		return (
			<div
				style={{ minHeight: isLatestTurn ? chatAreaHeight : 0 }}
				className="flex w-full flex-col justify-start"
			>
				{hasUserInput && (
					<motion.div
						initial={isLatestTurn ? { y: 16, opacity: 0, filter: "blur(1rem)" } : false}
						animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="flex w-full flex-col items-end justify-start mb-8"
					>
						{userMedia.length > 0 && (
							<div className="flex w-full flex-row-reverse justify-start items-center gap-4 overflow-x-auto p-2">
								{userMedia.map((m: any) => (
									<div key={m.mediumId} className="size-32 flex-none rounded-3xl overflow-hidden bg-l2 dark:bg-d2 border border-l5 dark:border-d5 shadow-lg">
										{m.mimeType.startsWith("image/") ? (
											<img src={m.src} alt={m.fileName} className="size-full object-cover" />
										) : m.mimeType.startsWith("video/") ? (
											<video src={m.src} className="size-full object-cover" />
										) : (
											(() => {
												const lastDotIndex = m.fileName.lastIndexOf(".");
												const hasExtension = lastDotIndex !== -1 && lastDotIndex !== 0 && lastDotIndex !== m.fileName.length - 1;

												const name = hasExtension ? m.fileName.slice(0, lastDotIndex) : m.fileName;
												const extension = hasExtension ? m.fileName.slice(lastDotIndex + 1).toUpperCase() : "";

												return (
													<div className="relative flex size-full flex-col items-center justify-center p-2">
														<motion.span
															layout
															transition={{ duration: 0.5, ease: "backOut" }}
															className="colors break-all text-center font-medium text-base text-d1 dark:text-l1 line-clamp-2"
														>
															{name}
														</motion.span>

														{extension && (
															<div className="flex justify-center items-center absolute bottom-1 left-1 rounded-full px-2 py-1 bg-l1/50 dark:bg-d1/50 backdrop-blur-lg colors">
																<motion.span
																	layout
																	transition={{ duration: 0.5, ease: "backOut" }}
																	className="text-d1 dark:text-l1 text-left text-sm font-medium colors"
																>
																	{extension}
																</motion.span>
															</div>
														)}
													</div>
												);
											})()
										)}
									</div>
								))}
							</div>
						)}

						{userContent.trim() !== "" && (
							<div className="flex w-full justify-end items-center p-2">
								<div className="bg-l2 dark:bg-d2 px-4 py-3 rounded-3xl shadow-lg colors">
									<motion.p
										layout
										transition={{ duration: 0.5, ease: "backOut" }}
										className="text-d1 dark:text-l1 font-medium text-base text-right colors select-text"
									>
										{userContent}
									</motion.p>
								</div>
							</div>
						)}
					</motion.div>
				)}

				{problemItems.map((item: any, pIndex: number) => {
					const isNewElement = isLatestTurn && pIndex === problemItems.length - 1;
					const isError = item.content.trim().startsWith("# Error");

					if (isError) {
						return (
							<motion.div
								key={item.id}
								layout
								initial={isNewElement ? { y: 16, opacity: 0, filter: "blur(1rem)" } : false}
								animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="flex w-full justify-center items-center p-2"
							>
								<div className="colors flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 shadow-lg p-6 items-center justify-center border-2 border-red border-dashed">
									<motion.span
										layout
										transition={{ duration: 0.5, ease: "backOut" }}
										className="text-red font-medium text-base text-center"
									>
										問題が見つかりませんでした。再試行してください。
									</motion.span>
								</div>
							</motion.div>
						);
					}

					const rawContent = item.content.trim();
					const displayContent = rawContent;

					const itemComponents = {
						h1: ({ children }: any) => <MarkdownH1 problemIndex={item.index + 1}>{children}</MarkdownH1>,
						p: ({ children }: any) => <MarkdownP>{children}</MarkdownP>,
						h3: ({ children }: any) => <MarkdownH3>{children}</MarkdownH3>,
						span: MarkdownSpan, // ← これを追加
					};

					return (
						<motion.div
							key={item.id}
							initial={isNewElement ? { y: 16, opacity: 0, filter: "blur(1rem)" } : false}
							animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
							transition={{ duration: 0.5, ease: "backOut" }}
							className="flex w-full items-center justify-center p-2"
						>
							<Button
								onClick={() => handleSolve(displayContent, turn.turnId)}
								className="colors justify-start items-start flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3 shadow-lg h-full overflow-hidden group"
							>
								<ReactMarkdown
									remarkPlugins={[remarkMath]}
									rehypePlugins={[rehypeKatex, rehypeRaw]}
									components={itemComponents}
								>
									{displayContent}
								</ReactMarkdown>
							</Button>
						</motion.div>
					);
				})}
			</div>
		);
	},
	(prev, next) => {
		return (
			prev.turn === next.turn &&
			prev.isLatestTurn === next.isLatestTurn &&
			prev.chatAreaHeight === next.chatAreaHeight
		);
	}
);

export default function Chat() {
	const { refs, states, actions } = useChatView();

	const [isThinkModeMenuOpen, setIsThinkModeMenuOpen] = useState(false);

	const virtuosoRef = useRef<VirtuosoHandle>(null);

	useEffect(() => {
		if (states.chatFlow.turns.length > 0) {
			const timer = setTimeout(() => {
				virtuosoRef.current?.scrollToIndex({
					index: states.chatFlow.turns.length - 1,
					align: "end",
					behavior: "smooth",
				});
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [states.chatFlow.turns.length]);

	return (
		<div
			onDragOver={actions.handleDragOver}
			onDragEnter={actions.handleDragEnter}
			onDragLeave={actions.handleDragLeave}
			onDrop={actions.handleDrop}
			className="colors relative inset-0 flex w-full h-[calc(100dvh-3.75rem)] select-none items-center justify-center bg-l1 dark:bg-d1"
		>
			<AnimatePresence>
				{states.dragInfo && (
					<motion.div
						layout
						initial={{ opacity: 0, filter: "blur(1rem)", pointerEvents: "none" }}
						animate={{ opacity: 1, filter: "blur(0)", pointerEvents: "auto" }}
						exit={{ opacity: 0, filter: "blur(1rem)", pointerEvents: "none" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="colors absolute inset-0 z-100 flex size-full cursor-pointer items-center justify-center bg-l1/50 backdrop-blur-lg dark:bg-d1/50 p-4"
					>
						<div className="colors flex size-full animate-pulse flex-col items-center justify-center gap-4 rounded-4xl border-2 border-blue border-dashed p-4">
							<Paperclip
								size={64}
								className="colors animate-bounce text-blue"
							/>

							<motion.span
								layout
								transition={{ duration: 0.5, ease: "backOut" }}
								ref={refs.dragAndDropTextRef}
								className="colors text-center font-black text-2xl text-blue"
							>
								{states.dragInfo.count}ファイルをドロップ
							</motion.span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="colors flex size-full max-w-4xl flex-col items-center justify-center p-4">
				<motion.div
					ref={refs.mainContainerRef}
					layout
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5, ease: "backOut" }}
					className="flex size-full flex-col items-center justify-center"
				>
					<AnimatePresence mode="popLayout">
						{states.chatFlow.turns.length > 0 && !states.isFullTextarea ? (
							<motion.div
								key="chat-flow"
								layout
								initial={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
								animate={{
									height: "100%",
									opacity: 1,
									filter: "blur(0)",
								}}
								exit={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="w-full mask-y-from-95% mask-y-to-transparent"
							>
								<Virtuoso
									ref={virtuosoRef}
									className="size-full"
									followOutput={false}
									data={states.chatFlow.turns}
									itemContent={(index, turn) => {
										const isLatestTurn = index === states.chatFlow.turns.length - 1;

										return (
											<TurnItem
												key={turn.turnId}
												turn={turn}
												isLatestTurn={isLatestTurn}
												chatAreaHeight={states.chatAreaHeight}
												handleSolve={actions.handleSolve}
											/>
										);
									}}
								/>
							</motion.div>
						) : !states.isFullTextarea ? (
							<motion.div
								key="question-title"
								layout
								initial={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
								animate={{
									height: "auto",
									opacity: 1,
									filter: "blur(0)",
								}}
								exit={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="colors flex size-full flex-col items-center justify-center gap-4"
							>
								<div className="colors flex size-full flex-row items-center justify-center gap-8">
									<div className="colors h-px w-full rounded-full bg-blue" />

									<motion.span
										layout
										transition={{ duration: 0.5, ease: "backOut" }}
										className="colors text-center flex-none font-black text-2xl text-blue"
									>
										質問
									</motion.span>

									<div className="colors h-px w-full rounded-full bg-blue" />
								</div>

								<div className="colors flex size-full items-center justify-center pb-8">
									<motion.span
										layout
										transition={{ duration: 0.5, ease: "backOut" }}
										ref={refs.pageTitleTextRef}
										className="colors text-center font-bold text-base text-d5 italic dark:text-l5"
									>
										AIの返答部分が未完成です。今週中には完成予定なのでアンケートの回答はすぐでなくてもいいです。
									</motion.span>
								</div>
							</motion.div>
						) : null}
					</AnimatePresence>

					<motion.div
						ref={refs.inputContainerRef}
						layout
						initial={{ height: 0, opacity: 0 }}
						animate={{
							height: states.containerHeight,
							opacity: 1,
						}}
						exit={{ height: 0, opacity: 1 }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="colors flex shadow-lg size-full flex-col items-center justify-center rounded-4xl border border-l5 dark:border-d5"
					>
						<div className="colors flex size-full flex-col items-center justify-center p-4">
							<div className="colors flex size-full min-h-10 flex-row items-start justify-center gap-1 mb-2">
								<motion.textarea
									style={{ height: states.textareaHeight }}
									transition={{ duration: 0.5, ease: "backOut" }}
									name="prompt"
									rows={1}
									placeholder={
										states.isListening
											? "訊きたい質問を音声入力"
											: "訊きたい質問を入力"
									}
									value={states.displayText}
									ref={refs.textareaRef}
									readOnly={states.isListening}
									onKeyDown={(e) => {
										if (e.nativeEvent.isComposing || e.keyCode === 229) return;

										const isTouchDevice = window.matchMedia("(any-pointer: coarse)").matches;
										if (isTouchDevice) return;

										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											actions.handleSend();
											refs.textareaRef.current?.focus();
										}
									}}
									onPaste={(e) => {
										if (e.clipboardData.files && e.clipboardData.files.length > 0) {
											e.preventDefault();
											actions.handleUploadAndConvert(e.clipboardData.files);
											if (states.activeContent !== "upload") {
												actions.toggleContent("upload");
											}
										}
									}}
									onChange={(e) => {
										actions.setInterimText("");
										actions.setInputText((prev) => ({
											...prev,
											inputText: e.target.value,
										}));
									}}
									className={`colors my-2 ml-2 size-full animate-caret resize-none text-left font-medium text-base text-d1 outline-none placeholder:text-l5 dark:text-l1 dark:placeholder:text-d5 ${states.isListening ? "cursor-not-allowed" : ""}`}
								/>

								<div className="colors flex flex-col items-center justify-center gap-1">
									<AnimatePresence mode="popLayout">
										{states.displayText && (
											<motion.div
												layout
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 0, opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
											>
												<Button
													onClick={actions.handleInputTextClear}
													className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
												>
													<Trash2 className="all text-red" />
												</Button>
											</motion.div>
										)}
									</AnimatePresence>

									<AnimatePresence mode="popLayout">
										{(states.isOverLimit || states.isFullTextarea) && (
											<motion.div
												layout
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 0, opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
											>
												<Button
													onClick={() =>
														actions.setIsFullTextarea(!states.isFullTextarea)
													}
													className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
												>
													{states.isFullTextarea ? (
														<Minimize2 className="all text-blue" />
													) : (
														<Maximize2 className="all text-blue" />
													)}
												</Button>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>

							<div className="colors flex min-h-10 w-full flex-row items-center justify-between">
								<AnimatePresence mode="wait">
									{states.isListening ? (
										<motion.div
											key="voice-bar"
											initial={{ y: 16, opacity: 0 }}
											animate={{ y: 0, opacity: 1 }}
											exit={{ y: 16, opacity: 0 }}
											className="colors flex h-10 w-full flex-row items-center justify-center gap-1"
										>
											<div className="colors h-full flex-1 overflow-hidden">
												<VoiceVisualizer isListening={states.isListening} />
											</div>

											<AnimatePresence mode="popLayout">
												<motion.div
													layout
													initial={{ scale: 0, opacity: 0 }}
													animate={{ scale: 1, opacity: 1 }}
													exit={{ scale: 0, opacity: 0 }}
													transition={{ duration: 0.5, ease: "backOut" }}
												>
													<Button
														onClick={actions.toggleListening}
														className="flex size-10 items-center justify-center rounded-full bg-red colors"
													>
														<Square fill="currentColor" className="all text-l1" />
													</Button>
												</motion.div>
											</AnimatePresence>
										</motion.div>
									) : (
										<motion.div
											key="normal-bar"
											initial={{ y: 16, opacity: 0 }}
											animate={{ y: 0, opacity: 1 }}
											exit={{ y: 16, opacity: 0 }}
											className="colors flex w-full flex-row items-center justify-between"
										>
											<div className="colors flex size-full flex-row items-center justify-start gap-1">
												<AnimatePresence mode="popLayout">
													<motion.div
														layout
														initial={{ scale: 0, opacity: 0 }}
														animate={{ scale: 1, opacity: 1 }}
														exit={{ scale: 0, opacity: 0 }}
														transition={{ duration: 0.5, ease: "backOut" }}
													>
														<Button
															onClick={() => actions.toggleContent("upload")}
															className={`colors flex size-10 items-center justify-center rounded-full
																${states.activeContent === "upload" ?
																	"bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3" : "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																}`}
														>
															<Plus className="text-d1 dark:text-l1 all" />
														</Button>
													</motion.div>
												</AnimatePresence>
											</div>

											<div className="colors flex size-full flex-row items-center justify-end gap-1">
												<AnimatePresence mode="popLayout">
													<motion.div
														layout
														initial={{ scale: 0, opacity: 0 }}
														animate={{ scale: 1, opacity: 1 }}
														exit={{ scale: 0, opacity: 0 }}
														transition={{ duration: 0.5, ease: "backOut" }}
														className="relative"
													>
														<Button
															onClick={() => setIsThinkModeMenuOpen(!isThinkModeMenuOpen)}
															className={`colors flex size-10 items-center justify-center rounded-full
																	${isThinkModeMenuOpen ?
																	"bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3" : "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																}`}
														>
															{states.thinkMode === "fast" && <Zap className="all text-blue" />}
															{states.thinkMode === "standard" && <Sparkles className="all text-blue" />}
															{states.thinkMode === "think" && <Brain className="all text-blue" />}
														</Button>

														<AnimatePresence mode="popLayout">
															{isThinkModeMenuOpen && (
																<motion.div
																	initial={{ opacity: 0, filter: "blur(1rem)", scale: 0.5 }}
																	animate={{ opacity: 1, filter: "blur(0)", scale: 1 }}
																	exit={{ opacity: 0, filter: "blur(1rem)", scale: 0.5 }}
																	transition={{ duration: 0.5, ease: "backOut" }}
																	style={{ originX: 1, originY: 1 }}
																	className="absolute bottom-[calc(100%+1rem)] right-0 z-10 flex flex-col gap-1 rounded-4xl border border-l5 bg-l1/50 p-2 shadow-lg backdrop-blur-lg dark:border-d5 dark:bg-d1/50 colors"
																>
																	{[
																		{ id: "fast", label: "高速", icon: Zap },
																		{ id: "standard", label: "標準", icon: Sparkles },
																		{ id: "think", label: "思考", icon: Brain },
																	].map((mode) => (
																		<Label
																			key={mode.id}
																			className={`colors flex items-center w-full justify-center rounded-full px-4 py-2
																				${states.thinkMode === mode.id
																					? "bg-l5/50 dark:bg-d5/50"
																					: "hover:bg-l2/50 dark:hover:bg-d2/50"
																				}`}
																		>
																			<Input
																				type="radio"
																				name="model"
																				value={mode.id}
																				checked={states.thinkMode === mode.id}
																				visibility={false}
																				onChange={() => {
																					actions.updateThinkMode(mode.id as "fast" | "standard" | "think");
																					setIsThinkModeMenuOpen(false);
																				}}
																			/>

																			<div className="w-full flex flex-row gap-2 justify-start items-center">
																				<mode.icon className={states.thinkMode === mode.id ? "text-blue colors" : "text-l5 dark:text-d5 colors"} />

																				<motion.span
																					className="whitespace-nowrap font-medium text-left text-base text-d1 dark:text-l1 colors"
																				>
																					{mode.label}
																				</motion.span>
																			</div>
																		</Label>
																	))}
																</motion.div>
															)}
														</AnimatePresence>
													</motion.div>
												</AnimatePresence>

												<AnimatePresence mode="popLayout">
													<motion.div
														layout
														initial={{ scale: 0, opacity: 0 }}
														animate={{ scale: 1, opacity: 1 }}
														exit={{ scale: 0, opacity: 0 }}
														transition={{ duration: 0.5, ease: "backOut" }}
													>
														<Button
															onClick={actions.toggleListening}
															className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
														>
															<Mic className="text-d1 dark:text-l1 all" />
														</Button>
													</motion.div>
												</AnimatePresence>

												<AnimatePresence mode="popLayout">
													{(!states.inputText.inputText.trim() && states.inputMedia.length === 0) || states.isUploading ? (
														<motion.div
															key="audio"
															layout
															initial={{ scale: 0, opacity: 0 }}
															animate={{ scale: 1, opacity: 1 }}
															exit={{ scale: 0, opacity: 0 }}
															transition={{ duration: 0.5, ease: "backOut" }}
														>
															<Button
																className="colors flex size-10 items-center justify-center rounded-full bg-d1 hover:bg-d2 focus-visible:bg-d2 dark:bg-l1 dark:focus-visible:bg-l2 dark:hover:bg-l2"
															>
																<AudioLines className="text-l1 dark:text-d1 all" />
															</Button>
														</motion.div>
													) : (
														<motion.div
															key="send"
															layout
															initial={{ scale: 0, opacity: 0 }}
															animate={{ scale: 1, opacity: 1 }}
															exit={{ scale: 0, opacity: 0 }}
															transition={{ duration: 0.5, ease: "backOut" }}
														>
															<Button
																onClick={() => {
																	actions.handleSend();
																}}
																className="flex size-10 items-center justify-center rounded-full bg-blue colors"
															>
																<SendHorizontal className="text-l1 all" />
															</Button>
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							<AnimatePresence>
								{states.activeContent !== "none" && !states.isFullTextarea && (
									<motion.div
										layout
										initial={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
										animate={{
											height: states.isFullTextarea ? 0 : (states.extensionHeight || "auto"),
											opacity: states.isFullTextarea ? 0 : 1,
											filter: states.isFullTextarea ? "blur(1rem)" : "blur(0)"
										}}
										exit={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
										transition={{ duration: 0.5, ease: "backOut" }}
										className="w-full flex flex-none justify-center items-center"
									>
										<div
											ref={refs.extensionRefCallback}
											className="w-full flex flex-col justify-start items-center"
										>
											{states.activeContent === "upload" &&
												<motion.div
													key="upload"
													layout
													initial={{ x: states.contentDirection === 0 ? 0 : states.contentDirection > 0 ? 64 : -64, opacity: 0, filter: "blur(1rem)" }}
													animate={{ x: 0, opacity: 1, filter: "blur(0)" }}
													exit={{ x: states.contentDirection === 0 ? 0 : states.contentDirection > 0 ? -64 : 64, opacity: 0, filter: "blur(1rem)" }}
													transition={{ duration: 0.5, ease: "backOut" }}
													className="mt-2 gap-2 flex  flex-row justify-center items-center w-full h-50 p-4 overflow-x-auto rounded-3xl border-2 border-l5 dark:border-d5 border-dashed colors"
												>
													<Input
														type="file"
														id="file-upload"
														multiple
														onChange={(e) => {
															if (e.target.files) {
																actions.handleUploadAndConvert(e.target.files);
																e.target.value = "";
															}
														}}
													/>

													<AnimatePresence mode="popLayout">
														{states.inputMedia.length > 0 ? (
															<motion.div
																key="input-media"
																layout
																initial={{ opacity: 0, filter: "blur(1rem)" }}
																animate={{ opacity: 1, filter: "blur(0)" }}
																exit={{ opacity: 0, filter: "blur(1rem)" }}
																transition={{ duration: 0.5, ease: "backOut" }}
																className="size-full flex justify-start items-center gap-4"
															>
																<div className="flex items-center justify-start gap-4 h-full">
																	<AnimatePresence mode="popLayout">
																		{states.inputMedia.map((media) => (
																			<motion.div
																				key={media.mediumId}
																				layout
																				initial={{ opacity: 0, filter: "blur(1rem)" }}
																				animate={{ opacity: 1, filter: "blur(0)" }}
																				exit={{ opacity: 0, filter: "blur(1rem)" }}
																				transition={{ duration: 0.5, ease: "backOut" }}
																				className="h-full aspect-square overflow-hidden bg-l2 dark:bg-d2 rounded-2xl colors relative"
																			>
																				<MediaPreviewItem
																					media={media}
																					progress={states.uploadProgress[media.mediumId]}
																				/>

																				<Button
																					onClick={() => actions.handleRemoveMedia(media.mediumId)}
																					className="absolute z-10 top-1 right-1 flex size-10 items-center justify-center rounded-full bg-l1/50 dark:bg-d1/50 backdrop-blur-lg colors"
																				>
																					<Trash2 className="text-red all" />
																				</Button>
																			</motion.div>
																		))}
																	</AnimatePresence>
																</div>

																<motion.div
																	layout
																	initial={{ opacity: 0 }}
																	animate={{ opacity: 1 }}
																	exit={{ opacity: 0 }}
																	transition={{ duration: 0.5, ease: "backOut" }}
																	className="flex flex-col gap-2 justify-center items-center h-full aspect-square p-4"
																>
																	<Button className="flex w-full justify-center items-center bg-blue hover:bg-blue/75 focus-visible:bg-blue/75 rounded-full colors">
																		<Label
																			htmlFor="file-upload"
																			className="all flex justify-center items-center size-full px-4 py-2"
																		>
																			<motion.span
																				layout
																				transition={{ duration: 0.5, ease: "backOut" }}
																				className="colors whitespace-nowrap text-center font-bold text-lg text-l1"
																			>
																				アップロード
																			</motion.span>
																		</Label>
																	</Button>

																	<Button
																		onClick={actions.handleRemoveAllMedia}
																		className="flex justify-center items-center rounded-full colors w-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																	>
																		<div className="all flex justify-center items-center gap-2 size-full px-4 py-2 cursor-pointer">
																			<Trash2 className="text-red all" />

																			<motion.span
																				layout
																				transition={{ duration: 0.5, ease: "backOut" }}
																				className="colors whitespace-nowrap text-center font-bold text-lg text-red"
																			>
																				全削除
																			</motion.span>
																		</div>
																	</Button>
																</motion.div>
															</motion.div>
														) :
															<motion.div
																key="not-input-media"
																layout
																initial={{ opacity: 0, filter: "blur(1rem)" }}
																animate={{ opacity: 1, filter: "blur(0)" }}
																exit={{ opacity: 0, filter: "blur(1rem)" }}
																transition={{ duration: 0.5, ease: "backOut" }}
																className="flex justify-center items-center size-full"
															>
																<Button className="flex justify-center items-center bg-blue hover:bg-blue/75 focus-visible:bg-blue/75 rounded-full colors">
																	<Label
																		htmlFor="file-upload"
																		className="all flex justify-center items-center size-full px-4 py-2"
																	>
																		<motion.span
																			layout
																			transition={{ duration: 0.5, ease: "backOut" }}
																			className="colors whitespace-nowrap text-center font-bold text-lg text-l1"
																		>
																			アップロード
																		</motion.span>
																	</Label>
																</Button>
															</motion.div>
														}
													</AnimatePresence>
												</motion.div>
											}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}