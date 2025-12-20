/* src\app\chat\page.tsx */
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
	Slider,
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
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
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

export default function Chat() {
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
		[chatLogicHandleSend, images.problem, sliders, switchState, setImages],
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

	// ================================================================
	//     フロントエンド
	// ================================================================

	return (
		<motion.div className="flex justify-center items-center p-4 size-full">
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
				className="flex overflow-hidden flex-col w-full h-full"
				ref={chatHistoryRef}
			>
				<ScrollShadow hideScrollBar visibility="none" className="w-full h-full">
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
								sections.push({
									title: "応答",
									text: msg.text,
								});
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
										className="mb-2 w-full h-auto rounded-4xl bg-l2 dark:bg-d2"
									>
										<CardBody>
											<div
												className="flex overflow-x-hidden justify-start items-center px-2 max-w-full text-lg font-medium text-d3 dark:text-l3 wrap-break-word select-text prose dark:prose-invert"
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
											className="text-base font-medium text-d2 dark:text-l2 rounded-4xl border-2 border-l2 dark:border-d2 bg-l2 dark:bg-d2"
										>
											{sections.map((sec, i) => {
												let icon = null;
												switch (sec.title) {
													case "要約":
														icon = <ScrollText className="text-blue" />;
														break;
													case "指針":
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
																className={`text-xl font-medium no-select ${sec.title === "要約" ? "text-sky-500" : ""} ${
																	sec.title === "指針" || sec.title === "応答"
																		? "text-orange-500"
																		: ""
																} ${sec.title === "解説" ? "text-rose-500" : ""} ${sec.title === "解答" ? "text-lime-500" : ""} `}
															>
																{sec.title}
															</span>
														}
														startContent={icon}
														classNames={{
															trigger: "px-2 cursor-pointer",
														}}
													>
														<div
															className="px-2 max-w-full text-lg font-normal text-d3 dark:text-l3 wrap-break-word prose dark:prose-invert"
															style={{
																lineHeight: "2",
															}}
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
							className="flex flex-row gap-4 justify-center items-center w-full h-auto"
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
							<Divider
								orientation="horizontal"
								className="flex-1 ml-8 bg-d5 dark:bg-l5"
							/>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="flex flex-col justify-center p-4 w-full rounded-4xl border-1 border-l5 dark:border-d5">
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
								transition={{
									duration: 0.5,
									ease: "easeInOut",
								}}
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
										aria-label="Mic Button"
										isIconOnly
										radius="full"
										className={`${
											isListening
												? "bg-red text-l2"
												: "bg-transparent hover:bg-l2 dark:hover:bg-d2 text-d2 dark:text-l2"
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
											className={`text-d2 dark:text-l2 ${
												activeContent === "sliders"
													? "bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3"
													: "bg-transparent hover:bg-l2 dark:hover:bg-d2"
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
											className={`text-d2 dark:text-l2 ${
												activeContent === "images"
													? "bg-l2 dark:bg-d2 hover:bg-l3 dark:hover:bg-d3"
													: "bg-transparent hover:bg-l2 dark:hover:bg-d2"
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
												content: "text-d2 dark:text-l2 bg-l2 dark:bg-d2",
											}}
										>
											<DropdownTrigger>
												<Button
													aria-label="Select a Response Mode Button"
													radius="full"
													className="text-base font-medium text-d2 dark:text-l2 bg-transparent hover:bg-l2 dark:hover:bg-d2"
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
											className={`${
												isLoading
													? "bg-red text-l2"
													: inputText.trim() !== "" || images.problem.length > 0
														? "bg-blue text-l2"
														: "bg-l2 text-d2 dark:bg-d2 dark:text-l2"
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
											animate={{
												height: "var(--panel-height)",
											}}
											exit={{ height: 0 }}
											transition={{
												duration: 0.5,
												ease: "easeInOut",
											}}
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
															formatOptions={{
																style: "percent",
															}}
															label="丁寧度"
															marks={[
																{
																	value: 0.25,
																	label: "難しい",
																},
																{
																	value: 0.5,
																	label: "普通",
																},
																{
																	value: 0.75,
																	label: "易しい",
																},
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
																			aria-label="Upload Images Button"
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
																				<div
																					key={item.id}
																					className="relative shrink-0"
																				>
																					<Image
																						src={item.src}
																						alt={item.fileName}
																						width={160}
																						height={160}
																						className="aspect-square object-cover rounded-4xl"
																					/>
																					<Button
																						aria-label="Remove Image Button"
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
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</motion.div>
	);
}
