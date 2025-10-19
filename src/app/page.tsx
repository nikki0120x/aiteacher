"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore } from "@/stores/useChatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { DndContext, useDroppable } from "@dnd-kit/core";
import {
  ScrollShadow,
  Spinner,
  Button,
  Textarea,
  Slider,
  Divider,
  Switch,
  Tabs,
  Tab,
  Card,
  CardBody,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import {
  Mic,
  MicOff,
  Settings2,
  ImageUp,
  PanelBottomClose,
  PanelTopClose,
  SendHorizontal,
  Pause,
} from "lucide-react";

export default function Home() {
  const [switchState, setSwitchState] = useState({
    summary: true,
    guidance: false,
    explanation: false,
    answer: false,
  });

  const [sliders, setSliders] = useState({
    understanding: 0.5, // 理解度
    politeness: 0.5, // 丁寧度
  });

  // ---------- 共通状態管理 ---------- //

  const {
    isSent,
    isLoading,
    isPanelOpen,
    activeContent,
    message,
    abortController,
    setIsSent,
    setIsLoading,
    setIsPanelOpen,
    togglePanel,
    setActiveContent,
    addMessage,
    setAbortController,
  } = useChatStore();

  const [images, setImages] = useState<{ [key: string]: string[] }>({
    summary: [],
    explanation: [],
    answer: [],
  });

  const summaryInputRef = useRef<HTMLInputElement>(null);
  const explanationInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (tabKey: string, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => URL.createObjectURL(file));
    setImages((prev) => ({
      ...prev,
      [tabKey]: [...prev[tabKey], ...fileArray],
    }));
  };

  const handleDrop = (
    tabKey: string,
    event: React.DragEvent<HTMLDivElement>
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
    const { setNodeRef } = useDroppable({ id: tabKey });
    return (
      <div
        ref={setNodeRef}
        onDrop={(e) => handleDrop(tabKey, e)}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col justify-center p-2 w-full h-full rounded-2xl border-2 border-dashed border-gray cursor-pointer"
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

    recognition.onresult = (event) => {
      const lastResultIndex = event.results.length - 1;
      const lastResult = event.results[lastResultIndex];

      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        setInputText((prev) => prev + transcript);
      }
    };

    recognition.onerror = (e) => {
      console.error("音声認識エラー:", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (!isListening) {
      recognition.start();
      setIsListening(true);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [hasMounted, setHasMounted] = useState(false);

  // ---------- 送信と応答 ---------- //

  const handleSend = async (showAbortMessage = false) => {
    if (inputText.trim() === "") return;

    setIsLoading(true);
    setIsSent(true);

    // ユーザーメッセージは単純に追加
    addMessage(inputText, "user");
    setActiveContent(null);
    setInputText("");

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inputText,
          options: switchState,
          sliders,
        }),
        signal: controller.signal,
      });

      const data: { text?: string; error?: string } = await res.json();

      if (!controller.signal.aborted) {
        if (data.text) {
          // AI メッセージを追加、ここでその時点の switchState を sectionsState として渡す
          addMessage(data.text, "ai", switchState);
        }
      } else if (data.error) {
        addMessage(`Error: ${data.error}`, "ai", switchState);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (showAbortMessage)
          addMessage("AIの返答を中止しました", "ai", switchState);
      } else if (err instanceof Error) {
        addMessage(`Fetch error: ${err.message}`, "ai", switchState);
      } else {
        addMessage("Fetch error: 不明なエラー", "ai", switchState);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // ---------- フロントエンド ---------- //

  return (
    <>
      <motion.div className="flex flex-col gap-4 w-full h-full relative">
        <motion.div
          initial={{ flex: 0, opacity: 0 }}
          animate={{
            flex: isSent ? 1 : 0,
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
                  className="shadow-2xl text-dark-3 dark:text-light-3 backdrop-blur-xs bg-light-3/50 dark:bg-dark-3/50"
                  onPress={() => setIsPanelOpen(true)}
                >
                  <PanelTopClose />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <ScrollShadow className="w-full h-full">
            <MathJaxContext
              version={3}
              config={{
                loader: { load: ["input/tex", "output/chtml"] },
                tex: {
                  inlineMath: [
                    ["$", "$"],
                    ["\\(", "\\)"],
                  ],
                },
              }}
            >
              <motion.div className="flex flex-col">
                {message.map((msg, idx) => {
                  if (msg.role === "user") {
                    return (
                      <Card
                        key={msg.id}
                        shadow="none"
                        radius="lg"
                        className="rounded-tr-lg w-full h-auto mb-2 bg-light-3 dark:bg-dark-3"
                      >
                        <CardBody>
                          <div className="overflow-x-auto select-text prose dark:prose-invert max-w-full break-words text-xl font-medium text-dark-3 dark:text-light-3">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeMathjax]}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  } else if (msg.role === "ai") {
                    const state = msg.sectionsState ?? switchState; // 保存されていればそれを使う
                    const sections: { title: string; text: string }[] = [];

                    if (state.summary) {
                      const text = msg.text
                        .match(/###\s*要約\s*([\s\S]*?)(?=###|$)/i)?.[1]
                        ?.trim();
                      if (text) sections.push({ title: "要約", text });
                    }

                    if (state.guidance) {
                      const text = msg.text
                        .match(/###\s*指針\s*([\s\S]*?)(?=###|$)/i)?.[1]
                        ?.trim();
                      if (text) sections.push({ title: "指針", text });
                    }

                    if (state.explanation) {
                      const text = msg.text
                        .match(/###\s*解説\s*([\s\S]*?)(?=###|$)/i)?.[1]
                        ?.trim();
                      if (text) sections.push({ title: "解説", text });
                    }

                    if (state.answer) {
                      const text = msg.text
                        .match(/###\s*解答\s*([\s\S]*?)(?=###|$)/i)?.[1]
                        ?.trim();
                      if (text) sections.push({ title: "解答", text });
                    }

                    if (sections.length === 0) return null;

                    return (
                      <Accordion
                        key={msg.id}
                        defaultExpandedKeys={["1"]}
                        selectionMode="multiple"
                        variant="bordered"
                        className="mb-4 border-light-5 dark:border-dark-5 font-medium text-dark-3 dark:text-light-3"
                      >
                        {sections.map((sec, i) => (
                          <AccordionItem key={i} aria-label={sec.title} title={sec.title}>
                            <div className="overflow-x-auto overflow-y-scroll select-text prose dark:prose-invert max-w-full break-words text-lg text-dark-3 dark:text-light-3">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeMathjax]}
                              >
                                {sec.text}
                              </ReactMarkdown>
                            </div>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  }
                })}
              </motion.div>
            </MathJaxContext>
          </ScrollShadow>
        </motion.div>
        <motion.div
          initial={{ flex: 1 }}
          animate={{
            flex: isSent ? 0 : 1,
            height: isPanelOpen ? "auto" : 0,
            opacity: isPanelOpen ? 1 : 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
          className="flex flex-col justify-center items-center relative w-full h-full"
        >
          <AnimatePresence>
            {!isSent && (
              <motion.div
                key="heading"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex flex-row justify-center items-center gap-4 relative bottom-10 w-full"
              >
                <Divider
                  orientation="horizontal"
                  className="hidden lg:flex flex-1 mr-8 bg-dark-5 dark:bg-light-5"
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
                  className="max-h-10 bg-dark-5 dark:bg-light-5"
                />
                <span className="overflow-hidden whitespace-nowrap text-ellipsis text-center text-xl font-medium text-dark-5 dark:text-light-5">
                  Ver. 1.0.0
                </span>
                <Divider
                  orientation="horizontal"
                  className="hidden lg:flex flex-1 ml-8 bg-dark-5 dark:bg-light-5"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col justify-center p-2 w-full border-2 rounded-2xl border-light-5 dark:border-dark-5">
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
                          className="text-dark-3 dark:text-light-3 bg-transparent"
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
                        className="ml-auto text-light-3 bg-red-500"
                        onPress={() => {
                          if (abortController) {
                            abortController.abort();
                            handleSend(true);
                          }
                          setIsLoading(false);
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
                        placeholder="AI に訊きたい問題はある？"
                        className="text-dark-1 dark:text-light-1"
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
                            ? "text-light-3 bg-red-500"
                            : "text-dark-3 dark:text-light-3 bg-transparent"
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
                          className={`text-dark-3 dark:text-light-3 ${
                            activeContent === "sliders"
                              ? "bg-light-3 dark:bg-dark-3"
                              : "bg-transparent"
                          }`}
                          onPress={() =>
                            setActiveContent(
                              activeContent === "sliders" ? null : "sliders"
                            )
                          }
                        >
                          <Settings2 />
                        </Button>
                        <Button
                          aria-label="Image Button"
                          isIconOnly
                          radius="full"
                          className={`text-dark-3 dark:text-light-3 ${
                            activeContent === "images"
                              ? "bg-light-3 dark:bg-dark-3"
                              : "bg-transparent"
                          }`}
                          onPress={() =>
                            setActiveContent(
                              activeContent === "images" ? null : "images"
                            )
                          }
                        >
                          <ImageUp />
                        </Button>
                      </div>
                      <div className="flex flex-row gap-2">
                        {isSent && (
                          <Button
                            aria-label="Close Panel Button"
                            isIconOnly
                            radius="full"
                            className="text-dark-3 dark:text-light-3 bg-transparent"
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
                          className={`${
                            inputText.trim() === ""
                              ? "text-dark-3 dark:text-light-3 bg-light-3 dark:bg-dark-3"
                              : "text-light-3 bg-blue-500"
                          }`}
                          onPress={() => handleSend()}
                          disabled={inputText.trim() === ""}
                        >
                          <SendHorizontal />
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {activeContent && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <ScrollShadow className="w-full h-full">
                            {activeContent === "sliders" && (
                              <div className="flex flex-col gap-8 justify-center p-2">
                                <div className="flex flex-col gap-4">
                                  <Slider
                                    className="w-full"
                                    defaultValue={0.5}
                                    formatOptions={{ style: "percent" }}
                                    label="理解度"
                                    marks={[
                                      { value: 0.25, label: "不十分" },
                                      { value: 0.5, label: "普通" },
                                      { value: 0.75, label: "十分" },
                                    ]}
                                    maxValue={1}
                                    minValue={0}
                                    showSteps
                                    showTooltip
                                    step={0.25}
                                    size="lg"
                                    onChange={(value: number | number[]) => {
                                      // 配列で返る場合があるので number に変換
                                      const numValue = Array.isArray(value)
                                        ? value[0]
                                        : value;
                                      setSliders((prev) => ({
                                        ...prev,
                                        understanding: numValue,
                                      }));
                                    }}
                                  />

                                  <Slider
                                    className="w-full"
                                    defaultValue={0.5}
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
                                </div>
                                <Divider className="bg-gray" />
                                <div className="flex flex-row flex-wrap gap-4">
                                  <Switch
                                    size="lg"
                                    isSelected
                                    onChange={() => {}}
                                  >
                                    要約
                                  </Switch>

                                  <Switch
                                    size="lg"
                                    isSelected={switchState.guidance}
                                    onChange={(
                                      event: React.ChangeEvent<HTMLInputElement>
                                    ) =>
                                      setSwitchState((prev) => ({
                                        ...prev,
                                        guidance: event.target.checked,
                                      }))
                                    }
                                  >
                                    指針
                                  </Switch>

                                  <Switch
                                    size="lg"
                                    isSelected={switchState.explanation}
                                    onChange={(
                                      event: React.ChangeEvent<HTMLInputElement>
                                    ) =>
                                      setSwitchState((prev) => ({
                                        ...prev,
                                        explanation: event.target.checked,
                                      }))
                                    }
                                  >
                                    解説
                                  </Switch>

                                  <Switch
                                    size="lg"
                                    isSelected={switchState.answer}
                                    onChange={(
                                      event: React.ChangeEvent<HTMLInputElement>
                                    ) =>
                                      setSwitchState((prev) => ({
                                        ...prev,
                                        answer: event.target.checked,
                                      }))
                                    }
                                  >
                                    解答
                                  </Switch>
                                </div>
                              </div>
                            )}

                            {activeContent === "images" && (
                              <DndContext>
                                <div className="flex flex-col items-center w-full h-full">
                                  <Tabs
                                    aria-label="Options"
                                    variant="underlined"
                                    size="lg"
                                    radius="full"
                                    fullWidth
                                  >
                                    <Tab
                                      key="summary"
                                      title="要約"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="summary"
                                        inputRef={summaryInputRef}
                                      >
                                        {images.summary.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                summaryInputRef.current?.click()
                                              }
                                            >
                                              画像アップロード
                                            </Button>
                                            <span className="text-lg font-medium text-gray">
                                              ファイルをドラッグ&ドロップ
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-row gap-2 overflow-x-scroll">
                                            {images.summary.map((src, idx) => (
                                              <Image
                                                key={idx}
                                                src={src}
                                                alt={`uploaded-summary-${idx}`} // tabKey を文字列に置き換え
                                                width={128}
                                                height={128}
                                                className="rounded-lg object-cover"
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </DroppableArea>
                                    </Tab>

                                    <Tab
                                      key="explanation"
                                      title="解説"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="selfanswer"
                                        inputRef={explanationInputRef}
                                      >
                                        {images.explanation.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                explanationInputRef.current?.click()
                                              }
                                            >
                                              画像アップロード
                                            </Button>
                                            <span className="text-lg font-medium text-gray">
                                              ファイルをドラッグ&ドロップ
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-row gap-2 overflow-x-scroll">
                                            {images.explanation.map(
                                              (src, idx) => (
                                                <Image
                                                  key={idx}
                                                  src={src}
                                                  alt={`uploaded-explanation-${idx}`} // tabKey を文字列に置き換え
                                                  width={128}
                                                  height={128}
                                                  className="rounded-lg object-cover"
                                                />
                                              )
                                            )}
                                          </div>
                                        )}
                                      </DroppableArea>
                                    </Tab>

                                    <Tab
                                      key="answer"
                                      title="解答"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="answer"
                                        inputRef={answerInputRef}
                                      >
                                        {images.answer.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                answerInputRef.current?.click()
                                              }
                                            >
                                              画像アップロード
                                            </Button>
                                            <span className="text-lg font-medium text-gray">
                                              ファイルをドラッグ&ドロップ
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-row gap-2 overflow-x-scroll">
                                            {images.answer.map((src, idx) => (
                                              <Image
                                                key={idx}
                                                src={src}
                                                alt={`uploaded-answer-${idx}`} // tabKey を文字列に置き換え
                                                width={128}
                                                height={128}
                                                className="rounded-lg object-cover"
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </DroppableArea>
                                    </Tab>
                                  </Tabs>
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
    </>
  );
}
