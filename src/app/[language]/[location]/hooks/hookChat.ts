import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { v7 as uuidv7 } from "uuid";
import { useTextSplit } from "@/app/[language]/[location]/hooks/hookAnimation";
import {
	type InputText,
	InputTextSchema,
	type MediumList,
	MediumListSchema,
	MediumSchema,
	ChatFlowSchema,
	type ChatFlow,
	type MODEL_STATUS_MAP,
	ModelMessageSchema,
	PageSchema,
	TurnSchema,
	type USER_STATUS_MAP,
	UserMessageSchema,
} from "@/models/modelChat";
import { useAppStore } from "@/stores/storeApp";
import { useLocale } from "next-intl";

//  ================================================================
//      拡張コンテンツ
//  ================================================================

export const useExtensionContent = () => {
	const [activeContent, setActiveContent] = useState<"none" | "upload">("none");
	const [contentDirection, setContentDirection] = useState<number>(0);

	const [extensionHeight, setExtensionHeight] = useState(0);
	const observerRef = useRef<ResizeObserver | null>(null);

	const extensionRefCallback = useCallback((node: HTMLDivElement | null) => {
		if (observerRef.current) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}
		if (node) {
			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const height =
						entry.borderBoxSize?.[0]?.blockSize ??
						entry.target.getBoundingClientRect().height;
					setExtensionHeight(height);
				}
			});
			observer.observe(node);
			observerRef.current = observer;
		} else {
			setExtensionHeight(0);
		}
	}, []);

	const MENU_ORDER = useMemo(() => ["upload"], []);

	const toggleContent = useCallback((menu: "upload") => {
		setActiveContent((prev) => {
			if (prev === menu) {
				setContentDirection(0);
				return "none";
			}

			let newDirection = 0;
			if (prev !== "none") {
				const prevIndex = MENU_ORDER.indexOf(prev);
				const nextIndex = MENU_ORDER.indexOf(menu);
				newDirection = nextIndex > prevIndex ? 1 : -1;
			}

			setContentDirection(newDirection);
			return menu;
		});
	}, [MENU_ORDER]);

	return {
		refs: { extensionRefCallback },
		states: { activeContent, contentDirection, extensionHeight },
		actions: { toggleContent, setActiveContent },
	};
};

//  ================================================================
//      ドラッグアンドドロップ
//  ================================================================

export const useDragAndDrop = (
	onDropCallback: (files: FileList) => void,
	ref: React.RefObject<HTMLElement | null>,
	setActiveMenu?: React.Dispatch<React.SetStateAction<"none" | "upload">>
) => {
	const [dragInfo, setDragInfo] = useState<{
		count: number;
	} | null>(null);
	const dragCounter = useRef(0);
	const { textSplit: splitDragAndDropText } = useTextSplit(ref);

	//  ドラッグ上
	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	//  ドラッグが入る
	const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer.types.includes("Files")) {
			dragCounter.current++;
			const items = Array.from(e.dataTransfer.items);
			const fileItems = items.filter((item) => item.kind === "file");

			setDragInfo({
				count: fileItems.length || e.dataTransfer.files.length || 1,
			});
		}
	}, []);

	//  ドラッグが出る
	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		dragCounter.current--;

		if (dragCounter.current === 0) {
			setDragInfo(null);
		}
	}, []);

	//  ドロップ
	const handleDrop = useCallback(
		async (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();

			setDragInfo(null);

			dragCounter.current = 0;

			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				onDropCallback(e.dataTransfer.files);

				if (setActiveMenu) {
					setActiveMenu("upload");
				}
			}
		},
		[onDropCallback],
	);

	useEffect(() => {
		splitDragAndDropText();
	}, [!!dragInfo, splitDragAndDropText]);

	const actions = useMemo(
		() => ({
			handleDragOver,
			handleDragEnter,
			handleDragLeave,
			handleDrop,
		}),
		[handleDragOver, handleDragEnter, handleDragLeave, handleDrop],
	);

	return {
		states: {
			dragInfo,
		},
		actions,
	};
};

//  ================================================================
//      ページタイトル
//  ================================================================

