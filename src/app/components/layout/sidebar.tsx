"use client";

import { useState } from "react";
import "./sidebar.module.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Sidebarの開閉状態を管理する状態変数

  return (
    <>
      <aside
        className={`flex flex-col h-dvh bg-light-3 dark:bg-dark-3`}
        style={{ width: isOpen ? "16rem" : "4rem" }}
      >
        <button
          className="p-2 m-2 bg-gray rounded-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Close" : "Open"}
        </button>
      </aside>
    </>
  );
}
