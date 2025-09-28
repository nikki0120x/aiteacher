"use client";
import { useTopLoader } from "nextjs-toploader";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import styles from "./header.module.css";

export default function Header() {
  const pathname = usePathname();
  const topLoader = useTopLoader();
  const router = useRouter();

  const selectedValue = pathname?.includes("/math")
    ? "/math"
    : pathname?.includes("/japanese")
    ? "/japanese"
    : pathname?.includes("/english")
    ? "/english"
    : "/";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    topLoader.start();
    if (value === "/") {
      router.push("/app"); // ホームに戻る
    } else {
      router.push(`/app${value}`); // 各科目ページへ
    }
    topLoader.done();
  };

  return (
    <>
      <header className="flex flex-row justify-between items-center relative w-full h-16 backdrop-blur-lg bg-light-3/50 dark:bg-dark-3/10">
        <div className="flex flex-row w-32 h-full p-4 z-10">
          <Link href="/" className="relative w-full h-full group">
            <Image
              src="/logo/logo-light.webp"
              alt="Logo Image"
              fill
              className="object-contain group-hover:scale-120 group-active:scale-110 group-focus:scale-120"
            />
          </Link>
        </div>
        <div className="flex justify-center items-center w-48 h-full p-4 z-10">
          <select
            name="subjects"
            value={selectedValue}
            onChange={handleChange}
            className="w-48 h-12 rounded-2xl text-center text-2xl font-medium text-dark-3 dark:text-light-3 bg-light-3 dark:bg-dark-3 hover:bg-light-4 dark:hover:bg-dark-4 active:bg-light-4 dark:active:bg-dark-4 focus:bg-light-4 dark:focus:bg-dark-4"
          >
            <option value="/" title="Home">
              アプリ
            </option>
            <option value="/math" title="The Mathematics">
              数学編
            </option>
            <option value="/japanese" title="The Japanese">
              国語編
            </option>
            <option value="/english" title="The English">
              英語編
            </option>
          </select>
        </div>
        <div className="flex flex-row w-16 h-full p-4 z-10">
          <button className="w-full h-full rounded-full cursor-pointer bg-gray hover:scale-120 active:scale-110 focus:scale-120"></button>
        </div>
      </header>
    </>
  );
}
