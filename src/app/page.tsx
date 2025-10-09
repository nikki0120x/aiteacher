"use client";

import React, { useState, useRef } from "react";
import {
  Button,
  Textarea,
  ScrollShadow,
  Slider,
  Divider,
  Switch,
  Tabs,
  Tab,
  Card,
  CardBody,
} from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, useDroppable } from "@dnd-kit/core";
import { Mic, MicOff, Settings2, ImageUp, SendHorizontal } from "lucide-react";

export default function Home() {
  const [activeContent, setActiveContent] = useState<
    "sliders" | "images" | null
  >("sliders");
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

  const [isSent, setIsSent] = useState(false);

  return (
    <>
      <div className="flex flex-col w-full h-full">
        <div className={`flex transition-all duration-500 ${isSent ? "flex-1 opacity-100" : "flex-0 collapse opacity-0"}`}>AIチャットだよー!!</div>
        <div
          className={`flex items-center w-full h-full relative transition-all duration-500 ${
            isSent ? "flex-0" : "flex-1"
          }`}
        >
          <div className="flex flex-col justify-center p-2 w-full border-2 rounded-2xl border-gray">
            <div className="flex flex-row pl-2 pb-2">
              <Textarea
                isRequired
                isClearable
                cacheMeasurements={true}
                minRows={1}
                maxRows={3}
                size="lg"
                variant="underlined"
                validationBehavior="aria"
                placeholder="AI に訊きたいことはある？"
                className="text-dark-1 dark:text-light-1"
              />
              <Button
                aria-label="Mic Button"
                isIconOnly
                radius="full"
                className="text-dark-1 dark:text-light-1 bg-transparent"
              >
                <Mic />
              </Button>
            </div>
            <div className="flex flex-row gap-2 pb-2">
              <Button
                aria-label="Sliders Button"
                isIconOnly
                radius="full"
                className="text-dark-1 dark:text-light-1 bg-transparent"
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
                className="text-dark-1 dark:text-light-1 bg-transparent"
                onPress={() =>
                  setActiveContent(activeContent === "images" ? null : "images")
                }
              >
                <ImageUp />
              </Button>
              <Button
                aria-label="Send Button"
                isIconOnly
                radius="full"
                className="ml-auto text-dark-1 dark:text-light-1 bg-light-3 dark:bg-dark-3"
                onPress={() => setIsSent((prev) => !prev)}
              >
                <SendHorizontal />
              </Button>
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
                            step={0.05}
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
                                label: "易しい",
                              },
                              {
                                value: 0.5,
                                label: "普通",
                              },
                              {
                                value: 0.75,
                                label: "難しい",
                              },
                            ]}
                            maxValue={1}
                            minValue={0}
                            showSteps={true}
                            showTooltip={true}
                            step={0.05}
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
                                      <img
                                        key={idx}
                                        src={src}
                                        className="w-32 h-32 aspect-square object-cover rounded-lg"
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
                                      <img
                                        key={idx}
                                        src={src}
                                        className="w-32 h-32 aspect-square object-cover rounded-lg"
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
                                    {images.selfanswer.map((src, idx) => (
                                      <img
                                        key={idx}
                                        src={src}
                                        className="w-32 h-32 aspect-square object-cover rounded-lg"
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
          </div>
        </div>
      </div>
    </>
  );
}
