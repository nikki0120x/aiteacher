"use client";
import {
	AlertCircle,
	ArrowLeft,
	AudioLines,
	Ban,
	BookCheck,
	BookText,
	BowArrow,
	CheckCircle2,
	ChevronDown,
	Clock,
	Folder,
	FolderOpen,
	LogIn,
	Maximize2,
	MessageSquare,
	Mic,
	Minimize2,
	MousePointerClick,
	Paperclip,
	Plus,
	ScrollText,
	SendHorizontal,
	Snowflake,
	Sparkle,
	Sparkles,
	Square,
	Trash2,
	X,
	Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ExtraProps } from "react-markdown";
import ReactMarkdown from "react-markdown";
import type { VirtuosoHandle } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import { useAppView } from "@/app/[language]/[location]/views/viewApp";
import { useChatView } from "@/app/[language]/[location]/views/viewChat";
import curriculumData from "@/assets/curriculum/JP/high-school/vol-1.json";
import { VoiceVisualizer } from "@/components/dedicated/voiceVisualizer";
import { Logos } from "@/components/parts/logos";
import { ActivityIndicator, Button, Input, Label } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import type { Medium, Turn } from "@/models/modelChat";
import { type LEVEL_MAP, MODEL_MAP } from "@/models/modelChat";

const ICON_MAP: Record<string, React.ElementType> = {
	要約: ScrollText,
	指針: BowArrow,
	解説: BookText,
	解答: BookCheck,
};

const COLOR_MAP: Record<string, string> = {
	要約: "text-blue",
	指針: "text-orange",
	解説: "text-red",
	解答: "text-green",
};

const SUBJECT_QUESTIONS: Record<string, string> = {
	国語: "芥川龍之介の小説『羅生門』の題材となった、平安時代後期に成立したとされる説話集は何ですか。",
	地理歴史:
		"1914年、オーストリアの皇太子夫妻が暗殺され、第一次世界大戦が勃発するきっかけとなった出来事を何事件と言いますか。",
	公民: "市場経済において、商品の「需要量」と「供給量」が一致したときに決まる価格を何と言いますか。",
	数学: "三角比の相互関係において、$\\sin^2\\theta + \\cos^2\\theta$ の値は常にいくつになりますか。",
	理科: "酸化還元反応において、物質が電子を「受け取る」化学変化のことを何と言いますか。",
	外国語:
		"次の2つの文がほぼ同じ意味になるように、（　）に適切な1語を入れなさい。\nI don't know what I should do.\nI don't know what (　) do.",
	情報: "コンピュータネットワークにおいて、異なる機器同士がデータをやり取りするために定められた「通信のルール（約束事）」を何と言いますか。",
};

const MediaPreviewItem = ({
	media,
	progress,
}: {
	media: { mimeType: string; src: string; fileName: string };
	progress?: number;
}) => {
	const [duration, setDuration] = useState<string | null>(null);

	const isImage = [
		"image/png",
		"image/jpeg",
		"image/webp",
		"image/heic",
		"image/heif",
	].includes(media.mimeType);
	const isVideo = [
		"video/x-flv",
		"video/quicktime",
		"video/mpeg",
		"video/mpegs",
		"video/mpg",
		"video/mp4",
		"video/webm",
		"video/wmv",
		"video/3gpp",
	].includes(media.mimeType);

	const handleLoadedMetadata = (
		e: React.SyntheticEvent<HTMLVideoElement, Event>,
	) => {
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
					<title id="upload-progress-title">
						Uploading progress: {Math.round(progress)}%
					</title>

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

				<span className="absolute text-xs font-medium text-d1 dark:text-l1 colors">
					{Math.round(progress)}%
				</span>
			</div>
		);
	};

	if (isImage) {
		return (
			<div className="relative size-full">
				<CircularProgress />

				<img
					src={media.src}
					alt={media.fileName}
					className="size-full object-cover"
				/>
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
						<span className="text-d1 dark:text-l1 text-left text-sm font-medium colors">
							{duration}
						</span>
					</div>
				)}
			</div>
		);
	}

	const lastDotIndex = media.fileName.lastIndexOf(".");
	const hasExtension =
		lastDotIndex !== -1 &&
		lastDotIndex !== 0 &&
		lastDotIndex !== media.fileName.length - 1;

	const name = hasExtension
		? media.fileName.slice(0, lastDotIndex)
		: media.fileName;
	const extension = hasExtension
		? media.fileName.slice(lastDotIndex + 1).toUpperCase()
		: "";

	return (
		<div className="relative flex size-full flex-col items-center justify-center p-2">
			<CircularProgress />

			<span className="colors break-all text-center font-medium text-base text-d1 dark:text-l1 line-clamp-2">
				{name}
			</span>

			{extension && (
				<div className="flex justify-center items-center absolute bottom-1 left-1 rounded-full px-2 py-1 bg-l1/50 dark:bg-d1/50 backdrop-blur-lg colors">
					<span className="text-d1 dark:text-l1 text-left text-sm font-medium colors">
						{extension}
					</span>
				</div>
			)}
		</div>
	);
};

