"use client";
import { useEffect } from "react";

export default function BodyTouchListener() {
  useEffect(() => {
    const handleTouch = () => console.log("touch start");
    document.body.addEventListener("touchstart", handleTouch);
    return () => document.body.removeEventListener("touchstart", handleTouch);
  }, []);

  return null; // 何も描画しない
}