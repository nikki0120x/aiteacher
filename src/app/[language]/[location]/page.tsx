"use client";

export default function Chat() {
	return (
		<div className="no-scrollbar no-select flex-1 snap-y snap-mandatory overflow-y-auto">
			<section className="relative flex size-full snap-start items-center justify-center overflow-hidden p-8"></section>
			<section className="flex size-full snap-start flex-col items-center justify-center p-8">
				<h2 className="font-bold text-3xl">Next Content</h2>
			</section>
		</div>
	);
}