const CustomAccordion = ({
	title,
	children,
	isOpen,
	onToggle,
	isLoading = false,
}: {
	title: string;
	children: React.ReactNode;
	isOpen: boolean;
	onToggle: () => void;
	isLoading?: boolean;
}) => {
	const matchKey = Object.keys(ICON_MAP).find((key) => title.includes(key));
	const IconComponent = matchKey ? ICON_MAP[matchKey] : null;
	const colorClass = matchKey ? COLOR_MAP[matchKey] : "text-blue";

	const toggleAccordion = (e: React.MouseEvent | React.KeyboardEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onToggle();
	};

	return (
		<div className="w-full colors overflow-hidden">
			<Button
				onClick={toggleAccordion}
				className="w-full flex justify-center items-center px-6 py-4 hover:bg-l3 dark:hover:bg-d3 focus-visible:bg-l3 dark:focus-visible:bg-d3 colors"
			>
				<div className="scale-100! w-full flex flex-row justify-between items-center select-none">
					<div className="flex flex-row justify-start items-center gap-4">
						{isLoading ? (
							<ActivityIndicator className={`${colorClass} colors`} />
						) : IconComponent ? (
							<IconComponent className={`${colorClass} colors`} />
						) : null}

						<span
							className={`text-center text-lg font-bold ${colorClass} colors`}
						>
							{title}
						</span>
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

const MarkdownH1 = React.memo(
	({
		children,
		problemIndex,
	}: {
		children: React.ReactNode;
		problemIndex: number;
	}) => {
		const rawText = String(children);
		let originalNumParts: string[] = [];

		if (rawText.includes("Problem:")) {
			const numStr = rawText.replace("Problem:", "").trim();
			if (numStr) {
				originalNumParts = numStr.split("/").map((p) => p.trim());
			}
		}

		return (
			<div className="scale-100! flex flex-row justify-between w-full items-center">
				<div className="bg-blue px-4 py-2 rounded-br-3xl">
					<h1 className="colors text-l1 font-bold text-lg text-left whitespace-nowrap">
						問題 {problemIndex}
					</h1>
				</div>

				{originalNumParts.length > 0 && (
					<div className="px-4 py-2 flex flex-row justify-end items-center gap-2">
						{originalNumParts.map((part, idx) => {
							const uniqueKey = `num-tag-${part}-${idx}`;

							return (
								<div key={uniqueKey} className="colors bg-blue rounded-lg px-2">
									<span className="colors text-l1 font-bold text-lg text-right whitespace-nowrap">
										{part}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	},
);

const MarkdownP = React.memo(({ children }: { children: React.ReactNode }) => (
	<p className="select-text scale-100! colors px-8 py-4 font-medium text-base text-left text-d1 dark:text-l1">
		{children}
	</p>
));

const MarkdownH3 = React.memo(
	({
		children,
		showLabel = false,
	}: {
		children: React.ReactNode;
		showLabel?: boolean;
	}) => {
		const rawText = String(children).replace(/["']/g, "").trim();
		let parts = ["Unknown"];

		if (rawText.startsWith("Curriculum:")) {
			const cleanText = rawText.replace("Curriculum:", "").trim();
			const extractedParts = cleanText.split("/").map((p) => p.trim());

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
			<div className="scale-100! flex flex-row justify-between items-center w-full px-4 py-2">
				<div className="flex flex-row justify-start items-center gap-1">
					{showLabel && (
						<>
							<MousePointerClick className="colors size-4 text-d5 dark:text-l5" />

							<span className="colors text-left font-medium text-xs text-d5 dark:text-l5">
								選択して生成
							</span>
						</>
					)}
				</div>

				<div className="flex flex-row gap-2 justify-end items-center">
					{parts.map((part) => (
						<div
							key={part}
							className="bg-l3 dark:bg-d3 group-hover:bg-l4 group-focus-visible:bg-l4 dark:group-focus-visible:bg-d4 dark:group-hover:bg-d4 px-2 py-1 rounded-lg colors shadow-lg"
						>
							<span className="text-sm font-medium text-d3 dark:text-l3 text-center colors whitespace-nowrap">
								{part}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	},
);

const MarkdownSpan = React.memo(
	({
		node,
		className,
		children,
		...props
	}: React.HTMLAttributes<HTMLSpanElement> & ExtraProps) => {
		if (
			className &&
			typeof className === "string" &&
			className.includes("katex-display")
		) {
			return (
				<div className="w-full overflow-x-auto bg-l3 dark:bg-d3 rounded-3xl shadow-inner flex justify-center items-center colors">
					<span className={className} {...props}>
						{children}
					</span>
				</div>
			);
		}

		return (
			<span className={className} {...props}>
				{children}
			</span>
		);
	},
);

interface TurnItemProps {
	turn: Turn;
	isLatestTurn: boolean;
	chatAreaHeight: number | string;
	handleSolve: (content: string, turnId: string, pageIndex: number) => void;
}

const TurnItem = React.memo(
	({ turn, isLatestTurn, chatAreaHeight, handleSolve }: TurnItemProps) => {
		const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(
			null,
		);
		const [openSections, setOpenSections] = useState<Record<string, boolean>>(
			{},
		);

		const toggleSection = (pageIndex: number, title: string) => {
			const key = `${pageIndex}-${title}`;
			setOpenSections((prev) => ({
				...prev,
				[key]: !prev[key],
			}));
		};

		const problemItems = React.useMemo(() => {
			return turn.pages
				.filter((page) => page.messages.model && page.messages.model.length > 0)
				.map((page) => ({
					id: `prob-${turn.turnId}-${page.pageIndex}`,
					content: page.messages.model?.[0]?.blocks[0]?.content ?? "",
					index: page.pageIndex,
					answerContent: page.messages.model?.[1]?.blocks[0]?.content ?? "",
				}));
		}, [turn.pages, turn.turnId]);

		const firstPage = turn.pages[0];
		const userContent =
			typeof firstPage?.messages?.user?.blocks[0]?.content === "string"
				? firstPage.messages.user.blocks[0].content
				: "";
		const userMedia = firstPage?.messages?.user?.media || [];
		const hasUserInput = userContent.trim() !== "" || userMedia.length > 0;

		const parseSections = (
			content: string,
		): { title: string; content: string }[] => {
			if (!content) return [];
			const sections: { title: string; content: string }[] = [];
			const regex = /\[SECTION:\s*(.+?)\]\n([\s\S]*?)(?=\n\[SECTION:|$)/g;
			let hasSections = false;

			const matches = Array.from(content.matchAll(regex));
			for (const match of matches) {
				hasSections = true;
				sections.push({
					title: match[1].trim(),
					content: match[2].trim(),
				});
			}

			if (!hasSections && content.trim()) {
				sections.push({ title: "内容", content: content.trim() });
			}

			return sections;
		};

		const getStatusInfo = (status: string) => {
			switch (status) {
				case "thinking":
					return {
						text: "思考中",
						color: "text-indigo animate-pulse",
						isActivity: true,
						Icon: null,
					};
				case "streaming":
					return {
						text: "生成中",
						color: "text-violet animate-pulse",
						isActivity: true,
						Icon: null,
					};
				case "completed":
					return {
						text: "完了",
						color: "text-green",
						isActivity: false,
						Icon: CheckCircle2,
					};
				case "canceled":
					return {
						text: "中断",
						color: "text-orange",
						isActivity: false,
						Icon: Ban,
					};
				case "aborted":
					return {
						text: "切断",
						color: "text-red",
						isActivity: false,
						Icon: AlertCircle,
					};
				case "failed":
					return {
						text: "失敗",
						color: "text-red",
						isActivity: false,
						Icon: AlertCircle,
					};
				default:
					return {
						text: "待機中",
						color: "text-l5 dark:text-d5",
						isActivity: false,
						Icon: Clock,
					};
			}
		};

		return (
			<div
				style={{ minHeight: isLatestTurn ? chatAreaHeight : 0 }}
				className="flex w-full flex-col justify-start"
			>
				{hasUserInput && (
					<motion.div
						initial={
							isLatestTurn ? { y: 16, opacity: 0, filter: "blur(1rem)" } : false
						}
						animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="flex w-full flex-col items-end justify-start"
					>
						{userMedia.length > 0 && (
							<div className="flex w-full flex-row-reverse justify-start items-center gap-4 overflow-x-auto p-2">
								{userMedia.map((m: Medium) => (
									<div
										key={m.mediumId}
										className="size-32 flex-none rounded-3xl overflow-hidden bg-l2 dark:bg-d2 border border-l5 dark:border-d5 shadow-lg"
									>
										{m.mimeType.startsWith("image/") ? (
											<img
												src={m.src}
												alt={m.fileName}
												className="size-full object-cover"
											/>
										) : m.mimeType.startsWith("video/") ? (
											<video src={m.src} className="size-full object-cover" />
										) : (
											<div className="relative flex size-full flex-col items-center justify-center p-2">
												<span className="colors break-all text-center font-medium text-base text-d1 dark:text-l1 line-clamp-2">
													{m.fileName}
												</span>
											</div>
										)}
									</div>
								))}
							</div>
						)}

						{userContent.trim() !== "" && (
							<div className="flex w-full justify-end items-center p-2">
								<div className="bg-l2 dark:bg-d2 px-4 py-3 rounded-3xl shadow-lg colors">
									<ReactMarkdown
										remarkPlugins={[remarkMath]}
										rehypePlugins={[rehypeKatex, rehypeRaw]}
										components={{
											p: ({ children }) => (
												<p className="text-d1 dark:text-l1 font-medium text-base text-left colors select-text wrap-break-word">
													{children}
												</p>
											),
											span: MarkdownSpan,
										}}
									>
										{userContent}
									</ReactMarkdown>
								</div>
							</div>
						)}
					</motion.div>
				)}

				{isLatestTurn &&
					selectedPageIndex === null &&
					(() => {
						const info = getStatusInfo(
							turn.pages[0]?.messages.model[0]?.status || "pending",
						);
						const Icon = info.Icon;

						return (
							<div className="flex flex-row w-full justify-start items-center px-4 gap-2">
								{info.isActivity ? (
									<ActivityIndicator className={`${info.color} colors`} />
								) : (
									Icon && <Icon className={`${info.color} colors`} />
								)}
								<span
									className={`text-left text-base font-bold colors ${info.color}`}
								>
									{info.text}
								</span>
							</div>
						);
					})()}

				{selectedPageIndex !== null && (
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 1, y: -16 }}
						className="flex w-full flex-col items-center justify-start"
					>
						<div className="flex w-full flex-row gap-2 overflow-x-auto py-2 px-2 scrollbar-hide items-center justify-start">
							<Button
								onClick={() => setSelectedPageIndex(null)}
								className="flex-none flex items-center justify-center size-10 bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3 focus-visible:bg-l3 dark:focus-visible:bg-d3 rounded-2xl shadow-lg colors"
							>
								<ArrowLeft className="text-d1 dark:text-l1 all" />
							</Button>

							{problemItems.map((item) => (
								<Button
									key={`tab-${item.id}`}
									onClick={() => {
										setSelectedPageIndex(item.index);
										if (!item.answerContent) {
											handleSolve(item.content, turn.turnId, item.index);
										}
									}}
									className={`flex-none flex items-center justify-center rounded-2xl size-10 shadow-lg colors ${
										selectedPageIndex === item.index
											? "bg-blue text-l1"
											: "bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3 focus-visible:bg-l3 dark:focus-visible:bg-d3 text-d1 dark:text-l1"
									}`}
								>
									<span className="font-bold text-lg text-center whitespace-nowrap all">
										{item.index + 1}
									</span>
								</Button>
							))}
						</div>

						{(() => {
							const selectedItem = problemItems.find(
								(i) => i.index === selectedPageIndex,
							);
							if (!selectedItem) return null;

							const isError = selectedItem.content.trim().startsWith("# Error");
							if (isError) {
								return (
									<div className="colors flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 shadow-lg p-6 items-center justify-center border-2 border-red border-dashed my-4">
										<span className="text-red font-medium text-base text-center">
											問題が見つかりませんでした。再試行してください。
										</span>
									</div>
								);
							}

							return (
								<div className="flex flex-col gap-4 items-start justify-center w-full">
									<div className="flex w-full justify-center items-center px-2">
										<div className="colors flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 shadow-lg items-start justify-center overflow-hidden">
											<ReactMarkdown
												remarkPlugins={[remarkMath]}
												rehypePlugins={[rehypeKatex, rehypeRaw]}
												components={{
													h1: ({ children }) => (
														<MarkdownH1 problemIndex={selectedItem.index + 1}>
															{children}
														</MarkdownH1>
													),
													p: ({ children }) => (
														<MarkdownP>{children}</MarkdownP>
													),
													h3: ({ children }) => (
														<MarkdownH3 showLabel={false}>
															{children}
														</MarkdownH3>
													),
													span: MarkdownSpan,
												}}
											>
												{selectedItem.content}
											</ReactMarkdown>
										</div>
									</div>

									{isLatestTurn &&
										(() => {
											const info = getStatusInfo(
												turn.pages.find(
													(p) => p.pageIndex === selectedPageIndex,
												)?.messages.model[1]?.status || "pending",
											);
											const Icon = info.Icon;

											return (
												<div className="flex flex-row w-full justify-start items-center px-4 gap-2">
													{info.isActivity ? (
														<ActivityIndicator
															className={`${info.color} colors`}
														/>
													) : (
														Icon && <Icon className={`${info.color} colors`} />
													)}
													<span
														className={`text-left text-base font-bold colors ${info.color}`}
													>
														{info.text}
													</span>
												</div>
											);
										})()}

									<div className="flex w-full justify-center items-center px-2">
										<div className="colors flex w-full flex-col select-text bg-l2 dark:bg-d2 rounded-3xl shadow-lg overflow-hidden">
											{(() => {
												const parsedSections = parseSections(
													selectedItem.answerContent || "",
												);
												const REQUIRED_SECTIONS = [
													"要約",
													"指針",
													"解説",
													"解答",
												];

												const combinedSections = REQUIRED_SECTIONS.map(
													(reqTitle) => {
														const found = parsedSections.find(
															(s) => s.title === reqTitle,
														);
														return {
															title: reqTitle,
															content: found ? found.content : "",
															isLoading: !found || found.content.trim() === "",
														};
													},
												);

												parsedSections.forEach((ps) => {
													if (!REQUIRED_SECTIONS.includes(ps.title)) {
														combinedSections.push({
															title: ps.title,
															content: ps.content,
															isLoading: false,
														});
													}
												});

												return combinedSections.map((sec, index, array) => {
													const sectionKey = `${selectedPageIndex}-${sec.title}`;

													return (
														<div key={sectionKey} className="relative">
															<CustomAccordion
																title={sec.title}
																isOpen={!!openSections[sectionKey]}
																onToggle={() =>
																	toggleSection(
																		selectedPageIndex as number,
																		sec.title,
																	)
																}
																isLoading={sec.isLoading}
															>
																<ReactMarkdown
																	remarkPlugins={[remarkMath]}
																	rehypePlugins={[rehypeKatex, rehypeRaw]}
																	components={{
																		span: MarkdownSpan,
																		h3: ({ children }) => (
																			<MarkdownH3 showLabel={false}>
																				{children}
																			</MarkdownH3>
																		),
																	}}
																>
																	{sec.content}
																</ReactMarkdown>
															</CustomAccordion>

															{index !== array.length - 1 && (
																<div className="absolute bottom-0 left-6 right-6 h-px rounded-full bg-l5 dark:bg-d5" />
															)}
														</div>
													);
												});
											})()}
										</div>
									</div>
								</div>
							);
						})()}
					</motion.div>
				)}

				{selectedPageIndex === null &&
					problemItems.map((item) => {
						const isError = item.content.trim().startsWith("# Error");

						if (isError) {
							return (
								<motion.div
									key={item.id}
									layout
									initial={
										isLatestTurn
											? { y: 16, opacity: 0, filter: "blur(1rem)" }
											: false
									}
									animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
									transition={{ duration: 0.5, ease: "backOut" }}
									className="flex w-full justify-center items-center p-2"
								>
									<div className="colors flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 shadow-lg p-6 items-center justify-center border-2 border-red border-dashed">
										<span className="text-red font-medium text-base text-center">
											問題が見つかりませんでした。再試行してください。
										</span>
									</div>
								</motion.div>
							);
						}

						return (
							<motion.div
								key={item.id}
								initial={
									isLatestTurn
										? { y: 16, opacity: 0, filter: "blur(1rem)" }
										: false
								}
								animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="flex w-full items-center justify-center p-2"
							>
								<Button
									onClick={() => {
										setSelectedPageIndex(item.index);
										if (!item.answerContent) {
											handleSolve(item.content, turn.turnId, item.index);
										}
									}}
									className="hover:-translate-y-2 focus-visible:-translate-y-2 active:scale-90 all justify-start items-start flex w-full flex-col rounded-3xl bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3 shadow-lg h-full overflow-hidden group"
								>
									<ReactMarkdown
										remarkPlugins={[remarkMath]}
										rehypePlugins={[rehypeKatex, rehypeRaw]}
										components={{
											h1: ({ children }) => (
												<MarkdownH1 problemIndex={item.index + 1}>
													{children}
												</MarkdownH1>
											),
											p: ({ children }) => <MarkdownP>{children}</MarkdownP>,
											h3: ({ children }) => (
												<MarkdownH3 showLabel={true}>{children}</MarkdownH3>
											),
											span: MarkdownSpan,
										}}
									>
										{item.content}
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
	},
);

export default function Chat() {
	const { refs, states, actions } = useChatView();
	const {
		states: { chat, isHistoryOpen },
		actions: { setHistoryOpen, triggerChatReset, router },
	} = useAppView();

	const { data: session } = useSession();

	// URLパラメータの取得用
	const searchParams = useSearchParams();
	const chatId = searchParams.get("id");

	// 履歴一覧を保持するState
	const [historyList, setHistoryList] = useState<
		{ id: string; title: string; curriculum: string }[]
	>([]);

	// フォルダ開閉状態を管理するステートを追加
	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

	const toggleFolder = (path: string) => {
		setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
	};

	// 履歴一覧の取得 (変更なし)
	useEffect(() => {
		if (session && isHistoryOpen) {
			fetch("/api/chat/history")
				.then((res) => res.json())
				.then((data) => {
					if (Array.isArray(data)) setHistoryList(data);
				})
				.catch(console.error);
		}
	}, [session, isHistoryOpen]);

	// 履歴を「教科/科目/単元」のツリー構造に変換するロジックを追加
	const historyTree = useMemo(() => {
		const root: any = {};
		historyList.forEach((item) => {
			const parts = item.curriculum?.includes("/")
				? item.curriculum.split("/")
				: ["未分類"];

			let current = root;
			parts.forEach((part, index) => {
				if (!current[part]) {
					current[part] = { _items: [] };
				}
				if (index === parts.length - 1) {
					current[part]._items.push(item);
				} else {
					current = current[part];
				}
			});
		});
		return root;
	}, [historyList]);

	// ツリー構造を再帰的にレンダリングする関数を追加
	const renderTree = (node: any, path: string = "", level: number = 0) => {
		const keys = Object.keys(node).filter((k) => k !== "_items");
		const items = node._items || [];

		return (
			<div
				className="flex flex-col gap-1 w-full"
				style={{ paddingLeft: level === 0 ? 0 : "1rem" }}
			>
				{keys.map((key) => {
					const currentPath = path ? `${path}/${key}` : key;
					const isOpen = openFolders[currentPath];
					return (
						<div key={currentPath} className="flex flex-col gap-1 w-full">
							<Button
								onClick={() => toggleFolder(currentPath)}
								className="flex w-full items-center justify-start gap-3 rounded-xl p-2 text-left hover:bg-l2 dark:hover:bg-d2 truncate colors"
							>
								{isOpen ? (
									<FolderOpen size={16} className="text-blue flex-none" />
								) : (
									<Folder size={16} className="text-blue flex-none" />
								)}
								<span className="truncate text-sm font-bold text-d1 dark:text-l1">
									{key}
								</span>
							</Button>
							<AnimatePresence>
								{isOpen && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className="overflow-hidden flex flex-col gap-1"
									>
										{renderTree(node[key], currentPath, level + 1)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					);
				})}
				{items.map((item: any) => (
					<Button
						key={item.id}
						onClick={() => {
							router.push(`/chat?id=${item.id}`);
							setHistoryOpen();
						}}
						className={`flex w-full items-center justify-start gap-3 rounded-xl p-2 text-left hover:bg-l2 dark:hover:bg-d2 truncate colors ${
							chatId === item.id ? "bg-l2 dark:bg-d2 border border-blue/30" : ""
						}`}
					>
						<MessageSquare size={14} className="text-blue/70 flex-none ml-2" />
						<span className="truncate text-sm font-medium text-d1 dark:text-l1">
							{item.title}
						</span>
					</Button>
				))}
			</div>
		);
	};

	const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);

	const handleModelChange = (model: keyof typeof MODEL_MAP) => {
		actions.setSelectedModel(model);
		if (
			model === "gemini-3.1-flash-lite-preview" &&
			states.selectedLevel === "minimal"
		) {
			actions.setSelectedLevel("minimal");
		}
		setIsModelSelectOpen(false);
	};

	const handleLevelChange = (level: keyof typeof LEVEL_MAP) => {
		if (
			states.selectedModel === "gemini-3.1-flash-lite-preview" &&
			level === "minimal"
		) {
			return;
		}
		actions.setSelectedLevel(level);
	};

	const params = useParams();
	const lang = (params?.language as string) || "en-US";
	const logoId = `Question_${lang}` as keyof typeof Logos;
	const TitleComponent = Logos[logoId] || Logos["Question_en-US"];

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
			}, 0);

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
				{isHistoryOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5, ease: "backOut" }}
							onClick={setHistoryOpen}
							className="absolute inset-0 z-100 bg-l1/50 backdrop-blur-sm lg:bg-transparent dark:bg-d1/50"
						/>

						<motion.aside
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ duration: 0.5, ease: "backOut" }}
							className="absolute left-0 top-0 z-100 flex h-full w-80 flex-col border-r border-l5 bg-l1 shadow-2xl dark:border-d5 dark:bg-d1"
						>
							<div className="flex items-center justify-between p-4 border-b border-l5 dark:border-d5">
								<span className="font-bold text-lg text-blue">会話履歴</span>
								<Button
									onClick={setHistoryOpen}
									className="size-8 rounded-full hover:bg-l2 dark:hover:bg-d2 flex items-center justify-center colors"
								>
									<X size={18} className="text-d1 dark:text-l1" />
								</Button>
							</div>

							<div className="flex flex-col gap-4 p-4 size-full overflow-hidden">
								<Button
									onClick={() => {
										router.push("/chat");
										triggerChatReset();
										setHistoryOpen();
									}}
									className="flex w-full items-center justify-start gap-2 rounded-2xl bg-blue p-4 text-l1 shadow-lg hover:opacity-90 colors"
								>
									<Plus size={20} />
									<span className="font-bold">新しいチャット</span>
								</Button>

								<div className="flex-1 overflow-y-auto scrollbar-hide">
									{!session ? (
										<div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
											<div className="p-4 rounded-full bg-l2 dark:bg-d2">
												<MessageSquare
													className="text-d5 dark:text-l5"
													size={32}
												/>
											</div>
											<p className="text-sm font-medium text-d1 dark:text-l1 px-4">
												ログインすると過去の回答を保存し、いつでも確認できるようになります。
											</p>
											<Link href="/sign?mode=signin" className="w-full px-4">
												<Button className="w-full gap-2 bg-blue text-l1 h-12 rounded-full">
													<LogIn size={18} />
													<span className="font-bold">ログインして同期</span>
												</Button>
											</Link>
										</div>
									) : (
										<div className="flex flex-col gap-2">
											{historyList.length > 0 ? (
												<>
													{/* ▼ フォルダ（ツリー）表示部分 ▼ */}
													<div className="flex flex-col gap-1 mb-2">
														<span className="text-xs font-bold text-d5 dark:text-l5 px-2 pb-1 block">
															カテゴリ別
														</span>
														{renderTree(historyTree)}
													</div>

													{/* 区切り線 */}
													<div className="w-full h-px bg-l5 dark:bg-d5 my-2" />

													{/* ▼ すべての履歴（フラットリスト）表示部分 ▼ */}
													<div className="flex flex-col gap-1">
														<span className="text-xs font-bold text-d5 dark:text-l5 px-2 pb-1 block">
															すべての履歴
														</span>
														{historyList.map((item) => (
															<Button
																key={`flat-${item.id}`} // ツリー側とkeyが重複しないようにプレフィックスを追加
																onClick={() => {
																	router.push(`/chat?id=${item.id}`);
																	setHistoryOpen();
																}}
																className={`flex w-full items-center justify-start gap-3 rounded-xl p-3 text-left hover:bg-l2 dark:hover:bg-d2 truncate colors ${
																	chatId === item.id
																		? "bg-l2 dark:bg-d2 border border-blue/30"
																		: ""
																}`}
															>
																<MessageSquare
																	size={16}
																	className="text-blue flex-none"
																/>
																<span className="truncate text-sm font-medium text-d1 dark:text-l1">
																	{item.title}
																</span>
															</Button>
														))}
													</div>
												</>
											) : (
												<p className="text-center text-xs text-d5 dark:text-l5 py-10">
													保存された会話がありません
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{states.dragInfo && (
					<motion.div
						initial={{
							opacity: 0,
							filter: "blur(1rem)",
							pointerEvents: "none",
						}}
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

							<span
								ref={refs.dragAndDropTextRef}
								className="colors text-center font-black text-2xl text-blue"
							>
								{chat("container.draganddrop", {
									count: states.dragInfo.count,
								})}
							</span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isModelSelectOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setIsModelSelectOpen(false)}
						className="fixed inset-0 z-20 size-full cursor-pointer"
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isThinkModeMenuOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => {
							setIsThinkModeMenuOpen(false);
							setIsModelSelectOpen(false);
						}}
						className="fixed inset-0 z-10 size-full cursor-pointer"
					/>
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
					className="flex size-full flex-col items-center justify-center gap-4"
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
								className="w-full mask-y-from-99% mask-y-to-transparent"
							>
								<Virtuoso
									ref={virtuosoRef}
									className="size-full scrollbar-hide"
									followOutput={false}
									data={states.chatFlow.turns}
									itemContent={(index, turn) => {
										const isLatestTurn =
											index === states.chatFlow.turns.length - 1;

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
								key="question-flow"
								layout
								initial={{ height: 0, opacity: 0 }}
								animate={{
									height: "auto",
									opacity: 1,
								}}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="colors flex size-full flex-col items-center justify-center gap-2"
							>
								<div className="colors flex w-full flex-row items-center justify-center gap-8">
									<div className="colors h-px w-full rounded-full bg-blue" />

									<TitleComponent className="flex-none" />

									<div className="colors h-px w-full rounded-full bg-blue" />
								</div>

								<div className="colors flex w-full gap-2 flex-col items-center justify-center">
									<span
										ref={refs.pageTitleTextRef}
										className="colors font-subtitle text-center font-medium text-base text-d5 italic dark:text-l5"
									>
										{chat("question.message")}
									</span>

									<div className="w-full mask-x-from-99% to-transparent">
										<div className="flex w-full px-2 py-4 overflow-x-auto gap-2 scrollbar-hide">
											{Object.entries(SUBJECT_QUESTIONS).map(
												([subject, question]) => (
													<Button
														key={subject}
														onClick={() => {
															actions.setInterimText("");
															actions.setInputText((prev) => ({
																...prev,
																inputText: question,
															}));
														}}
														className="flex justify-center items-center flex-none bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3 hover:-translate-y-2 focus-visible:-translate-y-2 active:scale-90 focus-visible:bg-l3 dark:focus-visible:bg-d3 rounded-2xl px-8 py-4 shadow-lg all"
													>
														<div className="scale-100! flex flex-col gap-2 justify-center items-start">
															<span className="colors text-left font-medium text-sm text-d2 dark:text-l2">
																{subject}
															</span>

															<div className="flex flex-row justify-start items-center gap-1">
																<MousePointerClick className="colors size-4 text-d5 dark:text-l5" />
																<span className="colors text-left font-medium text-xs text-d5 dark:text-l5">
																	選択して生成
																</span>
															</div>
														</div>
													</Button>
												),
											)}
										</div>
									</div>
								</div>
							</motion.div>
						) : null}
					</AnimatePresence>

					<motion.div
						ref={refs.inputContainerRef}
						layout
						initial={{ opacity: 0 }}
						animate={{
							height: states.containerHeight,
							opacity: 1,
						}}
						exit={{ opacity: 1 }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="colors flex shadow-lg w-full flex-col items-center justify-center rounded-4xl border border-l5 dark:border-d5"
					>
						<div className="colors flex size-full flex-col items-center justify-center p-4">
							<div className="colors flex size-full min-h-10 flex-row items-start justify-center gap-1 mb-2">
								<motion.textarea
									name="prompt"
									rows={1}
									placeholder={
										states.isListening
											? chat("container.listening-placeholder")
											: chat("container.placeholder")
									}
									value={states.displayText}
									ref={refs.textareaRef}
									readOnly={states.isListening}
									onKeyDown={(e) => {
										if (e.nativeEvent.isComposing || e.keyCode === 229) return;

										const isTouchDevice = window.matchMedia(
											"(any-pointer: coarse)",
										).matches;
										if (isTouchDevice) return;

										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											actions.handleSend();
											refs.textareaRef.current?.focus();
										}
									}}
									onPaste={(e) => {
										if (
											e.clipboardData.files &&
											e.clipboardData.files.length > 0
										) {
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
									style={{ height: states.textareaHeight }}
									transition={{ duration: 0.5, ease: "backOut" }}
									className={`colors my-2 ml-2 w-full animate-caret resize-none text-left font-medium text-base text-d1 outline-none placeholder:text-l5 placeholder:colors dark:text-l1 dark:placeholder:text-d5 ${states.isListening ? "cursor-not-allowed" : ""}`}
								/>

								<div className="colors flex flex-col items-center justify-center gap-1">
									<AnimatePresence mode="popLayout">
										{states.displayText && (
											<motion.div
												layout
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
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
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
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
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													transition={{ duration: 0.5, ease: "backOut" }}
												>
													<Button
														onClick={actions.toggleListening}
														className="flex size-10 items-center justify-center rounded-full bg-red colors"
													>
														<Square
															fill="currentColor"
															className="all text-l1"
														/>
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
											<div className="colors flex w-full flex-row items-center justify-start gap-1">
												<AnimatePresence mode="popLayout">
													<motion.div
														layout
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														exit={{ opacity: 0 }}
														transition={{ duration: 0.5, ease: "backOut" }}
													>
														<Button
															onClick={() => actions.toggleContent("upload")}
															className={`colors flex size-10 items-center justify-center rounded-full
																${
																	states.activeContent === "upload"
																		? "bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3"
																		: "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																}`}
														>
															<Plus className="text-d1 dark:text-l1 all" />
														</Button>
													</motion.div>
												</AnimatePresence>
											</div>

											<div className="colors flex w-full flex-row items-center justify-end gap-1">
												<div className="relative">
													<Button
														onClick={() =>
															setIsThinkModeMenuOpen(!isThinkModeMenuOpen)
														}
														className={`colors flex size-10 items-center justify-center rounded-full
																		${
																			isThinkModeMenuOpen
																				? "bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3"
																				: "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																		}`}
													>
														{states.selectedLevel === "minimal" && (
															<Zap className="all text-blue" />
														)}
														{states.selectedLevel === "low" && (
															<Sparkle className="all text-blue" />
														)}
														{states.selectedLevel === "medium" && (
															<Sparkles className="all text-blue" />
														)}
														{states.selectedLevel === "high" && (
															<Snowflake className="all text-blue" />
														)}
													</Button>

													<AnimatePresence mode="popLayout">
														{isThinkModeMenuOpen && (
															<motion.div
																initial={{
																	opacity: 0,
																	filter: "blur(1rem)",
																	scale: 0.5,
																}}
																animate={{
																	opacity: 1,
																	filter: "blur(0)",
																	scale: 1,
																}}
																exit={{
																	opacity: 0,
																	filter: "blur(1rem)",
																	scale: 0.5,
																}}
																transition={{ duration: 0.5, ease: "backOut" }}
																style={{ originX: 1, originY: 1 }}
																className="absolute bottom-[calc(100%+1rem)] right-0 z-30 flex min-w-64 flex-col gap-2 rounded-4xl border border-l5 bg-l1 p-3 shadow-lg dark:border-d5 dark:bg-d1 colors"
															>
																<div className="relative w-full flex justify-center items-center">
																	<Button
																		onClick={() =>
																			setIsModelSelectOpen(!isModelSelectOpen)
																		}
																		className="relative z-20 flex w-full h-10 items-center justify-between rounded-2xl px-4 py-2 bg-blue colors"
																	>
																		<span className="whitespace-nowrap text-base font-medium text-center text-l1 all">
																			{states.selectedModel ===
																				"gemini-3.1-flash-lite-preview" &&
																				"Gemini 3.1 Flash-Lite"}
																		</span>

																		<motion.div
																			animate={{
																				rotate: isModelSelectOpen ? 180 : 0,
																			}}
																			transition={{
																				duration: 0.5,
																				ease: "backOut",
																			}}
																		>
																			<ChevronDown className="text-l1 colors" />
																		</motion.div>
																	</Button>

																	<AnimatePresence>
																		{isModelSelectOpen && (
																			<motion.div
																				initial={{ opacity: 0, y: -16 }}
																				animate={{ opacity: 1, y: 0 }}
																				exit={{ opacity: 0, y: -16 }}
																				transition={{
																					duration: 0.5,
																					ease: "backOut",
																				}}
																				className="absolute left-0 top-[calc(100%+0.5rem)] z-40 flex w-full flex-col gap-1 rounded-2xl border border-l5 bg-l2 p-1 shadow-lg dark:border-d5 dark:bg-d2 colors"
																			>
																				{(
																					Object.keys(
																						MODEL_MAP,
																					) as (keyof typeof MODEL_MAP)[]
																				).map((m) => (
																					<Button
																						key={m}
																						onClick={() => handleModelChange(m)}
																						className={`flex w-full items-center justify-start rounded-xl px-4 py-2 colors ${
																							states.selectedModel === m
																								? "bg-blue"
																								: "hover:bg-l3 dark:hover:bg-d3 focus-visible:bg-l3 dark:focus-visible:bg-d3"
																						}`}
																					>
																						<span
																							className={`whitespace-nowrap text-base font-medium text-left all ${states.selectedModel === m ? "text-l1" : "text-d1 dark:text-l1"}`}
																						>
																							{m ===
																								"gemini-3.1-flash-lite-preview" &&
																								"Gemini 3.1 Flash-Lite"}
																						</span>
																					</Button>
																				))}
																			</motion.div>
																		)}
																	</AnimatePresence>
																</div>

																<div className="flex w-full flex-col gap-1">
																	{[
																		{
																			id: "minimal",
																			label: "Minimal",
																			icon: Zap,
																		},
																		{ id: "low", label: "Low", icon: Sparkle },
																		{
																			id: "medium",
																			label: "Medium",
																			icon: Sparkles,
																		},
																		{
																			id: "high",
																			label: "High",
																			icon: Snowflake,
																		},
																	].map((lvl) => {
																		const isDisabled =
																			states.selectedModel ===
																				"gemini-3.1-flash-lite-preview" &&
																			lvl.id === "high";
																		const isSelected =
																			states.selectedLevel === lvl.id &&
																			!isDisabled;

																		return (
																			<Label
																				key={lvl.id}
																				className={`colors flex w-full items-center justify-center rounded-2xl px-4 py-2
																					${
																						isDisabled
																							? "cursor-not-allowed"
																							: isSelected
																								? "bg-l2 dark:bg-d2"
																								: "hover:bg-l2 dark:hover:bg-d2 focus-visible:bg-l2 dark:focus-visible:bg-d2"
																					}`}
																			>
																				<Input
																					type="radio"
																					name="level"
																					value={lvl.id}
																					checked={
																						states.selectedLevel === lvl.id
																					}
																					disabled={isDisabled}
																					visibility={false}
																					onChange={() => {
																						if (!isDisabled) {
																							handleLevelChange(
																								lvl.id as keyof typeof LEVEL_MAP,
																							);
																						}
																					}}
																				/>

																				<div className="flex w-full flex-row items-center justify-start gap-2">
																					<lvl.icon
																						className={`colors
																							${
																								isSelected
																									? "text-blue"
																									: isDisabled
																										? "text-l5 dark:text-d5"
																										: "text-d1 dark:text-l1"
																							}`}
																					/>

																					<span
																						className={`whitespace-nowrap font-medium text-left text-base colors
																						${
																							isSelected
																								? "text-blue"
																								: isDisabled
																									? "text-l5 dark:text-d5"
																									: "text-d1 dark:text-l1"
																						}`}
																					>
																						{lvl.label}
																					</span>
																				</div>
																			</Label>
																		);
																	})}
																</div>
															</motion.div>
														)}
													</AnimatePresence>
												</div>

												<AnimatePresence mode="popLayout">
													<motion.div
														layout
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														exit={{ opacity: 0 }}
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
													{states.isGenerating ? (
														<motion.div
															key="cancel"
															layout
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															exit={{ opacity: 0 }}
															transition={{ duration: 0.5, ease: "backOut" }}
														>
															<Button
																onClick={actions.handleCancel}
																className="flex size-10 items-center justify-center rounded-full bg-red colors hover:bg-red/80"
															>
																<Square
																	fill="currentColor"
																	className="text-l1 all"
																/>
															</Button>
														</motion.div>
													) : (!states.inputText.inputText.trim() &&
															states.inputMedia.length === 0) ||
														states.isUploading ? (
														<motion.div
															key="audio"
															layout
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															exit={{ opacity: 0 }}
															transition={{ duration: 0.5, ease: "backOut" }}
														>
															<Button className="colors flex size-10 items-center justify-center rounded-full bg-d1 hover:bg-d2 focus-visible:bg-d2 dark:bg-l1 dark:focus-visible:bg-l2 dark:hover:bg-l2">
																<AudioLines className="text-l1 dark:text-d1 all" />
															</Button>
														</motion.div>
													) : (
														<motion.div
															key="send"
															layout
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															exit={{ opacity: 0 }}
															transition={{ duration: 0.5, ease: "backOut" }}
														>
															<Button
																onClick={() => {
																	actions.handleSend();
																}}
																className="flex size-10 items-center justify-center rounded-full bg-blue colors hover:bg-blue/80"
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
											height: states.isFullTextarea
												? 0
												: states.extensionHeight || "auto",
											opacity: states.isFullTextarea ? 0 : 1,
											filter: states.isFullTextarea ? "blur(1rem)" : "blur(0)",
										}}
										exit={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
										transition={{ duration: 0.5, ease: "backOut" }}
										className="w-full flex flex-none justify-center items-center"
									>
										<div
											ref={refs.extensionRefCallback}
											className="w-full flex flex-col justify-start items-center"
										>
											{states.activeContent === "upload" && (
												<motion.div
													key="upload"
													layout
													initial={{
														x:
															states.contentDirection === 0
																? 0
																: states.contentDirection > 0
																	? 64
																	: -64,
														opacity: 0,
														filter: "blur(1rem)",
													}}
													animate={{ x: 0, opacity: 1, filter: "blur(0)" }}
													exit={{
														x:
															states.contentDirection === 0
																? 0
																: states.contentDirection > 0
																	? -64
																	: 64,
														opacity: 0,
														filter: "blur(1rem)",
													}}
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
																				initial={{
																					opacity: 0,
																					filter: "blur(1rem)",
																				}}
																				animate={{
																					opacity: 1,
																					filter: "blur(0)",
																				}}
																				exit={{
																					opacity: 0,
																					filter: "blur(1rem)",
																				}}
																				transition={{
																					duration: 0.5,
																					ease: "backOut",
																				}}
																				className="h-full aspect-square overflow-hidden bg-l2 dark:bg-d2 rounded-2xl colors relative"
																			>
																				<MediaPreviewItem
																					media={media}
																					progress={
																						states.uploadProgress[
																							media.mediumId
																						]
																					}
																				/>

																				<Button
																					onClick={() =>
																						actions.handleRemoveMedia(
																							media.mediumId,
																						)
																					}
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
																	transition={{
																		duration: 0.5,
																		ease: "backOut",
																	}}
																	className="flex flex-col gap-2 justify-center items-center h-full aspect-square p-4"
																>
																	<Button className="flex w-full justify-center items-center bg-blue hover:bg-blue/75 focus-visible:bg-blue/75 rounded-full colors">
																		<Label
																			htmlFor="file-upload"
																			className="all flex justify-center items-center size-full px-4 py-2"
																		>
																			<span className="colors whitespace-nowrap text-center font-bold text-lg text-l1">
																				{chat("container.upload.upload")}
																			</span>
																		</Label>
																	</Button>

																	<Button
																		onClick={actions.handleRemoveAllMedia}
																		className="flex justify-center items-center rounded-full colors w-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																	>
																		<div className="all flex justify-center items-center gap-2 size-full px-4 py-2 cursor-pointer">
																			<Trash2 className="text-red all" />

																			<span className="colors whitespace-nowrap text-center font-bold text-lg text-red">
																				{chat("container.upload.clear-all")}
																			</span>
																		</div>
																	</Button>
																</motion.div>
															</motion.div>
														) : (
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
																		<span className="colors whitespace-nowrap text-center font-bold text-lg text-l1">
																			{chat("container.upload.upload")}
																		</span>
																	</Label>
																</Button>
															</motion.div>
														)}
													</AnimatePresence>
												</motion.div>
											)}
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
