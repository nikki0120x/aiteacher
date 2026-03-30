import { Eye, EyeClosed, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui";
import { cn } from "@/models/cn";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	visibility?: boolean;
	label?: string;
	error?: string;
	leftContent?: React.ReactNode;
	rightContent?: React.ReactNode;
	leftContentCount?: number;
	rightContentCount?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			type = "text",
			id,
			name,
			value,
			placeholder,
			visibility = true,
			onClick,
			className,
			label,
			error,
			leftContent,
			rightContent,
			leftContentCount = leftContent ? 1 : 0,
			rightContentCount = rightContent ? 1 : 0,
			onChange,
			...props
		},
		ref,
	) => {
		const innerRef = useRef<HTMLInputElement>(null);

		useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

		const [isFocused, setIsFocused] = useState(false);
		const [hasValue, setHasValue] = useState(!!value);
		const [showPassword, setShowPassword] = useState(false);

		useEffect(() => {
			setHasValue(!!value);
		}, [value]);

		const isPasswordType = type === "password";
		const currentType = isPasswordType && showPassword ? "text" : type;
		const isFloatingType = ["text", "email", "password"].includes(type);

		const handleAutoFill = (e: React.AnimationEvent<HTMLInputElement>) => {
			if (e.animationName === "onAutoFillStart") {
				setHasValue(true);
			}
		};
		
		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setHasValue(e.target.value.length > 0);

			if (onChange) onChange(e);
		};

		const handleInputClear = () => {
			if (innerRef.current) {
				const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
					window.HTMLInputElement.prototype,
					"value",
				)?.set;

				nativeInputValueSetter?.call(innerRef.current, "");

				const event = new Event("input", { bubbles: true });

				innerRef.current.dispatchEvent(event);

				setHasValue(false);

				innerRef.current.focus();
			}
		};

		const autofillClass = cn(
			"autofill:shadow-[0_0_0_1024px_theme(colors.l1)_inset] dark:autofill:shadow-[0_0_0_1024px_theme(colors.d1)_inset]",
			"autofill:[-webkit-text-fill-color:theme(colors.d1)] dark:autofill:[-webkit-text-fill-color:theme(colors.l1)]",
		);

		if (isFloatingType) {
			return (
				<div className="flex flex-col justify-center items-center size-full">
					<div
						className={cn(
							"colors flex h-15 w-full flex-row items-center justify-center gap-1 rounded-4xl border border-l5 p-2 dark:border-l5",
							"has-focus:ring-2 has-focus:ring-blue",
							!visibility && "hidden",
							className,
						)}
					>
						{leftContent && (
							<div className="flex flex-row items-center justify-start">
								{leftContent}
							</div>
						)}

						<div
							className={cn(
								"relative flex flex-1 items-center justify-center",
								!leftContent && "ml-4",
							)}
						>
							<input
								{...props}
								ref={innerRef}
								type={currentType}
								name={name}
								value={value}
								placeholder=" "
								onChange={handleInputChange}
								onAnimationStart={handleAutoFill}
								onFocus={(e) => {
									setIsFocused(true);
									props.onFocus?.(e);
								}}
								onBlur={(e) => {
									setIsFocused(false);
									props.onBlur?.(e);
								}}
								className={cn(
									"peer size-full bg-transparent pt-2 text-left font-medium text-base text-d1 caret-blue outline-none placeholder:text-l5 dark:text-l1 dark:placeholder:text-d5",
									props.disabled && "cursor-not-allowed",
									autofillClass,
								)}
							/>

							<label
								className={cn(
									"all pointer-events-none absolute left-0 origin-left text-l5 dark:text-d5",
									"peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-blue!",
									"peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75",
									(isFocused || hasValue) && "-translate-y-4 scale-75 text-blue!",
								)}
							>
								{label || placeholder}
							</label>
						</div>

						<div className="flex flex-row items-center justify-center gap-1">
							{rightContent}

							<AnimatePresence mode="popLayout">
								{isPasswordType && (
									<motion.div
										key="password-toggle"
										layout
										transition={{ duration: 0.5, ease: "backOut" }}
									>
										<Button
											onClick={() => setShowPassword(!showPassword)}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											{showPassword ? (
												<Eye className="all text-yellow" />
											) : (
												<EyeClosed className="all text-yellow" />
											)}
										</Button>
									</motion.div>
								)}

								{hasValue && (
									<motion.div
										key="password-clear"
										layout
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.5, ease: "backOut" }}
									>
										<Button
											onClick={handleInputClear}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<Trash2 className="all text-red" />
										</Button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					<AnimatePresence>
						{error && (
							<motion.div
								layout
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="px-4 w-full flex justify-start items-center"
							>
								<span className="mt-2 colors text-left font-medium text-base text-red">
									⚠ {error}
								</span>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			);
		}

		const styles = {
			radio: cn(
				"overflow-hidden relative border-2 cursor-pointer",
				"checked:border-blue!",
				"after:size-full after:content-[''] after:bg-blue after:rounded-full after:scale-0 after:all",
				"checked:after:scale-50",
			),
			file: "hidden",
		};

		const variantClass = styles[type as keyof typeof styles];

		const inputClass = cn(
			"outline-none",
			variantClass,
			!visibility && "sr-only",
			className,
		);

		return (
			<input
				{...props}
				ref={ref}
				type={type}
				id={id}
				name={name}
				value={value}
				onChange={onChange}
				className={inputClass}
			/>
		);
	},
);

Input.displayName = "Input";
