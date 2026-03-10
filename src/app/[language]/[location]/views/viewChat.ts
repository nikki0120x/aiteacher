// src/app/[language]/[location]/views/viewChat.ts

import { useRef } from "react";
import {
	useChat,
	useDragAndDrop,
	useInputTextClear,
	usePageTitle,
	useTextarea,
	useVoiceInput,
	useExtensionContent,
	useChatAreaHeight,
} from "@/app/[language]/[location]/hooks/hookChat";

export const useChatView = () => {
	//  ================================================================
	//      Refs
	//  ================================================================

	const dragAndDropTextRef = useRef<HTMLElement>(null);
	const pageTitleTextRef = useRef<HTMLElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const stopListeningButtonRef = useRef<HTMLButtonElement>(null);
	const listInputRef = useRef<HTMLInputElement>(null);

	//  ================================================================
	//      States & Actions
	//  ================================================================

	//  拡張コンテンツ
	const {
		refs: { extensionRefCallback },
		states: { activeContent, contentDirection, extensionHeight },
		actions: { toggleContent, setActiveContent },
	} = useExtensionContent();

	//  全般
	const {
		states: {
			userStatus,
			modelStatus,
			inputText,
			inputMedia,
			uploadProgress,
			isUploading,
			thinkMode,
			chatFlow,
		},
		actions: {
			setUserStatus,
			setModelStatus,
			setInputText,
			setInputMedia,
			handleUploadAndConvert,
			handleRemoveMedia,
			handleRemoveAllMedia,
			handleSend,
			updateThinkMode,
			setChatFlow,
		},
	} = useChat(setActiveContent);

	//  ドラッグアンドドロップ
	const {
		states: { dragInfo },
		actions: { handleDragOver, handleDragEnter, handleDragLeave, handleDrop },
	} = useDragAndDrop(handleUploadAndConvert, dragAndDropTextRef, setActiveContent);

	//  ページタイトル
	usePageTitle(pageTitleTextRef);

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
	} = useTextarea(displayText, textareaRef, activeContent === "none" ? 0 : extensionHeight);

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

	const {
		mainContainerRef,
		inputContainerRef,
		chatAreaHeight,
	} = useChatAreaHeight();

	return {
		refs: {
			extensionRefCallback,
			dragAndDropTextRef,
			pageTitleTextRef,
			textareaRef,
			stopListeningButtonRef,
			listInputRef,
			mainContainerRef,
			inputContainerRef,
		},
		states: {
			userStatus,
			modelStatus,
			inputText,
			inputMedia,
			uploadProgress,
			isUploading,
			dragInfo,
			activeContent,
			contentDirection,
			extensionHeight,
			isListening,
			interimText,
			displayText,
			textareaHeight,
			singleLineHeight,
			isOverLimit,
			isFullTextarea,
			containerHeight,
			thinkMode,
			chatFlow,
			chatAreaHeight,
		},
		actions: {
			setUserStatus,
			setModelStatus,
			setInputText,
			setInputMedia,
			handleSend,
			handleDragOver,
			handleDragEnter,
			handleDragLeave,
			handleDrop,
			handleUploadAndConvert,
			handleRemoveMedia,
			handleRemoveAllMedia,
			toggleContent,
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
			updateThinkMode,
			setChatFlow,
		},
	};
};