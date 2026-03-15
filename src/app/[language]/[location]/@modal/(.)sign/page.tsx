"use client";
import { X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { Sign } from "@/components/app/auth/sign";
import { Button } from "@/components/ui";
import { useRouter } from "@/i18n/routing";

export default function SignModal() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(true);

    //  モーダルを閉じる
    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="flex select-none items-center justify-center size-full absolute inset-0">
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0, pointerEvents: "none" }}
                        animate={{ opacity: 1, pointerEvents: "auto" }}
                        exit={{ opacity: 0, pointerEvents: "none" }}
                        transition={{ duration: 0.5, ease: "backOut" }}
                        className="colors absolute inset-0 z-1000 flex size-full items-center justify-center bg-l1/50 backdrop-blur-lg dark:bg-d1/50"
                    />
                )}
            </AnimatePresence>

            <LayoutGroup>
                <AnimatePresence mode="popLayout" onExitComplete={() => router.back()}>
                    {isModalOpen && (
                        <motion.div
                            layout
                            initial={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
                            exit={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
                            transition={{ duration: 0.5, ease: "backOut" }}
                            style={{ originY: 0 }}
                            className="p-2 colors absolute z-1000 flex lg:w-md max-lg:w-full max-h-[calc(100%-1rem)] lg:m-auto lg:h-fit max-lg:bottom-0 flex-col items-center justify-center lg:rounded-4xl max-lg:rounded-t-4xl lg:border max-lg:border-t border-l5 bg-l1 shadow-lg dark:border-d5 dark:bg-d1"
                        >
                            <motion.div layout transition={{ duration: 0.5, ease: "backOut" }} className="flex w-full flex-row items-center justify-between p-2">
                                <div className="flex size-10 items-center justify-center rounded-full" />

                                <Image
                                    src="/images/logos/webp/Logo_FoCalrina_small_theme.webp"
                                    alt="The FoCarina Logo"
                                    width={160}
                                    height={40}
                                    priority
                                    className="w-30 h-10 object-contain"
                                />

                                <Button
                                    onClick={handleModalClose}
                                    className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
                                >
                                    <X className="all text-d1 dark:text-l1" />
                                </Button>
                            </motion.div>

                            <Sign />
                        </motion.div>
                    )}
                </AnimatePresence>
            </LayoutGroup>
        </div>
    )
}