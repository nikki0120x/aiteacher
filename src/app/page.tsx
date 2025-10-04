"use client";

import React, { useState } from "react";
import { Button, Textarea } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, ImageUp } from "lucide-react";

export default function Home() {
  const [showImageDiv, setShowImageDiv] = useState(false);

  return (
    <>
      <div className="flex justify-center relative w-full h-full">
        <div className="flex flex-col absolute top-[25dvh] px-2 py-2 w-full border-2 rounded-2xl border-gray">
          <div className="flex flex-row">
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
          <div className="flex flex-row gap-2 px-1">
            <Button
              isIconOnly
              radius="full"
              className="text-dark-1 dark:text-light-1 bg-transparent"
              onPress={() => setShowImageDiv(!showImageDiv)}
            >
              <ImageUp />
            </Button>
          </div>
          <AnimatePresence>
            {showImageDiv && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "25dvh" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden transition-none!"
              >
                <div>afsadf</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