export const usePageTitle = (ref: React.RefObject<HTMLElement | null>) => {
	const { textSplit } = useTextSplit(ref);

	useEffect(() => {
		textSplit();
	}, [textSplit]);

	return { textSplit };
};

//  ================================================================
//      音声入力
//  ================================================================

export const useVoiceInput = (
	inputText: InputText,
	setInputText: React.Dispatch<React.SetStateAction<InputText>>,
) => {
	const currentLocale = useLocale();
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const interimTextRef = useRef("");
	const isManualStopRef = useRef(false);
	const lastClearTimeRef = useRef<number>(0);

	const [isListening, setIsListening] = useState(false);
	const [interimText, setInterimText] = useState("");

	//	音声認識開始
	const startListening = useCallback(() => {
		if (recognitionRef.current) return;

		const SpeechRecognitionConstructor =
			window.SpeechRecognition || window.webkitSpeechRecognition;

		if (!SpeechRecognitionConstructor) {
			alert(
				"お使いのブラウザは音声認識（SpeechRecognition API）をサポートしていません。",
			);
			return;
		}

		const recognition = new SpeechRecognitionConstructor();
		recognition.lang = currentLocale;
		recognition.continuous = true;
		recognition.interimResults = true;
		isManualStopRef.current = false;

		//	開始
		recognition.onstart = () => {
			if (recognitionRef.current !== recognition) {
				recognition.stop();
				return;
			}

			if (isManualStopRef.current) {
				recognition.stop();
				return;
			}

			setIsListening(true);
		};

		//	終了
		recognition.onend = () => {
			if (recognitionRef.current !== recognition) return;

			if (!isManualStopRef.current) {
				try {
					recognition.start();
					return;
				} catch {
					recognitionRef.current = null;
					interimTextRef.current = "";
					setIsListening(false);
					setInterimText("");
				}
			} else {
				recognitionRef.current = null;
				interimTextRef.current = "";
				setIsListening(false);
				setInterimText("");
			}
		};

		//  失敗
		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			if (recognitionRef.current !== recognition) return;
			if (event.error === "aborted") return;

			recognitionRef.current = null;
			interimTextRef.current = "";
			setIsListening(false);
			setInterimText("");
		};

		//	結果
		recognition.onresult = (event: SpeechRecognitionEvent) => {
			if (recognitionRef.current !== recognition) return;
			if (Date.now() < lastClearTimeRef.current) return;

			let finalTranscript = "";
			let interimTranscript = "";

			for (let i = event.resultIndex; i < event.results.length; i++) {
				const text = event.results[i][0].transcript;

				if (event.results[i].isFinal) {
					finalTranscript += text;
				} else {
					interimTranscript += text;
				}
			}

			if (finalTranscript) {
				setInputText((prev) => ({
					...prev,
					inputText: prev.inputText + finalTranscript,
				}));
			}

			interimTextRef.current = interimTranscript;
			setInterimText(interimTranscript);
		};

		recognition.start();
		recognitionRef.current = recognition;
	}, [currentLocale, setInputText]);

	//	音声認識停止
	const stopListening = useCallback(() => {
		isManualStopRef.current = true;
		setIsListening(false);

		if (recognitionRef.current) {
			recognitionRef.current.stop();
		}
	}, []);

	//	音声認識切替
	const toggleListening = useCallback(() => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	}, [isListening, stopListening, startListening]);

	//	音声認識初期化
	const resetListening = useCallback(() => {
		if (recognitionRef.current) {
			recognitionRef.current.abort();
		}
	}, []);

	//	表示用テキスト
	const displayText = useMemo(
		() => inputText.inputText + interimText,
		[inputText.inputText, interimText],
	);

	const actions = useMemo(
		() => ({
			setIsListening,
			setInterimText,
			startListening,
			stopListening,
			toggleListening,
			resetListening,
		}),
		[startListening, stopListening, toggleListening, resetListening],
	);

	return {
		refs: {
			interimTextRef,
			lastClearTimeRef,
		},
		states: {
			isListening,
			interimText,
			displayText,
		},
		actions,
	};
};

//  ================================================================
//      テキストエリア
//  ================================================================

