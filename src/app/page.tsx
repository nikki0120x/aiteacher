"use client";

import React, { useState } from "react";
import { Button, Textarea, Slider, Divider, Switch } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Settings2, ImageUp } from "lucide-react";

export default function Home() {
  const [activeContent, setActiveContent] = useState<
    "sliders" | "images" | null
  >(null);

  return (
    <>
      <div className="flex justify-center relative w-full h-full">
        <div className="flex flex-col p-2 absolute top-[25dvh] w-full border-2 rounded-2xl border-gray">
          <div className="flex flex-row pl-2 pb-2">
            <Textarea
              isRequired
              isClearable
              cacheMeasurements={true}
              minRows={1}
              maxRows={5}
              size="lg"
              variant="underlined"
              validationBehavior="aria"
              placeholder="AI に訊きたいことはある？"
              className="text-dark-1 dark:text-light-1"
            />
            <Button
              isIconOnly
              radius="full"
              className="text-dark-1 dark:text-light-1 bg-transparent"
            >
              <Mic />
            </Button>
          </div>
          <div className="flex flex-row gap-2 pb-2">
            <Button
              isIconOnly
              radius="full"
              className="text-dark-1 dark:text-light-1 bg-transparent"
              onPress={() =>
                setActiveContent(activeContent === "sliders" ? null : "sliders")
              }
            >
              <Settings2 />
            </Button>
            <Button
              isIconOnly
              radius="full"
              className="text-dark-1 dark:text-light-1 bg-transparent"
              onPress={() =>
                setActiveContent(activeContent === "images" ? null : "images")
              }
            >
              <ImageUp />
            </Button>
          </div>
          <AnimatePresence>
            {activeContent && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "25dvh" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden overflow-y-auto transition-none!"
              >
                {activeContent === "sliders" && (
                  <div className="flex flex-col gap-8 justify-center p-2">
                    <div className="flex flex-col gap-4">
                      <Slider
                        className="w-full no-transition"
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
                  <div>画像アップロード用のコンテンツがここに入ります</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
