"use client";
import { useState } from "react";
import RoutineIcon from "@/assets/icons/theme/routine.svg";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Sidebarの開閉状態を管理する状態変数

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
        >
          <RoutineIcon className="p-3 w-12 h-full text-dark-3 dark:text-light-3" />
          <span
            className={`overflow-hidden whitespace-nowrap text-left text-lg`}
            style={{ width: isOpen ? "10rem" : "0" }}
          >
            テーマ設定
          </span>
        </button>
      </aside>
    </>
  );
}