export const useTextarea = (
	displayText: string,
	ref: React.RefObject<HTMLTextAreaElement | null>,
	extensionHeight: number
) => {
	const [textareaHeight, setTextareaHeight] = useState<number | string>("auto");
	const [singleLineHeight, setSingleLineHeight] = useState<number>(0);
	const [isOverLimit, setIsOverLimit] = useState(false);
	const [isFullTextarea, setIsFullTextarea] = useState(false);

	useLayoutEffect(() => {
		const textarea = ref.current;

		if (!textarea) return;

		textarea.style.height = "auto";

		const currentScrollHeight = textarea.scrollHeight;

		if (singleLineHeight === 0) {
			setSingleLineHeight(textarea.offsetHeight);
		}

		const maxHeight = singleLineHeight > 0 ? singleLineHeight * 5 : Infinity;
		const overLimit = currentScrollHeight > maxHeight;

		setIsOverLimit(overLimit);

		if (isFullTextarea) {
			textarea.style.height = "100%";

			setTextareaHeight("100%");
		} else {
			const finalHeight = overLimit ? maxHeight : currentScrollHeight;

			textarea.style.height = `${finalHeight}px`;

			setTextareaHeight(finalHeight);
		}
	}, [displayText, isFullTextarea]);

	//	質問欄の高さ
	const containerHeight = useMemo(() => {
		if (isFullTextarea) return "90%";

		const textareaSpace =
			typeof textareaHeight === "number" ? textareaHeight : 0;

		const BLANK_SPACE = 98 + extensionHeight;

		if (textareaSpace > 0) {
			return textareaSpace + BLANK_SPACE;
		}

		return "auto";
	}, [isFullTextarea, textareaHeight, extensionHeight]);

	const actions = useMemo(
		() => ({
			setTextareaHeight,
			setSingleLineHeight,
			setIsOverLimit,
			setIsFullTextarea,
		}),
		[],
	);

	return {
		states: {
			textareaHeight,
			singleLineHeight,
			isOverLimit,
			isFullTextarea,

			containerHeight,
		},
		actions,
	};
};

//  ================================================================
//      入力テキスト削除
//  ================================================================

export const useInputTextClear = (
	lastClearTimeRef: React.RefObject<number>,
	interimTextRef: React.RefObject<string>,

	setInputText: React.Dispatch<React.SetStateAction<InputText>>,
	setInterimText: React.Dispatch<React.SetStateAction<string>>,

	isListening: boolean,
	resetListening: () => void,

	textareaRef?: React.RefObject<HTMLTextAreaElement | null>,
	setIsFullTextarea?: React.Dispatch<React.SetStateAction<boolean>>,
) => {
	//	入力テキスト削除
	const handleInputTextClear = useCallback(() => {
		lastClearTimeRef.current = Date.now();
		interimTextRef.current = "";

		setInputText(InputTextSchema.createDefault());
		setInterimText("");

		if (isListening) {
			resetListening();
		}

		if (textareaRef?.current) {
			textareaRef.current.focus();
		}

		if (setIsFullTextarea) {
			setIsFullTextarea(false);
		}
	}, [
		lastClearTimeRef,
		interimTextRef,
		setInputText,
		setInterimText,
		isListening,
		resetListening,
		textareaRef,
		setIsFullTextarea,
	]);

	return {
		states: {},
		actions: {
			handleInputTextClear,
		},
	};
};

// hookChat.ts

