/* src\features\auth\components\auth-modal.tsx */
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, easeInOut } from "motion/react";
import { useAuthStore } from "@/stores/useAuth";

export default function AuthModal() {
    const { isModalOpen, closeModal } = useAuthStore();

    return (
        <div className="no-select">
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        key="auth-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: easeInOut }}
                        onClick={closeModal}
                        className="fixed top-0 left-0 z-500 flex justify-center items-center w-full h-full backdrop-blur-[2px] bg-ld/50"
                    >
                        <motion.div
                            key="auth-modal"
                            initial={{ translateY: 50 }}
                            animate={{ translateY: 0 }}
                            exit={{ translateY: -50 }}
                            transition={{ duration: 0.5, ease: easeInOut }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-md h-140 rounded-4xl bg-l2 dark:bg-d2"
                        >
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}