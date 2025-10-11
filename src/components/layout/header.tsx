"use client";

import React from "react";
import { Button } from "@heroui/react";
import { SquarePen } from "lucide-react";

export default function Header() {
  return (
    <>
      <header className="flex flex-row items-center p-2 z-70 w-full h-16 backdrop-blur-xs bg-transparent">
        <Button
          aria-label="New Chat Button"
          isIconOnly
          size="lg"
          radius="full"
          className="ml-auto z-100 text-dark-1 dark:text-light-1 bg-transparent"
        >
          <SquarePen />
        </Button>
      </header>
    </>
  );
}
