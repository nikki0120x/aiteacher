"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Progress, Button } from "@heroui/react";
import {} from "lucide-react";

export default function Header() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // ページ遷移が始まったら読み込みバーを表示
    setLoading(true);

    // 少し時間をおいてバーを消す（実際のロードを待つ）
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [pathname]); // パスが変わるたびに発火

  return (
    <>
      <header className="flex flex-row items-center p-2 z-70 w-full h-20 backdrop-blur-xs bg-transparent">
        {loading && (
          <Progress
            isIndeterminate
            size="sm"
            color="primary"
            aria-label="Page loading indicator"
            className="absolute left-0 bottom-0 w-full"
          />
        )}
      </header>
    </>
  );
}
