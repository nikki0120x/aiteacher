/* src\app\page.tsx */
"use client";
import { Button } from "@heroui/react";
import { Github, Play, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Chat() {
	return (
		<div className="overflow-y-auto flex-1 snap-y snap-mandatory no-scrollbar no-select">
			<section className="flex overflow-hidden relative justify-center items-center p-8 size-full snap-start">
				<Image
					src="/images/background/wood.webp"
					alt="Wood Background"
					fill
					priority
					className="object-cover brightness-[0.8] dark:brightness-[0.4]"
				/>
				<div className="flex flex-col gap-8 size-full max-w-3xl">
					<div className="flex relative justify-center w-full">
						<Image
							src="/images/title/light.png"
							alt="Title (Light)"
							width={1920}
							height={1080}
							priority
							className="object-contain"
						/>
					</div>
					<div className="flex relative flex-col justify-center w-full">
						<div className="flex flex-row gap-4 w-full">
							<Button
								as={Link}
								href="/home"
								className="flex-1 gap-4 p-8 rounded-4xl bg-blue"
							>
								<Play size={32} className="text-l1" />
								<span className="text-lg font-medium text-l1">
									今すぐ始めよう！
								</span>
							</Button>
							<Button
								isIconOnly
								className="gap-4 p-4 size-auto rounded-4xl bg-l1"
							>
								<Share2 size={32} className="text-d1" />
							</Button>
							<Button
								as={Link}
								href="https://github.com/nikki0120x/aiteacher"
								target="_blank"
								rel="noopener noreferrer"
								isIconOnly
								className="gap-4 p-4 size-auto rounded-4xl bg-l1"
							>
								<Github size={32} className="text-d1" />
							</Button>
						</div>
					</div>
				</div>
			</section>
			<section className="flex flex-col justify-center items-center p-8 size-full snap-start">
				<h2 className="text-3xl font-bold">Next Content</h2>
			</section>
		</div>
	);
}
