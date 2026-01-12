/* src/components/ui/contextmenu.tsx */
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

type ContextMenuProps = {
	children: ReactNode;
	content: ReactNode;
	onOpen?: () => void;
	onClose?: () => void;
	className?: string;
};

export const ContextMenu = ({
	children,
	content,
	onOpen,
	onClose,
	className = "",
}: ContextMenuProps) => {
	const [clickPosition, setClickPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
		opacity: 0,
	});
	const menuRef = useRef<HTMLDivElement>(null);

	// ========================================================================
	//     ハンドラー
	// ========================================================================

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		setClickPosition({ x: e.pageX, y: e.pageY });
		onOpen?.();
	};

	const closeMenu = () => {
		setClickPosition(null);
		setMenuStyle({ opacity: 0 });
		onClose?.();
	};

	// ========================================================================
	//     外部クリック / スクロール / キーボード監視
	// ========================================================================

	useEffect(() => {
		if (!clickPosition) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				closeMenu();
			}
		};

		const handleScroll = () => closeMenu();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeMenu();
		};

		document.addEventListener("mousedown", handleClickOutside);
		window.addEventListener("scroll", handleScroll, true);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", handleScroll, true);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [clickPosition]);

	// ========================================================================
	//     座標計算 / 衝突検知
	// ========================================================================

	useLayoutEffect(() => {
		if (!clickPosition || !menuRef.current) return;

		const { x, y } = clickPosition;
		const menuRect = menuRef.current.getBoundingClientRect();

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let finalX = x;
		let finalY = y;
		let originX = "left";
		let originY = "top";

		if (x + menuRect.width > viewportWidth) {
			finalX = x - menuRect.width;
			originX = "right";
		}

		if (y + menuRect.height > viewportHeight) {
			finalY = y - menuRect.height;
			originY = "bottom";
		}

		setMenuStyle({
			top: finalY,
			left: finalX,
			transformOrigin: `${originY} ${originX}`,
			opacity: 1,
		});
	}, [clickPosition]);

	// ========================================================================
	//     レンダリング
	// ========================================================================

	return (
		<>
			<div onContextMenu={handleContextMenu} className="contents">
				{children}
			</div>

			{clickPosition &&
				createPortal(
					<div
						ref={menuRef}
						className={`
                            overflow-hidden fixed z-1000 min-w-40 bg-white rounded-md border shadow-xl duration-250 animate-in fade-in zoom-in-95
                            ${className}
                        `}
						style={menuStyle}
					>
						{content}
					</div>,
					document.body,
				)}
		</>
	);
};
