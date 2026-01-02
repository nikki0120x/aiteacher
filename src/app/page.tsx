/* src\app\page.tsx */
"use client";

export default function Chat() {
	return (
		<div className="overflow-y-auto flex-1 snap-y snap-mandatory no-scrollbar no-select">
			<section className="flex overflow-hidden relative justify-center items-center p-8 size-full snap-start"></section>
			<section className="flex flex-col justify-center items-center p-8 size-full snap-start">
				<h2 className="text-3xl font-bold">Next Content</h2>
			</section>
		</div>
	);
}
