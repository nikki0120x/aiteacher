import { useRef } from "react";
import {
	useChat,
	useDragAndDrop,
	useInputTextClear,
	usePageTitle,
	useTextarea,
	useVoiceInput,
	useExtensionMenu,
} from "@/app/[language]/[location]/hooks/hookChat";

export const useChatView = () => {
	//  ================================================================
	//      Refs
	//  ================================================================

	const dragAndDropTextRef = useRef<HTMLElement>(null);
	const pageTitleTextRef = useRef<HTMLElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const stopListeningButtonRef = useRef<HTMLButtonElement>(null);

	//  ================================================================
	//      States & Actions
	//  ================================================================

	//  全般
	const {
		states: {
			userStatus,
			modelStatus,
			inputText,
			inputMedia,
			sliderState,
			switchState,
			turns,

			isSent,
		},
		actions: {
			setUserStatus,
			setModelStatus,
			setInputText,
			setInputMedia,
			setSliderState,
			setSwitchState,
			setQuestionState,
			setTurns,

			handleUploadAndConvert,
			handleSend,
		},
	} = useChat();

	//  ドラッグアンドドロップ
	const {
		states: { dragInfo },
		actions: { handleDragOver, handleDragEnter, handleDragLeave, handleDrop },
	} = useDragAndDrop(handleUploadAndConvert, dragAndDropTextRef);

	//  ページタイトル
	usePageTitle(pageTitleTextRef);

	//  拡張コンテンツ
	const {
		states: { activeMenu },
		actions: { toggleMenu },
	} = useExtensionMenu();

	//  音声入力
	const {
		refs: { interimTextRef, lastClearTimeRef },
		states: { isListening, interimText, displayText },
		actions: {
			setIsListening,
			setInterimText,
			startListening,
			stopListening,
			toggleListening,
			resetListening,
		},
	} = useVoiceInput(inputText, setInputText, textareaRef, stopListeningButtonRef);

	//  テキストエリア
	const {
		states: {
			textareaHeight,
			singleLineHeight,
			isOverLimit,
			isFullTextarea,
			containerHeight,
		},
		actions: {
			setTextareaHeight,
			setSingleLineHeight,
			setIsOverLimit,
			setIsFullTextarea,
		},
	} = useTextarea(displayText, textareaRef, activeMenu !== "none");

	//  入力テキスト削除
	const {
		actions: { handleInputTextClear },
	} = useInputTextClear(
		lastClearTimeRef,
		interimTextRef,
		setInputText,
		setInterimText,
		isListening,
		resetListening,
		textareaRef,
		setIsFullTextarea,
	);

	return {
		refs: {
			dragAndDropTextRef,
			pageTitleTextRef,
			textareaRef,
			stopListeningButtonRef
		},
		states: {
			userStatus,
			modelStatus,
			inputText,
			inputMedia,
			sliderState,
			switchState,
			turns,
			isSent,
			dragInfo,
			activeMenu,
			isListening,
			interimText,
			displayText,
			textareaHeight,
			singleLineHeight,
			isOverLimit,
			isFullTextarea,
			containerHeight,
		},
		actions: {
			setUserStatus,
			setModelStatus,
			setInputText,
			setInputMedia,
			setSliderState,
			setSwitchState,
			setQuestionState,
			setTurns,
			handleSend,
			handleDragOver,
			handleDragEnter,
			handleDragLeave,
			handleDrop,
			handleUploadAndConvert,
			toggleMenu,
			setIsListening,
			setInterimText,
			startListening,
			stopListening,
			toggleListening,
			setTextareaHeight,
			setSingleLineHeight,
			setIsOverLimit,
			setIsFullTextarea,
			handleInputTextClear,
		},
	};
};