export const useChatAreaHeight = () => {
	const mainContainerRef = useRef<HTMLDivElement>(null);
	const inputContainerRef = useRef<HTMLDivElement>(null);
	const [chatAreaHeight, setChatAreaHeight] = useState<number>(0);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastHeightRef = useRef<number>(0);

	useLayoutEffect(() => {
		const mainEl = mainContainerRef.current;
		const inputEl = inputContainerRef.current;
		if (!mainEl || !inputEl) return;

		const observer = new ResizeObserver(() => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);

			timeoutRef.current = setTimeout(() => {
				const mainHeight = mainEl.getBoundingClientRect().height;
				const inputHeight = inputEl.getBoundingClientRect().height;

				const calculatedHeight = mainHeight - inputHeight - 16;
				const finalHeight = calculatedHeight > 0 ? calculatedHeight : 0;

				if (Math.abs(lastHeightRef.current - finalHeight) < 5) return;

				lastHeightRef.current = finalHeight;
				setChatAreaHeight(finalHeight);
			}, 100);
		});

		observer.observe(mainEl);
		observer.observe(inputEl);

		return () => {
			observer.disconnect();
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	return { mainContainerRef, inputContainerRef, chatAreaHeight };
};

//  ================================================================
//      チャット
//  ================================================================

export const useChat = (
	setActiveContent?: React.Dispatch<React.SetStateAction<"none" | "upload">>
) => {
	const chatResetSignal = useAppStore((state) => state.chatResetSignal);

	useEffect(() => {
		if (chatResetSignal > 0) {
			setChatFlow(ChatFlowSchema.createDefault());
			setInputText(InputTextSchema.createDefault());
			setInputMedia(MediumListSchema.createDefault());
			setUploadProgress({});
			setUserStatus("pending");
			setModelStatus("pending");
			if (setActiveContent) {
				setActiveContent("none");
			}
		}
	}, [chatResetSignal, setActiveContent]);
	
	const [userStatus, setUserStatus] = useState<keyof typeof USER_STATUS_MAP>("pending");
	const [modelStatus, setModelStatus] = useState<keyof typeof MODEL_STATUS_MAP>("pending");

	const [chatFlow, setChatFlow] = useState<ChatFlow>(ChatFlowSchema.createDefault());

	const [inputText, setInputText] = useState<InputText>(InputTextSchema.createDefault());
	const [inputMedia, setInputMedia] = useState<MediumList>(MediumListSchema.createDefault());

	const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
	const [thinkMode, setThinkMode] = useState<"fast" | "standard" | "think">("fast");

	const updateThinkMode = useCallback((mode: "fast" | "standard" | "think") => {
		setThinkMode(mode);
	}, []);

	const isUploading = useMemo(() => {
		return inputMedia.some(
			(m) =>
				m.src.startsWith("blob:") ||
				(uploadProgress[m.mediumId] !== undefined && uploadProgress[m.mediumId] < 100)
		);
	}, [inputMedia, uploadProgress]);

	// 転送と変換
	const handleUploadAndConvert = useCallback(async (files: FileList | null) => {
		if (!files) return;
		const fileArray = Array.from(files);

		const initialMedia = fileArray.map((file) => {
			const tempId = uuidv7();
			const localUrl = URL.createObjectURL(file);
			return {
				id: tempId,
				file: file,
				localUrl: localUrl,
				medium: MediumSchema.parse({
					...MediumSchema.createDefault(),
					mediumId: tempId,
					src: localUrl,
					fileName: file.name,
					mimeType: file.type,
					size: file.size,
				}),
			};
		});
		setInputMedia((prev) => [...prev, ...initialMedia.map((m) => m.medium)]);
		setUploadProgress((prev) => {
			const newProg = { ...prev };
			for (const m of initialMedia) newProg[m.id] = 0;
			return newProg;
		});

		await Promise.all(
			initialMedia.map(async ({ id, file, localUrl }) => {
				const uploadWithXHR = () =>
					new Promise<{ url: string }>((resolve, reject) => {
						const xhr = new XMLHttpRequest();
						xhr.open("POST", `/api/upload?filename=${encodeURIComponent(file.name)}`);

						xhr.upload.onprogress = (event) => {
							if (event.lengthComputable) {
								const percentComplete = (event.loaded / event.total) * 100;
								setUploadProgress((prev) => ({ ...prev, [id]: percentComplete }));
							}
						};

						xhr.onload = () => {
							if (xhr.status >= 200 && xhr.status < 300) {
								resolve(JSON.parse(xhr.responseText));
							} else {
								reject(new Error("Upload failed"));
							}
						};

						xhr.onerror = () => reject(new Error("Network Error"));
						xhr.send(file);
					});

				try {
					const newBlob = await uploadWithXHR();

					setInputMedia((prev) =>
						prev.map((m) => (m.mediumId === id ? { ...m, src: newBlob.url } : m))
					);
					setUploadProgress((prev) => ({ ...prev, [id]: 100 }));
					URL.revokeObjectURL(localUrl);
				} catch (error) {
					console.error("Upload failed for", file.name, error);
					setInputMedia((prev) => prev.filter((m) => m.mediumId !== id));
					setUploadProgress((prev) => {
						const newProg = { ...prev };
						delete newProg[id];
						return newProg;
					});
					URL.revokeObjectURL(localUrl);
				}
			})
		);
	}, []);

	//	メディア削除
	const handleRemoveMedia = useCallback((targetId: string) => {
		setInputMedia((prev) => {
			const targetMedia = prev.find((m) => m.mediumId === targetId);
			if (targetMedia?.src.startsWith("http")) {
				fetch(`/api/upload?url=${encodeURIComponent(targetMedia.src)}`, {
					method: "DELETE",
				}).catch(console.error);
			}
			return prev.filter((m) => m.mediumId !== targetId);
		});
		setUploadProgress((prev) => {
			const newProg = { ...prev };
			delete newProg[targetId];
			return newProg;
		});
	}, []);

	// 全メディア削除
	const handleRemoveAllMedia = useCallback(() => {
		setInputMedia((prev) => {
			for (const media of prev) {
				if (media.src.startsWith("http")) {
					fetch(`/api/upload?url=${encodeURIComponent(media.src)}`, {
						method: "DELETE",
					}).catch(console.error);
				}
			}
			return MediumListSchema.createDefault();
		});
		setUploadProgress({});
	}, []);

	// 送信
	const handleSend = useCallback(async () => {
		if (!inputText.inputText && inputMedia.length === 0) return;
		if (isUploading) return;

		if (setActiveContent) {
			setActiveContent("none");
		}

		setUserStatus("sending");
		setModelStatus("thinking");

		const currentText = inputText.inputText;
		const currentMedia = inputMedia.map(m => ({ url: m.src, mimeType: m.mimeType }));

		const initialUserMessage = {
			...UserMessageSchema.createDefault(),
			blocks: [{ type: "text" as const, content: currentText }],
			media: inputMedia,
			status: "completed" as const,
			timestampAt: Date.now()
		};

		const newTurn = {
			...TurnSchema.createDefault(),
			title: currentText.slice(0, 20) || "新しい会話",
			pages: [{
				...PageSchema.createDefault(),
				pageIndex: 0,
				messages: {
					user: initialUserMessage,
					model: []
				},
				timestampAt: Date.now()
			}]
		};

		setChatFlow((prev) => ({
			...prev,
			turns: [...prev.turns, newTurn],
			activeTurnId: newTurn.turnId,
			modifiedAt: Date.now(),
		}));

		setInputText(InputTextSchema.createDefault());
		setInputMedia(MediumListSchema.createDefault());

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mode: thinkMode,
					text: currentText,
					media: currentMedia,
					turnId: newTurn.turnId
				}),
			});

			if (!response.body) throw new Error("No response body");

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let accumulatedText = "";
			let lastCompletedCount = 0;

			while (true) {
				const { done, value } = await reader.read();

				if (value) {
					accumulatedText += decoder.decode(value, { stream: true });
				}

				const splitTexts = accumulatedText.split(/(?=# Problem|# Error)/g);

				let validTexts = splitTexts.filter(t => t.trim().startsWith("# Problem") || t.trim().startsWith("# Error"));

				if (done && validTexts.length === 0 && accumulatedText.trim() !== "") {
					validTexts = [`# Error\n${accumulatedText.trim()}`];
				}

				const completedTexts = done
					? validTexts
					: validTexts.slice(0, Math.max(0, validTexts.length - 1));

				if (completedTexts.length > lastCompletedCount || done) {
					lastCompletedCount = completedTexts.length;

					const newPages = completedTexts.length === 0
						? [{
							...PageSchema.createDefault(),
							pageIndex: 0,
							messages: {
								user: initialUserMessage,
								model: []
							},
							timestampAt: Date.now()
						}]
						: completedTexts.map((text, index) => {
							return {
								...PageSchema.createDefault(),
								pageIndex: index,
								messages: {
									user: initialUserMessage,
									model: [
										{
											...ModelMessageSchema.createDefault(),
											blocks: [{ type: "text" as const, content: text.trim() }],
											status: "completed" as const,
											timestampAt: Date.now()
										}
									]
								},
								timestampAt: Date.now()
							};
						});

					setChatFlow((prev) => {
						const updatedTurns = prev.turns.map((turn) => {
							if (turn.turnId === newTurn.turnId) {
								return {
									...turn,
									pages: newPages,
									activePageIndex: 0,
									modifiedAt: Date.now()
								};
							}
							return turn;
						});

						return {
							...prev,
							turns: updatedTurns,
							modifiedAt: Date.now()
						};
					});
				}

				if (done) break;
			}

			setModelStatus("completed");
			setUserStatus("completed");

		} catch (error) {
			console.error("Chat error:", error);
			setModelStatus("failed");
			setUserStatus("failed");
		}

	}, [
		inputText,
		inputMedia,
		isUploading,
		thinkMode,
		setActiveContent
	]);

	const handleSolve = useCallback(async (problemText: string, turnId: string) => {
		setUserStatus("sending");
		setModelStatus("thinking");

		// 元のターンから画像（media）を取得する
		const targetTurn = chatFlow.turns.find(t => t.turnId === turnId);
		const originalMedia = targetTurn?.pages[0]?.messages.user?.media || [];
		const mediaToSend = originalMedia.map(m => ({ url: m.src, mimeType: m.mimeType }));

		// 新しいターンとしてチャットを追加
		const initialUserMessage = {
			...UserMessageSchema.createDefault(),
			blocks: [{ type: "text" as const, content: problemText }], // ユーザーの入力は選択した問題文
			media: originalMedia, // UI表示用に画像も引き継ぐ
			status: "completed" as const,
			timestampAt: Date.now()
		};

		const newTurn = {
			...TurnSchema.createDefault(),
			title: "solve_request", // 解答ターンの目印
			pages: [{
				...PageSchema.createDefault(),
				pageIndex: 0,
				messages: { user: initialUserMessage, model: [] },
				timestampAt: Date.now()
			}]
		};

		setChatFlow((prev) => ({
			...prev,
			turns: [...prev.turns, newTurn],
			activeTurnId: newTurn.turnId,
			modifiedAt: Date.now(),
		}));

		if (setActiveContent) setActiveContent("none");

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mode: thinkMode,
					text: problemText,
					media: mediaToSend, // ここで元の画像をAPIに送る！
					action: "solve",
					turnId: newTurn.turnId
				}),
			});

			if (!response.body) throw new Error("No response body");

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let accumulatedText = "";

			while (true) {
				const { done, value } = await reader.read();
				if (value) {
					accumulatedText += decoder.decode(value, { stream: true });

					// 解答は分割せず、そのまま1つのテキストブロックとしてストリーミング
					setChatFlow((prev) => {
						const updatedTurns = prev.turns.map((turn) => {
							if (turn.turnId === newTurn.turnId) {
								return {
									...turn,
									pages: [{
										...turn.pages[0],
										messages: {
											...turn.pages[0].messages,
											model: [{
												...ModelMessageSchema.createDefault(),
												blocks: [{ type: "text" as const, content: accumulatedText }],
												status: "completed" as const,
												timestampAt: Date.now()
											}]
										}
									}],
									modifiedAt: Date.now()
								};
							}
							return turn;
						});
						return { ...prev, turns: updatedTurns, modifiedAt: Date.now() };
					});
				}
				if (done) break;
			}

			setModelStatus("completed");
			setUserStatus("completed");

		} catch (error) {
			console.error("Chat error:", error);
			setModelStatus("failed");
			setUserStatus("failed");
		}
	}, [chatFlow.turns, thinkMode, setActiveContent]);

	const actions = useMemo(() => ({
		setUserStatus, setModelStatus, setInputText, setInputMedia, setChatFlow,
		handleUploadAndConvert, handleRemoveMedia, handleRemoveAllMedia, handleSend, handleSolve, updateThinkMode,
	}), [handleUploadAndConvert, handleRemoveMedia, handleRemoveAllMedia, handleSend, handleSolve, updateThinkMode]);

	return {
		states: { userStatus, modelStatus, inputText, inputMedia, chatFlow, uploadProgress, isUploading, thinkMode },
		actions,
	};
};