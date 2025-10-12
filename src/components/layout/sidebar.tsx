"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, easeInOut } from "motion/react";
import { Button } from "@heroui/react";
import { Menu, SquarePen } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false); // Escapeで閉じる
      } else if (e.altKey && e.key.toLowerCase() === "m") {
        setIsOpen((prev) => !prev); // Alt + M でトグル
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <Button
        aria-label="Menu Button"
        isIconOnly
        size="lg"
        radius="full"
        className="fixed top-0 left-0 z-100 m-2 text-dark-3 dark:text-light-3 bg-transparent"
        onPress={() => setIsOpen(!isOpen)}
      >
        <Menu />
      </Button>
      <Button
        aria-label="New Chat Button"
        isIconOnly
        size="lg"
        radius="full"
        className="absolute top-0 right-0 z-100 m-2 text-dark-3 dark:text-light-3 bg-transparent"
      >
        <SquarePen />
      </Button>
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <>
            {isMobile && isOpen && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: easeInOut }}
                onClick={() => setIsOpen(false)}
                className="fixed top-0 left-0 z-80 w-full h-full backdrop-blur-[2px] bg-light-1/50 dark:bg-dark-1/50"
              />
            )}
            <motion.aside
              key="sidebar"
              initial={{ width: isMobile ? 0 : "4rem" }}
              animate={{
                width: isOpen
                  ? isMobile
                    ? "calc(100dvw - 8rem)"
                    : "16rem"
                  : "4rem",
              }}
              exit={{ width: 0 }}
              transition={{ duration: 0.5, ease: easeInOut }}
              className={`
              h-full overflow-hidden bg-light-3 dark:bg-dark-3
              ${isMobile ? "fixed top-0 left-0 z-90" : "relative"}
            `}
            ></motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
