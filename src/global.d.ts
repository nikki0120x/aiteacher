/* src\global.d.ts */
export {};

declare global {
	interface Window {
		__TAURI__?: unknown;
	}
}
