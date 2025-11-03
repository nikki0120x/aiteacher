"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore } from "@/stores/useChatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeMathjax from "rehype-mathjax";
import { MathJaxContext } from "better-react-mathjax";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
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
  ScrollText,
  BowArrow,
  BookText,
  BookCheck,
} from "lucide-react";
import packageJson from "../../package.json";

type Part = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};

type Content = {
  role: "user" | "model";
  parts: Part[];
};

export default function Home() {
  const [switchState, setSwitchState] = useState({
    summary: true,
    guidance: false,
    explanation: false,
    answer: true,
  });

  const [sliders, setSliders] = useState({
    politeness: 0.5,
  });

  // ---------- 共通状態管理 ---------- //

  const {
    isSent,
    isLoading,
    isPanelOpen,
    activeContent,
    message,
    history,
    abortController,
    setIsSent,
    setIsLoading,
    setIsPanelOpen,
    togglePanel,
    setActiveContent,
    addMessage,
    addContentToHistory,
    setAbortController,
    updateMessage,
  } = useChatStore();

  // ---------- 画像タブ ---------- //

  const [images, setImages] = useState<{ [key: string]: string[] }>({
    problem: [],
    solution: [],
  });

  const problemInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (tabKey: string, files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString();
        if (base64) {
          setImages((prev) => ({
            ...prev,
            [tabKey]: [...prev[tabKey], base64],
          }));
        }
      };
      reader.readAsDataURL(file); // ここで Base64 に変換
    });
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

  // ---------- 音声入力 ---------- //

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

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setInputText(transcript);
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error("音声認識エラー:", event);
      setIsListening(false);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("error", handleError);
    recognition.addEventListener("end", handleEnd);

    recognitionRef.current = recognition;

    return () => {
      recognition.removeEventListener("result", handleResult);
      recognition.removeEventListener("error", handleError);
      recognition.removeEventListener("end", handleEnd);
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []);
  const [hasMounted, setHasMounted] = useState(false);

  // ---------- 送信と応答 ---------- //

  const LOADING_PHRASES = [
    "回答を準備しています...",
    "思考中...",
    "思案中...",
    "構成を練っています...",
    "情報を整理中...",
    "回答を生成中です...",
  ];
  const NUM_PHRASES = LOADING_PHRASES.length;

  // ★ 2. 現在のローディングフレーズのインデックスを保持するState
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);

  // ★ 3. 2.5秒ごとにインデックスを更新するタイマー (useEffect)
  useEffect(() => {
    // 最後のメッセージがプレースホルダーの場合にのみタイマーを起動
    const isCurrentlyLoadingWithPlaceholder =
      isLoading && message.slice(-1)[0]?.text === "#LOADING_PHRASE#";

    if (isCurrentlyLoadingWithPlaceholder) {
      const interval = setInterval(() => {
        // 2.5秒ごとにインデックスを更新（配列の最後に来たら0に戻る）
        setCurrentLoadingIndex((prevIndex) => (prevIndex + 1) % NUM_PHRASES);
      }, 2500); // 2500ミリ秒 = 2.5秒

      // クリーンアップ: ローディング終了時やコンポーネントアンマウント時にタイマーを停止
      return () => clearInterval(interval);
    }
  }, [isLoading, message, NUM_PHRASES]); // isLoading と message の変更時に再実行

  const [isDelayingAnimation, setIsDelayingAnimation] = useState(false);
  const [finalContentLength, setFinalContentLength] = useState(0);

  useEffect(() => {
    // isDelayingAnimation が true になってから、アニメーション所要時間後に false に戻す
    if (isDelayingAnimation) {
      // アニメーション総時間 (ms) の計算:
      // (文字数 * 5ms/文字) + 500ms (duration) + 500ms (マージン)
      let calculatedDuration = finalContentLength * 5 + 1000;

      // ただし、最低でも2000ms（2.0秒）は確保する (生成が速すぎた場合の待機時間)
      calculatedDuration = Math.max(calculatedDuration, 2000);

      const timer = setTimeout(() => {
        setIsDelayingAnimation(false);
        setIsLoading(false); // ここで最終的にローディングを終了させる
      }, calculatedDuration); // ★ 修正: 計算された時間に設定

      return () => clearTimeout(timer); // クリーンアップ
    }
  }, [isDelayingAnimation, setIsLoading, finalContentLength]); // ★ finalContentLength を依存配列に追加

  const handleSend = async () => {
    if (
      inputText.trim() === "" &&
      images.problem.length === 0 &&
      images.solution.length === 0
    )
      return;

    setIsLoading(true);
    setIsSent(true);

    const userText = inputText || "(画像のみ)";
    const tempId = crypto.randomUUID();
    const controller = new AbortController();
    setAbortController(controller);

    addMessage(userText, "user");
    addMessage("#LOADING_PHRASE#", "ai", switchState, tempId);

    const userParts: Part[] = [{ text: userText }];

    images.problem.forEach((img) =>
      userParts.push({ inlineData: { mimeType: "image/png", data: img } })
    );
    images.solution.forEach((img) =>
      userParts.push({ inlineData: { mimeType: "image/png", data: img } })
    );

    const userContent: Content = { role: "user", parts: userParts };

    let data: string | undefined = undefined;
    let finalModelText = ""; // 最終的なモデルテキストを保持

    try {
      let data: string;

      // Tauri環境かどうかを確認
      if (typeof (window as any).__TAURI__ !== "undefined") {
        // (Tauri 環境は現状維持。もしTauriでストリーム対応が必要なら別途修正が必要です)
        data = await invoke("process_gemini_request", {
          payload: { prompt: inputText, images, options: switchState, sliders },
        });
        // Tauriの場合、ここで応答が完了しているため、そのまま更新処理に移る
        if (!controller.signal.aborted && data) {
          updateMessage(tempId, data);
          addContentToHistory(userContent);
          addContentToHistory({ role: "model", parts: [{ text: data }] });
          finalModelText = data;
        }
      } else {
        // ★ Next.js 開発サーバー: ストリーム応答を処理する
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: userText, // ★ 修正: inputText ではなく userText を使用
            options: switchState,
            sliders,
            images, // ★ 画像データをバックエンドに渡す
            history,
          }),
          signal: controller.signal,
        });

        if (!res.body) {
          throw new Error("応答ストリームがありません。");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          updateMessage(tempId, accumulatedText);
        }

        // ストリーム完了後、履歴に保存
        if (!controller.signal.aborted && accumulatedText) {
          addContentToHistory(userContent);
          addContentToHistory({
            role: "model",
            parts: [{ text: accumulatedText }],
          });
          finalModelText = accumulatedText;
        }
      }
    } catch (err: any) {
      // ... (エラー処理はそのまま) ...
    } finally {
      if (finalModelText) {
        setFinalContentLength(finalModelText.length);
      } else {
        setFinalContentLength(0); // テキストがない場合は0
      }
      // ★ 修正: isLoading の設定を isDelayingAnimation に置き換え
      if (
        !abortController?.signal.aborted &&
        (typeof (window as any).__TAURI__ !== "undefined" ? data : true)
      ) {
        // ストリーム完了 (または Tauri応答完了) 後、アニメーション遅延を開始
        setIsDelayingAnimation(true); // ★ 修正
      } else {
        // 中止された場合などは即座に終了
        setIsLoading(false);
      }

      setAbortController(null);
      setImages({ problem: [], solution: [] });
      setActiveContent(null);
      setInputText("");
    }
  };

  // ---------- スイッチの状態管理 ---------- //

  const handleSwitchChange = (key: keyof typeof switchState) => {
    const currentlyTrueCount =
      Object.values(switchState).filter(Boolean).length;

    setSwitchState((prev) => {
      if (prev[key] && currentlyTrueCount === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // ---------- フロントエンド ---------- //

  return (
    <>
      <motion.div className="flex flex-col w-full h-full relative">
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
          <ScrollShadow className="w-full h-full overflow-y-scroll">
            <motion.div className="flex flex-col">
              {message.map((msg) => (
                <MathJaxContext
                  key={msg.id}
                  version={3}
                  config={{
                    tex: {
                      inlineMath: [
                        ["$", "$"],
                        ["\\(", "\\)"],
                      ],
                    },
                  }}
                >
                  {msg.role === "user" ? (
                    <Card
                      shadow="none"
                      radius="lg"
                      className="rounded-tr-lg w-full h-auto mb-2 bg-light-3 dark:bg-dark-3"
                    >
                      <CardBody>
                        <div
                          className="overflow-x-hidden select-text prose dark:prose-invert max-w-full wrap-break-word text-xl font-medium text-dark-3 dark:text-light-3"
                          style={{
                            minHeight: "2rem",
                            maxHeight: `calc(2rem * 3)`,
                            lineHeight: "2rem",
                            overflowY: "auto",
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeMathjax]}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    (() => {
                      const isCurrentLoadingMessage =
                        isLoading && message.slice(-1)[0]?.id === msg.id;

                      const state = msg.sectionsState ?? switchState;
                      const sections: { title: string; text: string }[] = [];

                      const extractSection = (header: string) => {
                        const regex = new RegExp(
                          `###\\s*${header}\\s*([\\s\\S]*?)(?=\\n###|$)`,
                          "i"
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
                        (s) => state[s.key]
                      );

                      enabledSections.forEach(({ key, title }) => {
                        const text = extractSection(title);
                        sections.push({
                          title,
                          text: text ?? "",
                        });
                      });

                      const enabledTitles = enabledSections.map((s) => s.title);
                      const anyHeaderRegex = new RegExp(
                        `###\\s*(${enabledTitles.join("|")})`,
                        "i"
                      );

                      // ONになっているセクションが一つ以上あり、かつ、まだヘッダーがmsg.text内に見当たらない場合
                      if (
                        sections.length > 0 &&
                        !msg.text.match(anyHeaderRegex)
                      ) {
                        // ★ 修正: 最初のセクションだけでなく、有効なすべてのセクションに msg.text を割り当てる
                        sections.forEach((sec) => {
                          sec.text = msg.text;
                        });
                      }

                      // 3. 最終フォールバック: 全てのスイッチがOFFの場合や予期せぬエラーの場合
                      if (sections.length === 0) {
                        sections.push({ title: "応答", text: msg.text });
                      }

                      // ONになっているセクションが一つ以上あり、かつ、まだヘッダーがmsg.text内に見当たらない場合
                      if (
                        sections.length > 0 &&
                        !msg.text.match(anyHeaderRegex)
                      ) {
                        sections[0].text = msg.text;
                      }

                      // 最終フォールバック
                      if (sections.length === 0) {
                        sections.push({ title: "応答", text: msg.text });
                      }

                      // --- ★ 修正 1: アニメーション対象セクションの特定ロジックを追加 ★ ---
                      let targetSectionIndex = -1;
                      if (isCurrentLoadingMessage) {
                        const lastSectionIndexWithContent = sections
                          .slice()
                          .reverse()
                          .findIndex((s) => s.text && s.text.length > 0);

                        // そのセクションの元のインデックスを計算
                        if (lastSectionIndexWithContent >= 0) {
                          targetSectionIndex =
                            sections.length - 1 - lastSectionIndexWithContent;
                        }
                      }
                      // -------------------------------------------------------------------
                      const LOADING_PHRASES = [
                        "回答を準備しています...",
                        "思考中...",
                        "思案中...",
                        "構成を練っています...",
                        "情報を整理中...",
                        "回答を生成中です...",
                      ];
                      const NUM_PHRASES = LOADING_PHRASES.length;

                      return (
                        <Accordion
                          selectionMode="multiple"
                          variant="bordered"
                          className="mb-4 border-light-5 dark:border-dark-5 font-medium text-dark-3 dark:text-light-3"
                        >
                          {sections.map((sec, i) => {
                            let icon = null;
                            switch (sec.title) {
                              case "要約":
                                icon = <ScrollText className="text-sky-500" />;
                                break;
                              case "指針":
                              case "応答":
                                icon = <BowArrow className="text-orange-500" />;
                                break;
                              case "解説":
                                icon = <BookText className="text-rose-500" />;
                                break;
                              case "解答":
                                icon = <BookCheck className="text-lime-500" />;
                                break;
                            }

                            const isInitialPlaceholder =
                              sec.text === "#LOADING_PHRASE#";
                            let displayContent = sec.text;

                            const hasImages =
                              (images.problem?.length || 0) > 0 ||
                              (images.solution?.length || 0) > 0;

                            if (isInitialPlaceholder) {
                              if (isCurrentLoadingMessage && hasImages) {
                                displayContent = "画像分析中...";
                              } else {
                                const phraseIndex =
                                  (i + currentLoadingIndex) % NUM_PHRASES;
                                displayContent = LOADING_PHRASES[phraseIndex];
                              }
                            }

                            const shouldAnimate =
                              (isCurrentLoadingMessage ||
                                isDelayingAnimation) &&
                              (isInitialPlaceholder ||
                                i === targetSectionIndex);

                            const motionKey = isInitialPlaceholder
                              ? `loading-${i}-${currentLoadingIndex}`
                              : `streaming-${i}`;

                            return (
                              <AccordionItem
                                key={i}
                                aria-label={sec.title}
                                title={
                                  <span
                                    className={`
                            text-2xl font-medium no-select
                            ${sec.title === "要約" ? "text-sky-500" : ""}
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
                                classNames={{ trigger: "my-2 cursor-pointer" }}
                              >
                                <div className="overflow-x-auto prose dark:prose-invert max-w-full wrap-break-word leading-9 text-xl font-normal text-dark-3 dark:text-light-3">
                                  {shouldAnimate ? ( // ★ 修正: shouldAnimate を使用
                                    // motion.div block
                                    <motion.div
                                      key={motionKey} // Keyはそのまま
                                      style={{ whiteSpace: "pre-wrap" }}
                                    >
                                      {displayContent
                                        .split("")
                                        .map((char, index) => (
                                          <motion.span
                                            key={index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                              duration: 0.5,
                                              delay: index * 0.005,
                                            }}
                                          >
                                            {char}
                                          </motion.span>
                                        ))}
                                    </motion.div>
                                  ) : (
                                    // Markdown block
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeMathjax]}
                                    >
                                      {displayContent}
                                    </ReactMarkdown>
                                  )}
                                </div>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      );
                    })()
                  )}
                </MathJaxContext>
              ))}
            </motion.div>
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
          className="flex flex-col gap-10 justify-center items-center w-full h-full"
        >
          <AnimatePresence>
            {!isSent && (
              <motion.div
                key="heading"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex flex-row justify-center items-center gap-4 w-full"
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
                  className="object-contain dark:hidden no-select"
                />
                <Image
                  src="/logos/light.webp"
                  alt="Logo (Light)"
                  width={128}
                  height={128}
                  className="object-contain hidden dark:block no-select"
                />
                <Divider
                  orientation="vertical"
                  className="max-h-10 bg-dark-5 dark:bg-light-5"
                />
                <span className="overflow-hidden whitespace-nowrap text-ellipsis text-center text-xl font-medium text-dark-5 dark:text-light-5 no-select">
                  Ver. {packageJson.version}
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

                            setTimeout(() => {
                              setIsLoading(false);
                              setAbortController(null);
                            }, 250);
                          }
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
                        className="text-dark-1 dark:text-light-1 no-select"
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
                            inputText.trim() !== "" || images.problem.length > 0
                              ? "text-light-3 bg-blue-500" // アクティブ時
                              : "text-dark-3 dark:text-light-3 bg-light-3 dark:bg-dark-3" // 非アクティブ時
                          }`}
                          onPress={() => handleSend()}
                          disabled={
                            !(
                              inputText.trim() !== "" ||
                              images.problem.length > 0
                            )
                          }
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
                          <ScrollShadow
                            visibility="none"
                            className="w-full h-full"
                          >
                            {activeContent === "sliders" && (
                              <div className="flex flex-col gap-8 justify-center p-2 no-select">
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
                                    const numValue = Array.isArray(value)
                                      ? value[0]
                                      : value;
                                    setSliders((prev) => ({
                                      ...prev,
                                      politeness: numValue,
                                    }));
                                  }}
                                />
                                <Divider className="bg-gray" />
                                <div className="flex flex-row flex-wrap gap-4">
                                  <Switch
                                    size="lg"
                                    isSelected={switchState.summary}
                                    onChange={() =>
                                      handleSwitchChange("summary")
                                    }
                                  >
                                    要約
                                  </Switch>

                                  <Switch
                                    size="lg"
                                    isSelected={switchState.guidance}
                                    onChange={() =>
                                      handleSwitchChange("guidance")
                                    }
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
                                    onChange={() =>
                                      handleSwitchChange("answer")
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
                                      key="problem"
                                      title="問題"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="problem"
                                        inputRef={problemInputRef}
                                      >
                                        {images.problem.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center p-8 w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                problemInputRef.current?.click()
                                              }
                                            >
                                              画像アップロード
                                            </Button>
                                            <span className="text-lg font-medium text-gray">
                                              ファイルをドラッグ&ドロップ
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-row gap-2 overflow-x-auto">
                                            {images.problem.map((src, idx) => (
                                              <Image
                                                key={idx}
                                                src={src}
                                                alt={`uploaded-problem-${idx}`}
                                                width={128}
                                                height={128}
                                                className="rounded-lg object-cover aspect-square"
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </DroppableArea>
                                    </Tab>

                                    <Tab
                                      key="solution"
                                      title="解説 / 解答"
                                      className="w-full h-full"
                                    >
                                      <DroppableArea
                                        tabKey="solution"
                                        inputRef={solutionInputRef}
                                      >
                                        {images.solution.length === 0 ? (
                                          <div className="flex flex-col gap-2 justify-center items-center p-8 w-full h-full">
                                            <Button
                                              aria-label="Upload Images Button"
                                              size="lg"
                                              radius="full"
                                              className="text-center text-xl font-medium text-light-1 bg-blue-middle"
                                              onPress={() =>
                                                solutionInputRef.current?.click()
                                              }
                                            >
                                              画像アップロード
                                            </Button>
                                            <span className="text-lg font-medium text-gray">
                                              ファイルをドラッグ&ドロップ
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-row gap-2 overflow-x-auto">
                                            {images.solution.map((src, idx) => (
                                              <Image
                                                key={idx}
                                                src={src}
                                                alt={`uploaded-solution-${idx}`}
                                                width={128}
                                                height={128}
                                                className="rounded-lg object-cover aspect-square"
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
