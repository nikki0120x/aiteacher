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
	type MODEL_STATUS_MAP,
	ModelMessageSchema,
	PageSchema,
	QuestionSchema,
	type QuestionState,
	QuestionStateSchema,
	type SliderState,
	SliderStateSchema,
	type SwitchState,
	SwitchStateSchema,
	type TurnList,
	TurnListSchema,
	TurnSchema,
	type USER_STATUS_MAP,
	UserMessageSchema,
} from "@/models/modelChat";
import { useLocale } from "next-intl";

//  ================================================================
//      拡張コンテンツ
//  ================================================================

export const useExtensionMenu = () => {
	const [activeMenu, setActiveMenu] = useState<"none" | "plus" | "settings" | "list">("none");

	const toggleMenu = useCallback((menu: "plus" | "settings" | "list") => {
		setActiveMenu((prev) => (prev === menu ? "none" : menu));
	}, []);

	return {
		states: { activeMenu },
		actions: { toggleMenu, setActiveMenu },
	};
};

//  ================================================================
//      ドラッグアンドドロップ
//  ================================================================

export const useDragAndDrop = (
	onDropCallback: (files: FileList) => void,
	ref: React.RefObject<HTMLElement | null>,
	setActiveMenu?: React.Dispatch<React.SetStateAction<"none" | "plus" | "settings" | "list">>
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
					setActiveMenu("plus");
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
	textareaRef?: React.RefObject<HTMLTextAreaElement | null>,
	stopListeningButtonRef?: React.RefObject<HTMLButtonElement | null>,
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

	useLayoutEffect(() => {
		if (isListening) {
			stopListeningButtonRef?.current?.focus();
		} else {
			textareaRef?.current?.focus();
		}
	}, [isListening, stopListeningButtonRef, textareaRef]);

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
	isExtensionOpen: boolean
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

		const BLANK_SPACE = 98 + (isExtensionOpen ? 200 : 0);

		if (textareaSpace > 0) {
			return textareaSpace + BLANK_SPACE;
		}

		return "auto";
	}, [isFullTextarea, textareaHeight, isExtensionOpen]);

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

//  ================================================================
//      チャット
//  ================================================================

export const useChat = () => {
	const [userStatus, setUserStatus] =
		useState<keyof typeof USER_STATUS_MAP>("pending");
	const [modelStatus, setModelStatus] =
		useState<keyof typeof MODEL_STATUS_MAP>("pending");
	const [inputText, setInputText] = useState<InputText>(
		InputTextSchema.createDefault(),
	);
	const [inputMedia, setInputMedia] = useState<MediumList>(
		MediumListSchema.createDefault(),
	);
	const [sliderState, setSliderState] = useState<SliderState>(
		SliderStateSchema.createDefault(),
	);
	const [switchState, setSwitchState] = useState<SwitchState>(
		SwitchStateSchema.createDefault(),
	);
	const [questionState, setQuestionState] = useState<QuestionState>(
		QuestionStateSchema.createDefault(),
	);
	const [turns, setTurns] = useState<TurnList>(TurnListSchema.createDefault());

	const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

	const isUploading = useMemo(() => {
		return inputMedia.some((m) => uploadProgress[m.mediumId] !== undefined && uploadProgress[m.mediumId] < 100);
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
			if (targetMedia && targetMedia.src.startsWith("http")) {
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

	//	送信か
	const isSent = useMemo(() => turns.length > 0, [turns]);

	// 送信
	const handleSend = useCallback(() => {
		if (!inputText.inputText && inputMedia.length === 0) return;
		if (isUploading) return;

		setUserStatus("sending");
		setModelStatus("thinking");

		const userMessage = UserMessageSchema.parse({
			...UserMessageSchema.createDefault(),
			userMessageId: uuidv7(),
			blocks: [
				...(inputText.inputText
					? [{ type: "text" as const, content: inputText.inputText }]
					: []),
				...inputMedia.map((m) => ({
					type: "medium" as const,
					content: m.mediumId,
				})),
			],
			media: inputMedia,
			status: "sending" as const,
			size:
				new Blob([inputText.inputText]).size +
				inputMedia.reduce((sum, m) => sum + m.size, 0),
		});

		const modelMessage = ModelMessageSchema.parse({
			...ModelMessageSchema.createDefault(),
			modelMessageId: uuidv7(),
			sliderState: sliderState,
			switchState: switchState,
			questionState: questionState,
			status: "thinking",
		});

		const question = QuestionSchema.parse({
			...QuestionSchema.createDefault(),
			messages: {
				user: userMessage,
				model: [modelMessage],
			},
		});

		const page = PageSchema.parse({
			...PageSchema.createDefault(),
			questions: [question],
		});

		const turn = TurnSchema.parse({
			...TurnSchema.createDefault(),
			turnId: uuidv7(),
			pages: [page],
		});

		setTurns((prev) => [...prev, turn]);
		setInputText(InputTextSchema.createDefault());
		setInputMedia(MediumListSchema.createDefault());
	}, [inputText, inputMedia, sliderState, switchState, questionState]);

	const actions = useMemo(
		() => ({
			setUserStatus,
			setModelStatus,
			setInputText,
			setInputMedia,
			setSliderState,
			setSwitchState,
			setQuestionState,
			setTurns,
			handleUploadAndConvert,
			handleRemoveMedia,
			handleRemoveAllMedia,
			handleSend,
		}),
		[handleUploadAndConvert, handleRemoveMedia, handleRemoveAllMedia, handleSend],
	);

	return {
		states: {
			userStatus,
			modelStatus,
			inputText,
			inputMedia,
			sliderState,
			switchState,
			turns,
			uploadProgress,
			isUploading,
			isSent,
		},
		actions,
	};
};
