"use client";
import { useEffect, useState } from "react";

interface SubjectPageProps {
  params: { subject: string };
}

const SUBJECT_LABELS: Record<string, string> = {
  math: "数学編",
  japanese: "国語編",
  english: "英語編",
};

const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-gradient-to-tr from-emerald-500 to-sky-500 bg-clip-text text-transparent",
  japanese:
    "bg-gradient-to-tr from-yellow-500 to-red-500 bg-clip-text text-transparent",
  english:
    "bg-gradient-to-tr from-pink-500 to-violet-500 bg-clip-text text-transparent",
};

export default function SubjectPage({ params }: SubjectPageProps) {
  const subjectLabel = SUBJECT_LABELS[params.subject] || params.subject;
  const subjectColor = SUBJECT_COLORS[params.subject] || "text-gray";

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, [params.subject]);

  return (
    <>
      <section className="flex flex-1 justify-center items-center">
        <h1
          className={`text-center text-5xl font-black ${subjectColor} duration-1000! delay-500! ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {subjectLabel}
        </h1>
      </section>
      <section className="flex w-full h-32 rounded-2xl bg-light-3 dark:bg-dark-3"></section>
    </>
  );
}
