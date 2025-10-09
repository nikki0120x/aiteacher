"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, easeInOut } from "motion/react";
import { Button } from "@heroui/react";
import { Menu } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <Button
        isIconOnly
        size="lg"
        radius="full"
        className="fixed z-100 m-2 bg-transparent"
        onPress={() => setIsOpen(!isOpen)}
      >
        <Menu />
      </Button>
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <>
            {isMobile && isOpen && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed top-0 left-0 z-40 w-full h-full bg-light-1 dark:bg-dark-1"
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
              ${isMobile ? "fixed top-0 left-0 z-50" : "relative"}
            `}
            ></motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
