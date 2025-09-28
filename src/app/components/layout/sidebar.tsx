"use client";
import { useState, useEffect  } from "react";
import { useTheme } from "next-themes";
import RoutineIcon from "@/assets/icons/theme/routine.svg";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Sidebarの開閉状態を管理する状態変数
  const [themeMenu, setThemeMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <aside
        className={`z-1000 flex flex-col gap-4 p-2 w-auto h-dvh bg-light-3 dark:bg-dark-3`}
        style={{ width: isOpen ? "16rem" : "4rem" }}
      >
        <button
          className="w-full h-12 rounded-full bg-gray"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Close" : "Open"}
        </button>
        <button
          className={`mt-auto flex flex-row items-center w-full h-12 rounded-full bg-light-3 dark:bg-dark-3 hover:bg-light-4 hover:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4 ${
            isOpen ? "gap-2" : "gap-0"
          }`}
          onClick={() => setThemeMenu(!themeMenu)}
        >
          <RoutineIcon className="p-3 w-12 h-full text-dark-3 dark:text-light-3" />
          <span
            className={`overflow-hidden whitespace-nowrap text-left text-lg text-dark-3 dark:text-light-3`}
            style={{ width: isOpen ? "10rem" : "0" }}
          >
            テーマ設定
          </span>
        </button>
        {themeMenu && (
          <div
            className={`absolute left-16 bottom-0 m-4 w-64 rounded-2xl text-lg text-dark-3 dark:text-light-3 bg-light-3 dark:bg-dark-3`}
            style={{ left: isOpen ? "16rem" : "4rem" }}
          >
            <button
              className="flex items-center rounded-t-2xl p-4 w-full h-14 hover:bg-light-4 hover:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
              onClick={() => setTheme("system")}
            >
              <span>システム</span>
            </button>
            <button
              className="flex items-center p-4 w-full h-14 hover:bg-light-4 hover:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
              onClick={() => setTheme("light")}
            >
              <span>ライト</span>
            </button>
            <button
              className="flex items-center rounded-b-2xl p-4 w-full h-14 hover:bg-light-4 hover:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
              onClick={() => setTheme("dark")}
            >
              <span>ダーク</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
