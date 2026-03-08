"use client";
import { useState } from "react";
import {
	AudioLines,
	ListOrdered,
	Maximize2,
	Mic,
	Minimize2,
	Paperclip,
	Plus,
	SendHorizontal,
	Settings2,
	Square,
	Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useChatView } from "@/app/[language]/[location]/views/viewChat";
import { VoiceVisualizer } from "@/components/dedicated/voiceVisualizer";
import { Button, Input, Label, Slider, Switch } from "@/components/ui";
import { Virtuoso } from "react-virtuoso";
import { useSettingsView } from "@/app/[language]/[location]/views/viewComponents";

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

				{/* biome-ignore lint/performance/noImgElement: ローカルのBlob URLプレビューのため最適化不要 */}
				<img src={media.src} alt={media.fileName} className="size-full object-cover" />
			</div>
		);
	}

	if (isVideo) {
		return (
			<div className="relative size-full">
				<CircularProgress />
				{/* biome-ignore lint/a11y/useMediaCaption: ローカル動画のプレビューのため字幕トラックは不要 */}
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

			<span className="colors break-all text-center font-medium text-base text-d1 dark:text-l1 line-clamp-2">
				{name}
			</span>

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

export default function Chat() {
	const chat = useChatView();
	const settings = useSettingsView();

	const renderTurn = (index: number, turn: any) => {
		const question = turn.pages[0]?.questions[0];
		if (!question) return null;

		const userBlocks = question.messages.user.blocks;
		const modelBlocks = question.messages.model[0]?.blocks;

		return (
			<div className="flex flex-col gap-4 p-4 mb-4 text-d1 dark:text-l1">
				<div className="flex flex-col items-end gap-2">
					<div className="bg-blue text-l1 px-4 py-2 rounded-2xl max-w-[80%]">
						{userBlocks.map((b: any, i: number) => (
							<span key={`${turn.turnId}-user-block-${i}`}>{b.content || "メディアが送信されました"}</span>
						))}
					</div>
				</div>

				<div className="flex flex-col items-start gap-2">
					<div className="bg-l2 dark:bg-d2 px-4 py-2 rounded-2xl">
						{modelBlocks?.length > 0
							? modelBlocks.map((b: any, i: number) => (
								<span key={`${turn.turnId}-model-block-${i}`}>{b.content}</span>
							))
							: <span className="animate-pulse">考え中...</span>
						}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div
			onDragOver={chat.actions.handleDragOver}
			onDragEnter={chat.actions.handleDragEnter}
			onDragLeave={chat.actions.handleDragLeave}
			onDrop={chat.actions.handleDrop}
			className="colors relative inset-0 flex w-full h-[calc(100dvh-3.75rem)] select-none items-center justify-center bg-l1 p-4 dark:bg-d1"
		>
			<AnimatePresence>
				{chat.states.dragInfo && (
					<motion.div
						layout
						initial={{ opacity: 0, filter: "blur(16px)", pointerEvents: "none" }}
						animate={{ opacity: 1, filter: "blur(0px)", pointerEvents: "auto" }}
						exit={{ opacity: 0, filter: "blur(16px)", pointerEvents: "none" }}
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
								ref={chat.refs.dragAndDropTextRef}
								className="colors text-center font-black text-2xl text-blue"
							>
								{chat.states.dragInfo.count}ファイルをドロップ
							</motion.span>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="colors flex size-full max-w-4xl flex-col items-center justify-center">
				<AnimatePresence>
					{chat.states.isSent && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="w-full flex-1 overflow-hidden mb-4"
						>
							<Virtuoso
								data={chat.states.turns}
								itemContent={renderTurn}
								followOutput="smooth"
								className="h-full scrollbar-hide"
							/>
						</motion.div>
					)}
				</AnimatePresence>

				<motion.div
					layout
					initial={{ flex: 1, opacity: 0, filter: "blur(16px)" }}
					animate={{
						flex: chat.states.isSent ? 0 : 1,
						opacity: 1,
						filter: "blur(0px)",
					}}
					exit={{ flex: 1, opacity: 1, filter: "blur(16px)" }}
					transition={{ duration: 0.5, ease: "backOut" }}
					className="flex size-full flex-col items-center justify-center"
				>
					<AnimatePresence>
						{!chat.states.isSent && !chat.states.isFullTextarea && (
							<motion.div
								layout
								initial={{ height: 0, opacity: 0, filter: "blur(16px)" }}
								animate={{
									height: "auto",
									opacity: 1,
									filter: "blur(0px)",
								}}
								exit={{ height: 0, opacity: 0, filter: "blur(16px)" }}
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
										ref={chat.refs.pageTitleTextRef}
										className="colors text-center font-bold text-base text-d5 italic dark:text-l5"
									>
										分からない問題があるの？なんでも訊いてね！
									</motion.span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<motion.div
						layout
						initial={{ height: 0, opacity: 0, filter: "blur(16px)" }}
						animate={{
							height: chat.states.containerHeight,
							opacity: 1,
							filter: "blur(0px)",
						}}
						exit={{ height: 0, opacity: 1, filter: "blur(16px)" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						className="colors flex size-full flex-col items-center justify-center rounded-4xl border border-l5 dark:border-d5"
					>
						<div className="colors flex size-full flex-col items-center justify-center p-4">
							<div className="colors flex size-full min-h-10 flex-row items-start justify-center gap-1 mb-2">
								<motion.textarea
									style={{ height: chat.states.textareaHeight }}
									transition={{ duration: 0.5, ease: "backOut" }}
									name="prompt"
									rows={1}
									placeholder={
										chat.states.isListening
											? "訊きたい質問を音声入力"
											: "訊きたい質問を入力"
									}
									value={chat.states.displayText}
									ref={chat.refs.textareaRef}
									readOnly={chat.states.isListening}
									onChange={(e) => {
										chat.actions.setInterimText("");
										chat.actions.setInputText((prev) => ({
											...prev,
											inputText: e.target.value,
										}));
									}}
									className={`colors my-2 ml-2 size-full animate-caret resize-none text-left font-medium text-base text-d1 outline-none placeholder:text-l5 dark:text-l1 dark:placeholder:text-d5 ${chat.states.isListening ? "cursor-not-allowed" : ""}`}
								/>

								<div className="colors flex flex-col items-center justify-center gap-1">
									<AnimatePresence mode="popLayout">
										{chat.states.displayText && (
											<motion.div
												layout
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 0, opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
											>
												<Button
													onClick={chat.actions.handleInputTextClear}
													className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
												>
													<Trash2 className="all text-red" />
												</Button>
											</motion.div>
										)}
									</AnimatePresence>

									<AnimatePresence mode="popLayout">
										{(chat.states.isOverLimit || chat.states.isFullTextarea) && (
											<motion.div
												layout
												initial={{ scale: 0, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												exit={{ scale: 0, opacity: 0 }}
												transition={{ duration: 0.5, ease: "backOut" }}
											>
												<Button
													onClick={() =>
														chat.actions.setIsFullTextarea(!chat.states.isFullTextarea)
													}
													className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
												>
													{chat.states.isFullTextarea ? (
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
									{chat.states.isListening ? (
										<motion.div
											key="voice-bar"
											initial={{ y: 16, opacity: 0 }}
											animate={{ y: 0, opacity: 1 }}
											exit={{ y: 16, opacity: 0 }}
											className="colors flex h-10 w-full flex-row items-center justify-center gap-1"
										>
											<div className="colors h-full flex-1 overflow-hidden">
												<VoiceVisualizer isListening={chat.states.isListening} />
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
														ref={(node) => {
															if (node) node.focus();
														}}
														onClick={chat.actions.toggleListening}
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
															onClick={() => chat.actions.toggleMenu("plus")}
															className={`colors flex size-10 items-center justify-center rounded-full
																${chat.states.activeMenu === "plus" ?
																	"bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3" : "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																}`}
														>
															<Plus className="text-d1 dark:text-l1 all" />
														</Button>
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
															onClick={() => chat.actions.toggleMenu("settings")}
															className={`colors flex size-10 items-center justify-center rounded-full
																${chat.states.activeMenu === "settings" ?
																	"bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3" : "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																}`}
														>
															<Settings2 className="text-d1 dark:text-l1 all" />
														</Button>
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
															onClick={() => chat.actions.toggleMenu("list")}
															className={`colors flex size-10 items-center justify-center rounded-full
																${chat.states.activeMenu === "list" ?
																	"bg-l2 dark:bg-d2 hover:bg-l3 focus-visible:bg-l3 dark:focus-visible:bg-d3 dark:hover:bg-d3" : "hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
																}`}
														>
															<ListOrdered className="text-d1 dark:text-l1 all" />
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
													>
														<Button
															onClick={chat.actions.toggleListening}
															className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
														>
															<Mic className="text-d1 dark:text-l1 all" />
														</Button>
													</motion.div>
												</AnimatePresence>

												<AnimatePresence mode="popLayout">
													{(!chat.states.inputText.inputText.trim() && chat.states.inputMedia.length === 0) || chat.states.isUploading ? (
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
																	chat.actions.handleSend();
																	chat.refs.textareaRef.current?.focus();
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
								{chat.states.activeMenu !== "none" && !chat.states.isFullTextarea && (
									<motion.div
										layout
										initial={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
										animate={{
											height: chat.states.isFullTextarea ? 0 : "12.5rem",
											opacity: chat.states.isFullTextarea ? 0 : 1,
											filter: chat.states.isFullTextarea ? "blur(1rem)" : "blur(0)"
										}}
										exit={{ height: 0, opacity: 0, filter: "blur(1rem)" }}
										transition={{ duration: 0.5, ease: "backOut" }}
										className="size-full flex flex-none justify-start flex-col items-center"
									>
										{chat.states.activeMenu === "plus" &&
											<div className="mt-2 gap-2 flex flex-row justify-center items-center size-full p-4 overflow-x-auto rounded-3xl border-2 border-l5 dark:border-d5 border-dashed colors">
												<Input
													type="file"
													id="file-upload"
													multiple
													onChange={(e) => {
														if (e.target.files) {
															chat.actions.handleUploadAndConvert(e.target.files);
															e.target.value = "";
														}
													}}
												/>

												<AnimatePresence mode="popLayout">
													{chat.states.inputMedia.length > 0 ? (
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
																	{chat.states.inputMedia.map((media) => (
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
																				progress={chat.states.uploadProgress[media.mediumId]}
																			/>

																			<Button
																				onClick={() => chat.actions.handleRemoveMedia(media.mediumId)}
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
																	onClick={chat.actions.handleRemoveAllMedia}
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
											</div>
										}

										{chat.states.activeMenu === "settings" &&
											<div className="gap-2 p-2 flex flex-col justify-start items-center size-full overflow-y-auto">
												<div className="w-full">
													<Slider
														label="丁寧度"
														min={0}
														max={1}
														step={0.25}
														value={settings.states.sliderState.politeness}
														onChange={(e) => settings.actions.updateSlider(Number(e.target.value))}
														marks={[
															{ value: 0 },
															{ value: 0.25, label: "難しい" },
															{ value: 0.50, label: "普通" },
															{ value: 0.75, label: "易しい" },
															{ value: 1 }
														]}
													/>
												</div>

												<div className="grid w-full gap-2 grid-cols-2">
													<Switch
														label="要約"
														checked={settings.states.switchState?.summary}
														onChange={(e) => settings.actions.updateSwitch("summary", e.target.checked)}
													/>

													<Switch
														label="指針"
														checked={settings.states.switchState?.guidance}
														onChange={(e) => settings.actions.updateSwitch("guidance", e.target.checked)}
													/>

													<Switch
														label="解説 "
														checked={settings.states.switchState?.explanation}
														onChange={(e) => settings.actions.updateSwitch("explanation", e.target.checked)}
													/>

													<Switch
														label="解答"
														checked={settings.states.switchState?.answer}
														onChange={(e) => settings.actions.updateSwitch("answer", e.target.checked)}
													/>

												</div>
											</div>
										}
										{chat.states.activeMenu === "list" && <span>List メニューの内容</span>}
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
