"use client";
import { useEffect, useRef } from "react";

declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}
}

export const VoiceVisualizer = ({ isListening }: { isListening: boolean }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const barsRef = useRef<
		{ id: number; height: number; x: number; spawnTime: number }[]
	>([]);
	const lastTimeRef = useRef<number>(0);
	const lastSpawnTimeRef = useRef<number>(0);

	const BAR_WIDTH = 2;
	const GAP = 4;
	const SPEED = 160;
	const SPAWN_INTERVAL = ((BAR_WIDTH + GAP) / SPEED) * 1000;

	const getColor = () => {
		if (typeof window === "undefined" || !containerRef.current)
			return "#000000";
		return getComputedStyle(containerRef.current).color;
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		const handleResize = () => {
			const dpr = window.devicePixelRatio || 1;
			const rect = container.getBoundingClientRect();
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			const ctx = canvas.getContext("2d");
			if (ctx) ctx.scale(dpr, dpr);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		let isActive = true;

		const cleanup = () => {
			isActive = false;

			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => {
					track.stop();
				});
				streamRef.current = null;
			}

			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}

			barsRef.current = [];
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			if (canvas && ctx) {
				const width = canvas.width / (window.devicePixelRatio || 1);
				const height = canvas.height / (window.devicePixelRatio || 1);
				ctx.clearRect(0, 0, width, height);
			}
		};

		if (isListening) {
			const setupAudio = async () => {
				try {
					const stream = await navigator.mediaDevices.getUserMedia({
						audio: true,
					});

					if (!isActive) {
						stream.getTracks().forEach((track) => {
							track.stop();
						});
						return;
					}

					streamRef.current = stream;

					const AudioContextClass =
						window.AudioContext || window.webkitAudioContext;
					const audioContext = new AudioContextClass();

					const analyser = audioContext.createAnalyser();
					const source = audioContext.createMediaStreamSource(stream);

					analyser.fftSize = 256;
					source.connect(analyser);

					audioContextRef.current = audioContext;
					analyserRef.current = analyser;

					const dataArray = new Uint8Array(analyser.frequencyBinCount);
					const canvas = canvasRef.current;
					const ctx = canvas?.getContext("2d");

					lastTimeRef.current = performance.now();
					let fillColor = getColor();
					let colorCheckTimer = 0;

					const loop = (timestamp: number) => {
						if (!isActive || !ctx || !canvas || !analyserRef.current) return;

						const deltaTime = (timestamp - lastTimeRef.current) / 1000;
						lastTimeRef.current = timestamp;

						if (timestamp - colorCheckTimer > 1000) {
							fillColor = getColor();
							colorCheckTimer = timestamp;
						}

						analyserRef.current.getByteFrequencyData(dataArray);
						const average =
							dataArray.reduce((a, b) => a + b) / dataArray.length;

						const width = canvas.width / (window.devicePixelRatio || 1);
						const height = canvas.height / (window.devicePixelRatio || 1);

						ctx.clearRect(0, 0, width, height);

						barsRef.current = barsRef.current
							.map((bar) => ({ ...bar, x: bar.x + SPEED * deltaTime }))
							.filter((bar) => bar.x < width + 20);

						if (timestamp - lastSpawnTimeRef.current >= SPAWN_INTERVAL) {
							const rawHeight = (average / 255) * height * 2.0;
							const targetHeight = Math.min(height, Math.max(4, rawHeight));

							barsRef.current.push({
								id: Date.now(),
								height: targetHeight,
								x: 0,
								spawnTime: timestamp,
							});
							lastSpawnTimeRef.current = timestamp;
						}

						ctx.fillStyle = fillColor;

						barsRef.current.forEach((bar) => {
							const age = timestamp - bar.spawnTime;
							const progress = Math.min(age / 100, 1);
							const scaleY = 1 - (1 - progress) ** 3;

							const currentHeight = bar.height * scaleY;
							const drawX = width - bar.x;
							const drawY = height / 2 - currentHeight / 2;

							ctx.beginPath();
							if (ctx.roundRect) {
								ctx.roundRect(
									drawX,
									drawY,
									BAR_WIDTH,
									currentHeight,
									BAR_WIDTH / 2,
								);
							} else {
								ctx.rect(drawX, drawY, BAR_WIDTH, currentHeight);
							}
							ctx.fill();
						});

						animationFrameRef.current = requestAnimationFrame(loop);
					};

					animationFrameRef.current = requestAnimationFrame(loop);
				} catch (err) {
					console.error("マイクのアクセスに失敗しました:", err);
				}
			};
			setupAudio();
		} else {
			cleanup();
		}

		return cleanup;
	}, [isListening, SPAWN_INTERVAL]);

	return (
		<div ref={containerRef} className="size-full overflow-hidden text-red">
			<canvas
				ref={canvasRef}
				className="mask-x-from-90% mask-x-to-transparent size-full"
			/>
		</div>
	);
};
