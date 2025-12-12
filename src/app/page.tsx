// src\app\page.tsx

"use client";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import packageJson from "../../package.json";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DndContext } from "@dnd-kit/core";
import {
	ScrollShadow,
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
import {
	Mic,
	MicOff,
	Settings2,
	ImageUp,
	X,
	SendHorizontal,
	Pause,
	ScrollText,
	BowArrow,
	BookText,
	BookCheck,
	ChevronDown,
} from "lucide-react";
import { useChatStore } from "@/stores/useChat";
import { useChatInput } from "@/hooks/useTextInput";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useChatSettings, responseModes } from "@/hooks/useChatSettings";
import { useChatDisplay } from "@/hooks/useChatDisplay";
import { useChatLogic } from "@/hooks/useChatLogic";

declare global {
	interface Window {
		__TAURI__?: unknown;
	}
}

export default function Home() {
	const {
		isSent,
		isLoading,
		isPanelOpen,
		activeContent,
		message,
		setActiveContent,
	} = useChatStore();

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
		getLoadingPhrase,
	} = useChatDisplay();

	// ================================================================
	//     1. 送信と中断（handleSend, handleAbort）
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
	//     2. 入力欄
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
		[chatLogicHandleSend, images.problem, sliders, switchState],
	);

	const { inputText, setInputText, isListening, toggleListening, isMobile } =
		useChatInput(wrappedHandleSend);

	// ================================================================
	//     3. 画像欄
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

	const [hasMounted, setHasMounted] = useState(false);

	// ---------- フロントエンド ---------- //

	return (
		<motion.div className="relative flex h-full w-full flex-col">
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
				className="flex h-full w-full flex-col overflow-hidden"
				ref={chatHistoryRef}
			>
				<ScrollShadow hideScrollBar visibility="none" className="h-full w-full">
					<AnimatePresence mode="sync">
						{turns.map((turn) => {
							const isLatestTurn = turn.user.id === lastTurnId;
							const msg = turn.model;
							const latestMessage = message.slice(-1)[0];
							const isCurrentLoadingTurn =
								isLoading && turn.model?.id === latestMessage?.id;

							const hasImages = (images.problem?.length || 0) > 0;

							const state = msg?.sectionsState ?? switchState;
							const sections: { title: string; text: string }[] = [];

							const extractSection = (header: string) => {
								if (!msg?.text) return undefined;
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
								msg &&
								sections.length > 0 &&
								!msg.text.match(anyHeaderRegex)
							) {
								sections[0].text = msg.text;
							}
							if (msg && sections.length === 0) {
								sections.push({ title: "応答", text: msg.text });
							}

							return (
								<motion.div
									key={turn.user.id}
									initial={{ opacity: 0, y: 50 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 50 }}
									transition={{
										duration: 0.5,
										ease: "easeInOut",
									}}
									style={{
										height:
											isLatestTurn && chatHistoryHeight
												? `${chatHistoryHeight}px`
												: "auto",
									}}
								>
									<Card
										shadow="none"
										radius="lg"
										className="mb-2 h-auto w-full rounded-4xl bg-l2 dark:bg-d2"
									>
										<CardBody>
											<div
												className="prose dark:prose-invert wrap-break-word flex max-w-full select-text items-center justify-start overflow-x-hidden px-2 font-medium text-d3 text-lg dark:text-l3"
												style={{
													minHeight: "2rem",
													maxHeight: `calc(2rem * 3)`,
													lineHeight: "normal",
													overflowY: "auto",
												}}
											>
												<ReactMarkdown
													remarkPlugins={[remarkGfm, remarkMath]}
													rehypePlugins={[rehypeRaw, rehypeKatex]}
												>
													{turn.user.text}
												</ReactMarkdown>
											</div>
										</CardBody>
									</Card>

									{turn.model && (
										<Accordion
											selectionMode="multiple"
											variant="bordered"
											className="rounded-4xl border-2 border-l2 bg-l2 font-medium text-base text-d2 dark:border-d2 dark:bg-d2 dark:text-l2"
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

												if (isInitialPlaceholder) {
													if (isCurrentLoadingTurn && hasImages) {
														displayContent = "画像分析中...";
													} else if (isCurrentLoadingTurn) {
														displayContent = getLoadingPhrase(i);
													}
												}

												return (
													<AccordionItem
														key={sec.title}
														aria-label={sec.title}
														title={
															<span
																className={`no-select font-medium text-xl ${sec.title === "要約" ? "text-sky-500" : ""}
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
														classNames={{ trigger: "px-2 cursor-pointer" }}
													>
														<div
															className="prose dark:prose-invert wrap-break-word max-w-full px-2 font-normal text-d3 text-lg dark:text-l3"
															style={{ lineHeight: "2" }}
														>
															<ReactMarkdown
																remarkPlugins={[remarkGfm, remarkMath]}
																rehypePlugins={[rehypeRaw, rehypeKatex]}
															>
																{displayContent}
															</ReactMarkdown>
														</div>
													</AccordionItem>
												);
											})}
										</Accordion>
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
					height: isPanelOpen ? "auto" : 0,
					opacity: isPanelOpen ? 1 : 0,
				}}
				transition={{
					duration: 0.5,
					ease: "easeInOut",
				}}
				className="no-select flex h-full w-full flex-col items-center justify-center gap-10"
			>
				<AnimatePresence>
					{!isSent && (
						<motion.div
							key="heading"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5, ease: "easeInOut" }}
							className="flex h-auto w-full flex-row items-center justify-center gap-4"
						>
							<Divider
								orientation="horizontal"
								className="mr-8 flex-1 bg-d5 dark:bg-l5"
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
								className="hidden object-contain dark:block"
							/>
							<Divider
								orientation="vertical"
								className="max-h-10 bg-d5 dark:bg-l5"
							/>
							<span className="overflow-hidden text-ellipsis whitespace-nowrap text-center font-medium text-d5 text-xl dark:text-l5">
								Ver. β-{packageJson.version}
							</span>
							<Divider
								orientation="horizontal"
								className="ml-8 flex-1 bg-d5 dark:bg-l5"
							/>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="flex w-full flex-col justify-center rounded-4xl border-1 border-l5 p-2 shadow-l5 shadow-lg/50 dark:border-d5 dark:shadow-d5">
					<AnimatePresence>
						{isPanelOpen && (
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
								<div className="flex flex-row px-2">
									<Textarea
										isRequired
										cacheMeasurements={true}
										minRows={1}
										maxRows={3}
										size="lg"
										variant="underlined"
										validationBehavior="aria"
										placeholder="AI に訊きたい質問はある？"
										className="no-after-content text-d1 dark:text-l1"
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
										className={`border-1 border-l3 shadow-l3 shadow-lg dark:border-d3 dark:shadow-d3 ${
											isListening
												? "bg-red text-l3"
												: "bg-transparent text-d3 dark:text-l3"
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
											className={`border-1 border-l3 text-d3 shadow-l3 shadow-lg dark:border-d3 dark:text-l3 dark:shadow-d3 ${
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
											className={`border-1 border-l3 text-d3 shadow-l3 shadow-lg dark:border-d3 dark:text-l3 dark:shadow-d3 ${
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
													"shadow-lg shadow-l3 dark:shadow-d3 bg-l3 dark:bg-d3 text-d3 dark:text-l3",
											}}
										>
											<DropdownTrigger>
												<Button
													aria-label="Select a Response Mode Button"
													radius="full"
													className="border-1 border-l3 bg-transparent font-medium text-base text-d3 shadow-l3 shadow-lg hover:bg-l3 dark:border-d3 dark:text-l3 dark:shadow-d3 hover:dark:bg-d3"
												>
													{selectedModeLabel}
													<ChevronDown size={16} />
												</Button>
											</DropdownTrigger>
											<DropdownMenu
												disallowEmptySelection
												aria-label="Response Modes Menu"
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
											aria-label={isLoading ? "Abort Button" : "Send Button"}
											isIconOnly
											radius="full"
											className={`border-1 border-l3 shadow-l3 shadow-lg dark:border-d3 dark:shadow-d3 ${
												isLoading
													? "bg-red text-l3"
													: inputText.trim() !== "" || images.problem.length > 0
														? "bg-blue text-l3"
														: "bg-l3 text-d3 dark:bg-d3 dark:text-l3"
											}`}
											onPress={() => (isLoading ? handleAbort() : handleSend())}
											disabled={
												!isLoading &&
												!(inputText.trim() !== "" || images.problem.length > 0)
											}
										>
											{isLoading ? <Pause /> : <SendHorizontal />}{" "}
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
												className="h-full w-full"
											>
												{activeContent === "sliders" && (
													<div className="flex h-full w-full flex-col justify-center gap-8 p-2">
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
																handleSliderChange("politeness", value);
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
														<div className="h-full w-full">
															<DroppableArea
																tabKey="problem"
																inputRef={problemInputRef}
															>
																{images.problem.length === 0 ? (
																	<div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
																		<Button
																			aria-label="Upload Images Button"
																			size="lg"
																			radius="full"
																			className="bg-blue text-center font-medium text-l1 text-xl"
																			onPress={() =>
																				problemInputRef.current?.click()
																			}
																		>
																			画像アップロード
																		</Button>
																		<span className="font-medium text-ld text-lg">
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
																					className="relative shrink-0"
																				>
																					<Image
																						src={item.src}
																						alt={item.fileName}
																						width={160}
																						height={160}
																						className="aspect-square rounded-lg object-cover"
																					/>
																					<Button
																						aria-label="Remove Image Button"
																						isIconOnly
																						size="sm"
																						radius="full"
																						className="absolute top-1 right-1 z-10 bg-red text-l3"
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
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</motion.div>
	);
}
