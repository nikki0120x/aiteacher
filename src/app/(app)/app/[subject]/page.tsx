"use client";
import { useEffect, useState, useRef } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [subjectInputs, setSubjectInputs] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const saved = localStorage.getItem("subjectInputs");
    if (saved) {
      setSubjectInputs(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    setVisible(true);
  }, [params.subject]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // 一旦リセット
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
      textareaRef.current.addEventListener("input", adjustHeight);
    }
    return () => {
      textareaRef.current?.removeEventListener("input", adjustHeight);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSubjectInputs((prev) => {
      const updated = { ...prev, [params.subject]: value };
      localStorage.setItem("subjectInputs", JSON.stringify(updated)); // localStorage に保存
      return updated;
    });
  };

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
      <section className="flex flex-col w-full rounded-4xl bg-light-3 dark:bg-dark-3">
        <div className="flex items-center px-6 py-4">
          <textarea
            ref={textareaRef}
            name="question"
            placeholder="AI に訊きたいことはある？"
            rows={1}
            value={subjectInputs[params.subject] || ""}
            onChange={handleChange}
            className="resize-none w-full max-h-[280px] text-left text-lg font-medium placeholder-gray text-dark-3 dark:text-light-3"
          />
        </div>
        <div className="flex items-center">
          <div className="resize-none px-6 py-4 w-full text-left text-lg font-medium">
          </div>
        </div>
      </section>
    </>
  );
}
