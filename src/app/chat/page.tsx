/* src/app/chat/page.tsx */
"use client";
import { DndContext } from "@dnd-kit/core";
import {
	Accordion,
	AccordionItem,
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
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlockMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useChatDisplay } from "@/hooks/useChatDisplay";
import { useChatLogic } from "@/hooks/useChatLogic";
import { responseModes, useChatSettings } from "@/hooks/useChatSettings";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useChatInput } from "@/hooks/useTextInput";
import { useChatStore } from "@/stores/useChat";
import packageJson from "../../../package.json";

declare global {
	interface Window {
		__TAURI__?: unknown;
	}
}

type ContentBlock = {
	type: "text" | "formula";
	content: string;
};

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

	const {
		turns,
		lastTurnId,
		chatHistoryRef,
		messagesEndRef,
		chatHistoryHeight,
	} = useChatDisplay();

	// ================================================================
	//     送信と中断
	// ================================================================

	const { handleSend: chatLogicHandleSend, handleAbort: chatLogicHandleAbort } =
		useChatLogic();

	const handleSend = async () => {
		if (inputText.trim() !== "" || images.problem.length > 0) {
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
			await chatLogicHandleSend(
				text,
				images.problem,
				sliders,
				switchState,
				() => {},
				setImages,
			);
		},
		[chatLogicHandleSend, images.problem, sliders, switchState, setImages],
	);

	const { inputText, setInputText, isListening, toggleListening, isMobile } =
		useChatInput(wrappedHandleSend);

	// ================================================================
	//     画像欄
	// ================================================================

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
			handleDrop(tabKey, e);
			dragCounter.current = 0;
			setIsDragActive(false);
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
				className={`flex flex-col justify-center p-2 w-full h-full rounded-2xl border-2 border-dashed ${
					isDragActive ? "border-blue bg-blue/25" : "border-ld"
				}`}
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

	const [hasMounted, setHasMounted] = useState(false);

	// ================================================================
	//     アコーディオン制御ロジック
	// ================================================================

	const [accordionKeys, setAccordionKeys] = useState<
		Record<string, SharedSelection>
	>({});

	const prevTurnsLengthRef = useRef(turns.length);

	useEffect(() => {
		if (turns.length === 0 || turns.length <= prevTurnsLengthRef.current) {
			prevTurnsLengthRef.current = turns.length;
			return;
		}

		prevTurnsLengthRef.current = turns.length;

		setAccordionKeys(() => {
			const newKeys: Record<string, SharedSelection> = {};
			for (const turn of turns) {
				newKeys[turn.user.id] = new Set([]) as unknown as SharedSelection;
			}
			return newKeys;
		});
	}, [turns]);

	// ================================================================
	//     レンダリングヘルパー
	// ================================================================

	const renderContentBlocks = (blocks: ContentBlock[]) => {
		return blocks.map((block, idx) => {
			const blockKey = `block-${idx}`;
			if (block.type === "formula") {
				return (
					<div key={blockKey} className="p-2 my-2 w-full min-w-0">
						<div
							className="overflow-x-auto overflow-y-hidden text-d3 dark:text-l3 rounded-4xl bg-l3 dark:bg-d3"
							style={{ display: "grid" }}
						>
							<div className="p-4 mx-auto w-fit min-w-full text-xl font-medium">
								<BlockMath math={block.content} />
							</div>
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

	// ================================================================
	//     フロントエンド
	// ================================================================

	return (
		<div className="flex flex-none justify-center items-center p-4 pt-0 size-full">
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
					<ScrollShadow hideScrollBar visibility="none" className="size-full">
						<AnimatePresence mode="sync">
							{turns.map((turn, index) => {
								const isLatestTurn = turn.user.id === lastTurnId;
								const msg = turn.model;
								const isLastItem = index === turns.length - 1;

								return (
									<motion.div
										key={turn.user.id}
										style={{
											height:
												isLatestTurn && chatHistoryHeight
													? `${chatHistoryHeight}px`
													: "auto",
										}}
										className="flex flex-col gap-4 items-center w-full"
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

										{msg && (
											<Accordion
												selectionMode="multiple"
												variant="bordered"
												selectedKeys={
													accordionKeys[turn.user.id] || new Set([])
												}
												onSelectionChange={(keys) => {
													setAccordionKeys((prev) => ({
														...prev,
														[turn.user.id]: keys,
													}));
												}}
												className="shrink-0 p-4 w-full rounded-4xl border-none bg-l2 dark:bg-d2"
											>
												{(() => {
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
														(def) =>
															state[def.key] &&
															msg.text.includes(`"${def.key}"`),
													);

													const showGenericResponse =
														isNotProblem || !hasStartedStructure;

													if (showGenericResponse) {
														let displayTitle: React.ReactNode;

														if (isNotProblem) {
															displayTitle = (
																<div className="flex relative flex-row gap-4 items-center">
																	<TriangleAlert
																		size={32}
																		className="text-yellow"
																	/>
																	<span className="text-xl font-bold text-yellow">
																		失敗！
																	</span>
																</div>
															);
														} else {
															displayTitle = (
																<div className="flex flex-row gap-4 items-center">
																	<Spinner
																		variant="spinner"
																		size="md"
																		color="primary"
																	/>
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

														/*  ================================================================
																応答画面
															================================================================ */

														return (
															<AccordionItem
																title={displayTitle}
																classNames={{ trigger: "px-2 cursor-pointer" }}
															>
																<div className="p-2 w-full text-lg font-medium text-d3 dark:text-l3 wrap-break-word">
																	{isNotProblem ? (
																		<div className="flex flex-col gap-4 justify-center items-center p-8 rounded-4xl bg-l3 dark:bg-d3">
																			<p className="text-lg font-bold text-d3 dark:text-l3 text-center">
																				質問を聴き取ることができませんでした
																			</p>
																			<p className="text-base font-medium text-d3/75 dark:text-l3/75 text-center">
																				よかったら再度、AI
																				に質問を訊いてみてね！
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

													const activeSections = sectionDefs.filter(
														(def) => state[def.key],
													);

													return activeSections.map((sec) => {
														let icon = null;
														let titleClassName = "";

														switch (sec.title) {
															case "要約":
																icon = (
																	<ScrollText size={32} className="text-blue" />
																);
																titleClassName = "text-xl font-bold text-blue";
																break;
															case "指針":
																icon = (
																	<BowArrow size={32} className="text-orange" />
																);
																titleClassName =
																	"text-xl font-bold text-orange";
																break;
															case "解説":
																icon = (
																	<BookText size={32} className="text-red" />
																);
																titleClassName = "text-xl font-bold text-red";
																break;
															case "解答":
																icon = (
																	<BookCheck size={32} className="text-lime" />
																);
																titleClassName = "text-xl font-bold text-lime";
																break;
														}

														const blocks = extractJsonArray(msg.text, sec.key);
														const isInitialPlaceholder = blocks.length === 0;

														return (
															<AccordionItem
																key={sec.key}
																aria-label={sec.title}
																title={
																	<span className={titleClassName}>
																		{sec.title}
																	</span>
																}
																startContent={icon}
																classNames={{ trigger: "px-2 cursor-pointer" }}
															>
																<div className="p-2 w-full text-lg font-medium text-d3 dark:text-l3 wrap-break-word">
																	{isInitialPlaceholder ? (
																		<div className="animate-pulse"></div>
																	) : (
																		<div className="flex flex-col gap-4">
																			{renderContentBlocks(blocks)}
																		</div>
																	)}
																</div>
															</AccordionItem>
														);
													});
												})()}
											</Accordion>
										)}

										{!isLastItem && (
											<Divider className="shrink-0 mt-4 mb-8 w-[calc(100%-1rem)] bg-l4 dark:bg-d4" />
										)}
									</motion.div>
								);
							})}
						</AnimatePresence>
						<div ref={messagesEndRef} />
					</ScrollShadow>
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
								<Image
									src="/logos/dark.webp"
									alt="Logo (Dark)"
									width={128}
									height={128}
									className="dark:hidden object-contain"
								/>
								<Image
									src="/logos/light.webp"
									alt="Logo (Light)"
									width={128}
									height={128}
									className="dark:block hidden object-contain"
								/>
								<Divider
									orientation="vertical"
									className="max-h-10 bg-d5 dark:bg-l5"
								/>
								<span className="overflow-hidden text-xl font-medium text-d5 dark:text-l5 text-center text-ellipsis whitespace-nowrap">
									Ver. β-{packageJson.version}
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
												className="size-full"
											>
												{activeContent === "sliders" && (
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
															onChange={(v) =>
																handleSliderChange("politeness", v)
															}
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
														<div className="size-full">
															<DroppableArea
																tabKey="problem"
																inputRef={problemInputRef}
															>
																{images.problem.length === 0 ? (
																	<div className="flex flex-col gap-2 justify-center items-center p-8 size-full">
																		<Button
																			size="lg"
																			radius="full"
																			className="text-xl font-medium text-l2 text-center bg-blue"
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
																	<div className="flex overflow-x-auto overflow-y-hidden flex-row flex-nowrap gap-2">
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
																				<div className="relative shrink-0">
																					<Image
																						src={item.src}
																						alt={item.fileName}
																						width={160}
																						height={160}
																						className="aspect-square object-cover rounded-4xl"
																					/>
																					<Button
																						isIconOnly
																						size="sm"
																						radius="full"
																						className="absolute top-2 right-2 text-l2 bg-red"
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
						</AnimatePresence>
					</div>
				</motion.div>
			</motion.div>
		</div>
	);
}
