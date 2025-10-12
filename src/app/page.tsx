"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore } from "@/stores/useChatStore";
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
    question: [],
    answer: [],
    selfanswer: [],
  });

  const questionInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const selfanswerInputRef = useRef<HTMLInputElement>(null);

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

    addMessage(inputText);
    setActiveContent(null);
    setInputText("");

    const controller = new AbortController();
    useChatStore.getState().setAbortController(controller);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputText }),
        signal: controller.signal,
      });

      const data: { text?: string; error?: string } = await res.json();

      if (!controller.signal.aborted) {
        if (data.text) addMessage(data.text);
      } else if (data.error) {
        addMessage(`Error: ${data.error}`);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (showAbortMessage) addMessage("AIの返答を中止しました");
      } else if (err instanceof Error) {
        addMessage(`Fetch error: ${err.message}`);
      } else {
        addMessage("Fetch error: 不明なエラー");
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
            <div className="flex flex-col">
              {message.map((msg) => (
                <Card
                  key={msg.id}
                  shadow="none"
                  radius="lg"
                  className="rounded-tr-lg w-full h-auto mb-2 bg-light-3 dark:bg-dark-3"
                >
                  <CardBody>
                    <p className="select-text! text-base font-medium text-dark-3 dark:text-light-3">
                      {msg.text}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
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
          className="flex flex-col justify-center items-center w-full h-full"
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
                  className="flex-1 mr-8 bg-dark-5 dark:bg-light-5"
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
                  className="bg-dark-5 dark:bg-light-5"
                />
                <span className="overflow-hidden whitespace-nowrap text-ellipsis text-center underline underline-offset-5 text-xl font-medium text-dark-3 dark:text-light-5">
                  Ver. 1.0.0
                </span>
                <Divider
                  orientation="horizontal"
                  className="flex-1 ml-8 bg-dark-5 dark:bg-light-5"
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
                          animate={{ height: 256 }}
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
                                      {
                                        value: 0.25,
                                        label: "不十分",
                                      },
                                      {
                                        value: 0.5,
                                        label: "普通",
                                      },
                                      {
                                        value: 0.75,
                                        label: "十分",
                                      },
                                    ]}
                                    maxValue={1}
                                    minValue={0}
                                    showSteps={true}
                                    showTooltip={true}
                                    step={0.25}
                                    size="lg"
                                  />
                                  <Slider
                                    className="w-full no-transition"
                                    defaultValue={0.5}
                                    formatOptions={{ style: "percent" }}
                                    label="丁寧度"
                                    size="lg"
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
                                    showSteps={true}
                                    showTooltip={true}
                                    step={0.25}
                                  />
                                </div>
                                <Divider className="bg-gray" />
                                <div className="flex flex-row flex-wrap gap-4">
                                  <Switch defaultSelected isSelected size="lg">
                                    問題
                                  </Switch>
                                  <Switch size="lg">指針</Switch>
                                  <Switch size="lg">解答</Switch>
                                  <Switch size="lg">自己回答</Switch>
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
                                    {/* 問題タブ */}
                                    <Tab
                                      key="question"
                                      title="問題"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="question"
                                        inputRef={questionInputRef}
                                      >
                                        {images.question.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                questionInputRef.current?.click()
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
                                            {images.question.map((src, idx) => (
                                              <Image
                                                key={idx}
                                                src={src}
                                                alt={`uploaded-question-${idx}`} // tabKey を文字列に置き換え
                                                width={128}
                                                height={128}
                                                className="rounded-lg object-cover"
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </DroppableArea>
                                    </Tab>

                                    {/* 解答タブ */}
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

                                    {/* 自己回答タブ */}
                                    <Tab
                                      key="selfanswer"
                                      title="自己回答"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="selfanswer"
                                        inputRef={selfanswerInputRef}
                                      >
                                        {images.selfanswer.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                selfanswerInputRef.current?.click()
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
                                            {images.selfanswer.map(
                                              (src, idx) => (
                                                <Image
                                                  key={idx}
                                                  src={src}
                                                  alt={`uploaded-selfanswer-${idx}`} // tabKey を文字列に置き換え
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
