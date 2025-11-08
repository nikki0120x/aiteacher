"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore } from "@/stores/useChatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { MathJaxContext } from "better-react-mathjax";
import { DndContext } from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
import {
	ScrollShadow,
	Spinner,
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Textarea,
	Slider,
	Divider,
	Switch,
	Card,
	CardBody,
	Accordion,
	AccordionItem,
	Tooltip,
} from "@heroui/react";
import type { SharedSelection } from "@heroui/react";
import {
	Mic,
	MicOff,
	Settings2,
	ImageUp,
	X,
	PanelBottomClose,
	PanelTopClose,
	SendHorizontal,
	Pause,
	ScrollText,
	BowArrow,
	BookText,
	BookCheck,
	ChevronDown,
} from "lucide-react";
import packageJson from "../../package.json";

declare global {
	interface Window {
		__TAURI__?: unknown;
	}
}

type Part = {
	text?: string;
	inlineData?: { mimeType: string; data: string };
};

type Content = {
	role: "user" | "model";
	parts: Part[];
};

type ImageItem = {
	id: string;
	src: string;
	fileName: string;
};

type ResponseMode = "learning" | "standard";

export default function Home() {
	const [switchState, setSwitchState] = useState({
		summary: false,
		guidance: false,
		explanation: false,
		answer: true,
	});

	const [sliders, setSliders] = useState({
		politeness: 0.5,
	});

	// ---------- 共通状態管理 ---------- //

	const {
		isSent,
		isLoading,
		isPanelOpen,
		activeContent,
		message,
		history,
		abortController,
		setIsSent,
		setIsLoading,
		setIsPanelOpen,
		togglePanel,
		setActiveContent,
		addMessage,
		addContentToHistory,
		setAbortController,
		updateMessage,
	} = useChatStore();

	// ---------- 応答方式 ---------- //

	const responseModes = {
		standard: {
			label: "標準",
			description: "会話に適したモード",
		},
		learning: {
			label: "学習",
			description: "問題解決に特化したモード",
		},
	};

	const [responseMode, setResponseMode] = useState<ResponseMode>("learning");

	const selectedModeLabel = responseModes[responseMode]?.label ?? "標準";

	const handleResponseModeSelection = (keys: SharedSelection) => {
		const selectedKey = Array.from(keys)[0] as ResponseMode;

		if (selectedKey === "standard" || selectedKey === "learning") {
			setResponseMode(selectedKey);
		}
	};

	// ---------- 画像タブ ---------- //

	const [images, setImages] = useState<{ [key: string]: ImageItem[] }>({
		problem: [],
	});

	const handleImageRemove = (tabKey: string, idToRemove: string) => {
		setImages((prev) => ({
			...prev,
			[tabKey]: prev[tabKey].filter((item) => item.id !== idToRemove),
		}));
	};

	const problemInputRef = useRef<HTMLInputElement>(null);

	const handleFiles = (tabKey: string, files: FileList | null) => {
		if (!files) return;
		const fileArray = Array.from(files).filter((file) =>
			file.type.startsWith("image/"),
		);

		fileArray.forEach((file) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result?.toString();
				if (base64) {
					const newImageItem: ImageItem = {
						id: crypto.randomUUID(),
						src: base64,
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
	};

	const handleDrop = (
		tabKey: string,
		event: React.DragEvent<HTMLDivElement>,
	) => {
		event.preventDefault();
		handleFiles(tabKey, event.dataTransfer.files);
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

			if (dragCounter.current === 1) {
				setIsDragActive(true);
			}
		};

		const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			dragCounter.current--;

			if (dragCounter.current === 0) {
				setIsDragActive(false);
			}
		};

		const handleDropAndReset = (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			handleDrop(tabKey, e);

			dragCounter.current = 0;
			setIsDragActive(false);
		};

		const containerClasses = `flex flex-col justify-center p-2 w-full h-full rounded-2xl border-2 border-dashed ${
			isDragActive ? "border-blue bg-blue/25" : "border-ld"
		}`;

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
				className={containerClasses}
			>
				{children}
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					multiple
					className="hidden"
					onChange={(e) => handleFiles(tabKey, e.target.files)}
				/>
			</div>
		);
	};

	// ---------- 音声入力 ---------- //

	const [isListening, setIsListening] = useState(false);
	const [inputText, setInputText] = useState("");
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	useEffect(() => {
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognition) {
			console.warn("このブラウザは音声認識をサポートしていません！");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "ja-JP";
		recognition.interimResults = true;
		recognition.continuous = true;

		const handleResult = (event: SpeechRecognitionEvent) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0].transcript)
				.join("");
			setInputText(transcript);
		};

		const handleError = (event: SpeechRecognitionErrorEvent) => {
			console.error("音声認識エラー:", event);
			setIsListening(false);
		};

		const handleEnd = () => {
			setIsListening(false);
		};

		recognition.addEventListener("result", handleResult);
		recognition.addEventListener("error", handleError);
		recognition.addEventListener("end", handleEnd);

		recognitionRef.current = recognition;

		return () => {
			recognition.removeEventListener("result", handleResult);
			recognition.removeEventListener("error", handleError);
			recognition.removeEventListener("end", handleEnd);
			recognition.stop();
			recognitionRef.current = null;
		};
	}, []);

	const toggleListening = () => {
		const recognition = recognitionRef.current;
		if (!recognition) return;

		if (isListening) {
			recognition.stop();
			setIsListening(false);
		} else {
			recognition.start();
			setIsListening(true);
		}
	};

	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		if (typeof navigator !== "undefined") {
			setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
		}
	}, []);
	const [hasMounted, setHasMounted] = useState(false);

	// ---------- 送信と応答 ---------- //

	const LOADING_PHRASES = [
		"回答を準備しています...",
		"思考中...",
		"思案中...",
		"構成を練っています...",
		"情報を整理中...",
		"回答を生成中です...",
	];
	const NUM_PHRASES = LOADING_PHRASES.length;

	const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);

	useEffect(() => {
		const isCurrentlyLoadingWithPlaceholder =
			isLoading && message.slice(-1)[0]?.text === "#LOADING_PHRASE#";

		if (isCurrentlyLoadingWithPlaceholder) {
			const interval = setInterval(() => {
				setCurrentLoadingIndex((prevIndex) => (prevIndex + 1) % NUM_PHRASES);
			}, 2500);

			return () => clearInterval(interval);
		}
	}, [isLoading, message, NUM_PHRASES]);

	const handleSend = async () => {
		if (inputText.trim() === "" && images.problem.length === 0) return;

		setIsLoading(true);
		setIsSent(true);

		const userText = inputText || "(画像のみ)";
		const tempId = crypto.randomUUID();
		const controller = new AbortController();
		setAbortController(controller);

		addMessage(userText, "user");
		addMessage("#LOADING_PHRASE#", "ai", switchState, tempId);

		const userParts: Part[] = [{ text: userText }];

		images.problem.forEach((img) => {
			userParts.push({ inlineData: { mimeType: "image/png", data: img.src } });
		});

		const userContent: Content = { role: "user", parts: userParts };

		try {
			let data: string;

			if (typeof window.__TAURI__ !== "undefined") {
				const imageSources = images.problem.map((item) => item.src);
				data = await invoke("process_gemini_request", {
					prompt: inputText,
					images: { problem: imageSources },
					options: switchState,
					sliders,
				});

				if (!controller.signal.aborted && data) {
					updateMessage(tempId, data);
					addContentToHistory(userContent);
					addContentToHistory({ role: "model", parts: [{ text: data }] });
				}
			} else {
				const payloadImages = {
					problem: images.problem.map((item) => item.src),
				};
				const res = await fetch("/api/gemini", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						prompt: userText,
						options: switchState,
						sliders,
						images: payloadImages,
						history,
					}),
					signal: controller.signal,
				});

				if (!res.body) {
					throw new Error("応答ストリームがありません。");
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let accumulatedText = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					accumulatedText += chunk;
					updateMessage(tempId, accumulatedText);
				}

				if (!controller.signal.aborted && accumulatedText) {
					addContentToHistory(userContent);
					addContentToHistory({
						role: "model",
						parts: [{ text: accumulatedText }],
					});
				}
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				console.log("Request aborted successfully.");
			} else {
				console.error("Gemini request error:", error);
			}
		} finally {
			setIsLoading(false);
			setAbortController(null);
			setImages({ problem: [] });
			setActiveContent(null);
			setInputText("");
		}
	};

	// ---------- スイッチの状態管理 ---------- //

	const handleSwitchChange = (key: keyof typeof switchState) => {
		const currentlyTrueCount =
			Object.values(switchState).filter(Boolean).length;

		setSwitchState((prev) => {
			if (prev[key] && currentlyTrueCount === 1) return prev;
			return { ...prev, [key]: !prev[key] };
		});
	};

	// ---------- フロントエンド ---------- //

	return (
		<motion.div className="flex flex-col w-full h-full relative">
			<motion.div
				initial={{ flex: 0, height: 0, opacity: 0 }}
				animate={{
					flex: isSent ? 1 : 0,
					height: isSent ? "auto" : 0,
					opacity: isSent ? 1 : 0,
				}}
				transition={{
					duration: 0.5,
					ease: "easeInOut",
				}}
				className="flex flex-col w-full h-full overflow-hidden"
			>
				<AnimatePresence>
					{!isPanelOpen && (
						<motion.div
							key="open-panel-button"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.5, ease: "easeInOut" }}
							className="absolute bottom-6 right-2 z-50"
						>
							<Button
								aria-label="Open Panel Button"
								isIconOnly
								size="lg"
								radius="md"
								className="shadow-lg shadow-l3 dark:shadow-d3 bg-l3/50 dark:bg-d3/50 backdrop-blur-xs text-d3 dark:text-l3"
								onPress={() => setIsPanelOpen(true)}
							>
								<PanelTopClose />
							</Button>
						</motion.div>
					)}
				</AnimatePresence>
				<ScrollShadow className="w-full h-full overflow-y-scroll">
					<motion.div className="flex flex-col">
						{message.map((msg) => (
							<MathJaxContext
								key={msg.id}
								version={3}
								config={{
									tex: {
										inlineMath: [
											["$", "$"],
											["\\(", "\\)"],
										],
									},
								}}
							>
								{msg.role === "user" ? (
									<Card
										shadow="none"
										radius="lg"
										className="rounded-2xl rounded-tr-sm w-full h-auto mb-2 bg-l3 dark:bg-d3"
									>
										<CardBody>
											<div
												className="overflow-x-hidden select-text prose dark:prose-invert max-w-full wrap-break-word text-lg font-medium text-d3 dark:text-l3"
												style={{
													minHeight: "2rem",
													maxHeight: `calc(2rem * 3)`,
													lineHeight: "2rem",
													overflowY: "auto",
												}}
											>
												<ReactMarkdown
													remarkPlugins={[remarkGfm, remarkMath]}
													rehypePlugins={[rehypeMathjax]}
												>
													{msg.text}
												</ReactMarkdown>
											</div>
										</CardBody>
									</Card>
								) : (
									(() => {
										const isCurrentLoadingMessage =
											isLoading && message.slice(-1)[0]?.id === msg.id;

										const state = msg.sectionsState ?? switchState;
										const sections: { title: string; text: string }[] = [];

										const extractSection = (header: string) => {
											const regex = new RegExp(
												`###\\s*${header}\\s*([\\s\\S]*?)(?=\\n###|$)`,
												"i",
											);
											return msg.text.match(regex)?.[1]?.trim();
										};

										const allSectionDefs: {
											key: keyof typeof switchState;
											title: string;
										}[] = [
											{ key: "summary", title: "要約" },
											{ key: "guidance", title: "指針" },
											{ key: "explanation", title: "解説" },
											{ key: "answer", title: "解答" },
										];

										const enabledSections = allSectionDefs.filter(
											(s) => state[s.key],
										);

										enabledSections.forEach(({ title }) => {
											const text = extractSection(title);
											sections.push({
												title,
												text: text ?? "",
											});
										});

										const enabledTitles = enabledSections.map((s) => s.title);
										const anyHeaderRegex = new RegExp(
											`###\\s*(${enabledTitles.join("|")})`,
											"i",
										);

										if (
											sections.length > 0 &&
											!msg.text.match(anyHeaderRegex)
										) {
											sections.forEach((sec) => {
												sec.text = msg.text;
											});
										}

										if (sections.length === 0) {
											sections.push({ title: "応答", text: msg.text });
										}

										if (
											sections.length > 0 &&
											!msg.text.match(anyHeaderRegex)
										) {
											sections[0].text = msg.text;
										}

										if (sections.length === 0) {
											sections.push({ title: "応答", text: msg.text });
										}

										let targetSectionIndex = -1;
										if (isCurrentLoadingMessage) {
											const lastSectionIndexWithContent = sections
												.slice()
												.reverse()
												.findIndex((s) => s.text && s.text.length > 0);

											if (lastSectionIndexWithContent >= 0) {
												targetSectionIndex =
													sections.length - 1 - lastSectionIndexWithContent;
											}
										}

										const LOADING_PHRASES = [
											"回答を準備しています...",
											"思考中...",
											"思案中...",
											"構成を練っています...",
											"情報を整理中...",
											"回答を生成中です...",
										];
										const NUM_PHRASES = LOADING_PHRASES.length;

										return (
											<Accordion
												selectionMode="multiple"
												variant="bordered"
												className="mb-4 border-1 border-l3 dark:border-d3 bg-l3 dark:bg-d3 text-base font-medium text-d3 dark:text-l3"
											>
												{sections.map((sec, i) => {
													let icon = null;
													switch (sec.title) {
														case "要約":
															icon = <ScrollText className="text-blue" />;
															break;
														case "指針":
														case "応答":
															icon = <BowArrow className="text-orange" />;
															break;
														case "解説":
															icon = <BookText className="text-red" />;
															break;
														case "解答":
															icon = <BookCheck className="text-lime" />;
															break;
													}

													const isInitialPlaceholder =
														sec.text === "#LOADING_PHRASE#";
													let displayContent = sec.text;

													const hasImages = (images.problem?.length || 0) > 0;

													if (isInitialPlaceholder) {
														if (isCurrentLoadingMessage && hasImages) {
															displayContent = "画像分析中...";
														} else {
															const phraseIndex =
																(i + currentLoadingIndex) % NUM_PHRASES;
															displayContent = LOADING_PHRASES[phraseIndex];
														}
													}

													const shouldAnimate =
														isCurrentLoadingMessage &&
														(isInitialPlaceholder || i === targetSectionIndex);

													const motionKey = isInitialPlaceholder
														? `loading-${i}-${currentLoadingIndex}`
														: `streaming-${i}`;

													return (
														<AccordionItem
															key={sec.title}
															aria-label={sec.title}
															title={
																<span
																	className={`
                            text-xl font-medium no-select
                            ${sec.title === "要約" ? "text-sky-500" : ""}
                            ${
															sec.title === "指針" || sec.title === "応答"
																? "text-orange-500"
																: ""
														}
                            ${sec.title === "解説" ? "text-rose-500" : ""}
                            ${sec.title === "解答" ? "text-lime-500" : ""}
																			`}
																>
																	{sec.title}
																</span>
															}
															startContent={icon}
															classNames={{ trigger: "cursor-pointer" }}
														>
															<div className="overflow-x-auto prose dark:prose-invert max-w-full wrap-break-word leading-9 text-lg font-normal text-d3 dark:text-l3">
																{shouldAnimate ? (
																	<motion.div
																		key={motionKey}
																		style={{ whiteSpace: "pre-wrap" }}
																	>
																		{displayContent
																			.split("")
																			.map((char, index) => (
																				<motion.span
																					key={`${sec.title}-${index}`}
																					initial={{ opacity: 0 }}
																					animate={{ opacity: 1 }}
																					transition={{
																						duration: 0.5,
																						delay: index * 0.005,
																					}}
																				>
																					{char}
																				</motion.span>
																			))}
																	</motion.div>
																) : (
																	<ReactMarkdown
																		remarkPlugins={[remarkGfm, remarkMath]}
																		rehypePlugins={[rehypeMathjax]}
																	>
																		{displayContent}
																	</ReactMarkdown>
																)}
															</div>
														</AccordionItem>
													);
												})}
											</Accordion>
										);
									})()
								)}
							</MathJaxContext>
						))}
					</motion.div>
				</ScrollShadow>
			</motion.div>
			<motion.div
				initial={{ flex: 1, height: 1, opacity: 1 }}
				animate={{
					flex: isSent ? 0 : 1,
					height: isPanelOpen ? "auto" : 0,
					opacity: isPanelOpen ? 1 : 0,
				}}
				transition={{
					duration: 0.5,
					ease: "easeInOut",
				}}
				className="flex flex-col justify-center items-center gap-10 w-full h-full no-select"
			>
				<AnimatePresence>
					{!isSent && (
						<motion.div
							key="heading"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5, ease: "easeInOut" }}
							className="flex flex-row justify-center items-center gap-4 w-full h-auto"
						>
							<Divider
								orientation="horizontal"
								className="flex-1 mr-8 bg-d5 dark:bg-l5"
							/>
							<Image
								src="/logos/dark.webp"
								alt="Logo (Dark)"
								width={128}
								height={128}
								className="object-contain dark:hidden"
							/>
							<Image
								src="/logos/light.webp"
								alt="Logo (Light)"
								width={128}
								height={128}
								className="object-contain hidden dark:block"
							/>
							<Divider
								orientation="vertical"
								className="max-h-10 bg-d5 dark:bg-l5"
							/>
							<span className="overflow-hidden whitespace-nowrap text-ellipsis text-center text-xl font-medium text-d5 dark:text-l5">
								Ver. {packageJson.version}
							</span>
							<Divider
								orientation="horizontal"
								className="flex-1 ml-8 bg-d5 dark:bg-l5"
							/>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="flex flex-col justify-center p-2 w-full rounded-2xl shadow-lg/50 shadow-l5 dark:shadow-d5 border-1 border-l5 dark:border-d5">
					<AnimatePresence>
						{isPanelOpen &&
							(isLoading ? (
								<motion.div
									key="loadingArea"
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.5, ease: "easeInOut" }}
									className="flex flex-row justify-between"
								>
									<div className="flex flex-row gap-2">
										<Spinner variant="default" size="md" />
									</div>
									<div className="flex flex-row gap-2">
										{isSent && (
											<Button
												aria-label="Close Panel Button"
												isIconOnly
												radius="full"
												className="text-d3 dark:text-l3 bg-transparent"
												onPress={() => {
													togglePanel();
													setActiveContent(null);
												}}
											>
												<PanelBottomClose />
											</Button>
										)}
										<Button
											aria-label="Pause Button"
											isIconOnly
											radius="full"
											className="ml-auto text-l3 bg-red"
											onPress={() => {
												if (abortController) {
													abortController.abort();

													setTimeout(() => {
														setIsLoading(false);
														setAbortController(null);
													}, 250);
												}
											}}
										>
											<Pause />
										</Button>
									</div>
								</motion.div>
							) : (
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
									<div className="flex flex-row pl-2 pb-2">
										<Textarea
											isRequired
											cacheMeasurements={true}
											minRows={1}
											maxRows={3}
											size="lg"
											variant="underlined"
											validationBehavior="aria"
											placeholder="AI に訊きたい質問はある？"
											className="text-d1 dark:text-l1"
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
											aria-label="Mic Button"
											isIconOnly
											radius="full"
											className={`shadow-lg shadow-l3 dark:shadow-d3 border-1 border-l3 dark:border-d3 ${
												isListening
													? "text-l3 bg-red"
													: "text-d3 dark:text-l3 bg-transparent"
											}`}
											onPress={toggleListening}
										>
											{isListening ? <Mic /> : <MicOff />}
										</Button>
									</div>
									<div className="flex flex-row justify-between pb-2">
										<div className="flex flex-row gap-2">
											<Button
												aria-label="Sliders Button"
												isIconOnly
												radius="full"
												className={`shadow-lg shadow-l3 dark:shadow-d3 border-1 border-l3 dark:border-d3 text-d3 dark:text-l3 ${
													activeContent === "sliders"
														? "bg-l3 dark:bg-d3"
														: "bg-transparent"
												}`}
												onPress={() =>
													setActiveContent(
														activeContent === "sliders" ? null : "sliders",
													)
												}
											>
												<Settings2 />
											</Button>
											<Button
												aria-label="Image Button"
												isIconOnly
												radius="full"
												className={`shadow-lg shadow-l3 dark:shadow-d3 border-1 border-l3 dark:border-d3 text-d3 dark:text-l3 ${
													activeContent === "images"
														? "bg-l3 dark:bg-d3"
														: "bg-transparent"
												}`}
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
													content:
														"shadow-lg shadow-l3 dark:shadow-d3 bg-l3/50 dark:bg-d3/50 backdrop-blur-xs text-d3 dark:text-l3",
												}}
											>
												<DropdownTrigger>
													<Button
														aria-label="Select a Mode Button"
														radius="full"
														className="shadow-lg shadow-l3 dark:shadow-d3 bg-transparent border-1 border-l3 dark:border-d3 text-base font-medium text-d3 dark:text-l3 hover:bg-l3 hover:dark:bg-d3"
													>
														<span className="text-base font-medium mr-1">
															{selectedModeLabel}
														</span>
														<ChevronDown size={16} />
													</Button>
												</DropdownTrigger>
												<DropdownMenu
													disallowEmptySelection
													aria-label="Response Mode Options"
													selectedKeys={[responseMode]}
													selectionMode="single"
													onSelectionChange={handleResponseModeSelection}
													itemClasses={{
														base: [],
													}}
												>
													<DropdownItem
														key="standard"
														description={responseModes.standard.description}
														className=""
													>
														{responseModes.standard.label}
													</DropdownItem>
													<DropdownItem
														key="learning"
														description={responseModes.learning.description}
														className=""
													>
														{responseModes.learning.label}
													</DropdownItem>
												</DropdownMenu>
											</Dropdown>
											{isSent && (
												<Button
													aria-label="Close Panel Button"
													isIconOnly
													radius="full"
													className="shadow-lg shadow-l3 dark:shadow-d3 bg-transparent border-1 border-l3 dark:border-d3 text-d3 dark:text-l3"
													onPress={() => {
														togglePanel();
														setActiveContent(null);
													}}
												>
													<PanelBottomClose />
												</Button>
											)}
											<Button
												aria-label="Send Button"
												isIconOnly
												radius="full"
												className={`shadow-lg shadow-l3 dark:shadow-d3 border-1 border-l3 dark:border-d3 ${
													inputText.trim() !== "" || images.problem.length > 0
														? "text-l3 bg-blue"
														: "text-d3 dark:text-l3 bg-l3 dark:bg-d3"
												}`}
												onPress={() => handleSend()}
												disabled={
													!(
														inputText.trim() !== "" || images.problem.length > 0
													)
												}
											>
												<SendHorizontal />
											</Button>
										</div>
									</div>
									<AnimatePresence>
										{activeContent && (
											<motion.div
												initial={{ height: 0 }}
												animate={{ height: "var(--panel-height)" }}
												exit={{ height: 0 }}
												transition={{ duration: 0.5, ease: "easeInOut" }}
												className="overflow-hidden [--panel-height:15rem] lg:[--panel-height:12rem]"
											>
												<ScrollShadow
													hideScrollBar
													visibility="none"
													className="w-full h-full"
												>
													{activeContent === "sliders" && (
														<div className="flex flex-col gap-8 justify-center p-2 w-full h-full">
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
																showSteps
																showTooltip
																step={0.25}
																size="lg"
																onChange={(value: number | number[]) => {
																	const numValue = Array.isArray(value)
																		? value[0]
																		: value;
																	setSliders((prev) => ({
																		...prev,
																		politeness: numValue,
																	}));
																}}
															/>
															<Divider className="bg-ld" />
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
																	onChange={() =>
																		handleSwitchChange("guidance")
																	}
																>
																	指針
																</Switch>

																<Switch
																	size="lg"
																	isSelected={switchState.explanation}
																	onChange={() =>
																		handleSwitchChange("explanation")
																	}
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
													)}

													{activeContent === "images" && (
														<DndContext>
															<div className="w-full h-full">
																<DroppableArea
																	tabKey="problem"
																	inputRef={problemInputRef}
																>
																	{images.problem.length === 0 ? (
																		<div className="flex flex-col gap-2 justify-center items-center p-8 w-full h-full">
																			<Button
																				aria-label="Upload Images Button"
																				size="lg"
																				radius="full"
																				className="text-center text-xl font-medium text-l1 bg-blue"
																				onPress={() =>
																					problemInputRef.current?.click()
																				}
																			>
																				画像アップロード
																			</Button>
																			<span className="text-lg font-medium text-ld">
																				ファイルをドラッグ&ドロップ
																			</span>
																		</div>
																	) : (
																		<div className="flex flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden">
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
																						key={item.id}
																						className="relative group shrink-0"
																					>
																						<Image
																							src={item.src}
																							alt={item.fileName}
																							width={160}
																							height={160}
																							className="rounded-lg object-cover aspect-square"
																						/>
																						<Button
																							aria-label="Remove Image Button"
																							isIconOnly
																							size="sm"
																							radius="full"
																							className="absolute top-1 right-1 z-10 text-l1 bg-red opacity-0 group-hover:opacity-100"
																							onPress={() =>
																								handleImageRemove(
																									"problem",
																									item.id,
																								)
																							}
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
													)}
												</ScrollShadow>
											</motion.div>
										)}
									</AnimatePresence>
								</motion.div>
							))}
					</AnimatePresence>
				</div>
			</motion.div>
		</motion.div>
	);
}
