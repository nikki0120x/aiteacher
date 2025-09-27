"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "../globals.css";

export default function TopProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 初回ロード
    NProgress.start();
    window.addEventListener("load", () => NProgress.done());
    return () => window.removeEventListener("load", () => NProgress.done());
  }, []);

  useEffect(() => {
    // ページ遷移
    NProgress.start();
    NProgress.done();
  }, [pathname, searchParams?.toString()]);

  return null;
}
