"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Menu, Settings, SunMoon, Sun, Moon, Check } from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Sidebarの開閉状態を管理する状態変数
  const [themeMenu, setThemeMenu] = useState(false);
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const thememenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mounted) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        themeMenu &&
        thememenuRef.current &&
        sidebarRef.current &&
        !thememenuRef.current.contains(event.target as Node) &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setThemeMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [themeMenu, mounted]);

  if (!mounted) return null;

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`z-1000 flex flex-col gap-4 p-2 w-auto h-dvh bg-light-3 dark:bg-dark-3`}
        style={{ width: isOpen ? "16rem" : "4rem" }}
      >
        <button
          aria-label="Menu Button"
          className="mb-auto flex justify-center items-center w-12 h-12 rounded-full cursor-pointer bg-light-3 dark:bg-dark-3 hover:bg-light-4 hover:dark:bg-dark-4 active:bg-light-4 active:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="p-3 w-12 h-full text-dark-3 dark:text-light-3" />
        </button>
        <button
          aria-label="Theme Button"
          className={`mt-auto flex flex-row items-center w-full h-12 rounded-full cursor-pointer bg-light-3 dark:bg-dark-3 hover:bg-light-4 hover:dark:bg-dark-4 active:bg-light-4 active:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4 ${
            isOpen ? "gap-2" : "gap-0"
          }`}
          onClick={() => setThemeMenu(!themeMenu)}
        >
          <Settings className="p-3 w-12 h-full text-dark-3 dark:text-light-3" />
          <span
            className={`overflow-hidden whitespace-nowrap text-left text-lg font-medium text-dark-3 dark:text-light-3`}
            style={{ width: isOpen ? "10rem" : "0" }}
          >
            設定
          </span>
        </button>
        <div
          ref={thememenuRef}
          className={`overflow-hidden absolute left-16 bottom-0 m-4 w-64 rounded-2xl text-lg text-dark-3 dark:text-light-3 bg-light-3/50 dark:bg-dark-3/50 backdrop-blur-xs ${
            themeMenu
              ? "opacity-100 translate-x-0 pointer-events-auto"
              : "opacity-0 -translate-x-4 pointer-events-none"
          }`}
          style={{ left: isOpen ? "16rem" : "4rem" }}
        >
          <button
            aria-label="System Theme Button"
            className="flex flex-row items-center gap-4 p-4 w-full h-14 cursor-pointer hover:bg-light-4 hover:dark:bg-dark-4 active:bg-light-4 active:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
            onClick={() => setTheme("system")}
          >
            <SunMoon className="w-auto h-full text-dark-3 dark:text-light-3" />
            <span className="overflow-hidden whitespace-nowrap text-left text-lg font-medium text-dark-3 dark:text-light-3">
              システム
            </span>
            {theme === "system" && (
              <Check className="ml-auto w-auto h-full text-green-dark dark:text-green-light" />
            )}
          </button>
          <button
            aria-label="Light Theme Button"
            className="flex flex-row items-center gap-4 p-4 w-full h-14 cursor-pointer hover:bg-light-4 hover:dark:bg-dark-4 active:bg-light-4 active:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
            onClick={() => setTheme("light")}
          >
            <Sun className="w-auto h-full text-dark-3 dark:text-light-3" />
            <span className="overflow-hidden whitespace-nowrap text-left text-lg font-medium text-dark-3 dark:text-light-3">
              ライト
            </span>
            {theme === "light" && (
              <Check className="ml-auto w-auto h-full text-green-dark dark:text-green-light" />
            )}
          </button>
          <button
          aria-label="Dark Theme Button"
            className="flex flex-row items-center gap-4 p-4 w-full h-14 cursor-pointer hover:bg-light-4 hover:dark:bg-dark-4 active:bg-light-4 active:dark:bg-dark-4 focus:bg-light-4 focus:dark:bg-dark-4"
            onClick={() => setTheme("dark")}
          >
            <Moon className="w-auto h-full text-dark-3 dark:text-light-3" />
            <span className="overflow-hidden whitespace-nowrap text-left text-lg font-medium text-dark-3 dark:text-light-3">
              ダーク
            </span>
            {theme === "dark" && (
              <Check className="ml-auto w-auto h-full text-green-dark dark:text-green-light" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
