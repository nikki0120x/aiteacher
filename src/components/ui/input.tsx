import { gsap } from "gsap";
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
	patternRegex?: RegExp;
	visibility?: boolean;
	label?: string;
	labelClassName?: string;
	notice?: React.ReactNode;
	isChecked?: boolean;
	leftContent?: React.ReactNode;
	rightContent?: React.ReactNode;
	leftContentCount?: number;
	rightContentCount?: number;
}

const CheckboxInput = forwardRef<HTMLInputElement, InputProps>(
	({ isChecked, visibility, className, label, onChange, ...props }, ref) => {
		const bgRef = useRef<HTMLDivElement>(null);
		const checkRef = useRef<SVGPolylineElement>(null);
		const tl = useRef<gsap.core.Timeline | null>(null);
		const isFirstRender = useRef(true);

		useEffect(() => {
			if (!tl.current) {
				tl.current = gsap.timeline({
					paused: true,
					defaults: { duration: 0.25, ease: "linear" },
				});

				tl.current
					.fromTo(
						bgRef.current,
						{
							opacity: 0,
							scale: 0,
							borderRadius: "50%",
						},
						{
							opacity: 1,
							scale: 1,
							borderRadius: "8px",
						},
						0,
					)
					.to(
						checkRef.current,
						{
							strokeDashoffset: 0,
							duration: 0.25,
						},
						0,
					);
			}

			if (isFirstRender.current) {
				if (isChecked) {
					tl.current.progress(1);
				} else {
					tl.current.progress(0);
				}

				isFirstRender.current = false;

				return;
			}

			if (isChecked) {
				tl.current.play();
			} else {
				tl.current.reverse();
			}
		}, [isChecked]);

		return (
			<label
				className={cn(
					"relative flex items-center justify-center cursor-pointer select-none",
					!visibility && "hidden",
					className,
				)}
			>
				<input
					{...props}
					ref={ref}
					type="checkbox"
					checked={isChecked}
					onChange={onChange}
					className="sr-only"
				/>

				<div
					className={cn(
						"all relative size-6 items-center justify-center rounded-lg border-2 border-l5 dark:border-d5 overflow-hidden flex",
						isChecked && "border-0",
					)}
				>
					<div
						ref={bgRef}
						className="absolute inset-0 bg-blue opacity-0 scale-0 rounded-full"
					/>

					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="4"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="relative z-10 size-4 text-l1"
					>
						<title>Checkbox</title>

						<polyline
							ref={checkRef}
							points="4 12 9 17 20 6"
							style={{ strokeDasharray: 30, strokeDashoffset: 30 }}
						/>
					</svg>
				</div>

				{label && (
					<span className="ml-2 text-base text-left text-d1 dark:text-l1 font-medium">
						{label}
					</span>
				)}
			</label>
		);
	},
);

CheckboxInput.displayName = "CheckboxInput";

export const Input = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			type = "text",
			id,
			name,
			value,
			placeholder,
			minLength,
			maxLength,
			patternRegex,
			onChange,
			onClick,
			className,
			visibility = true,
			label,
			labelClassName,
			notice,
			isChecked,
			leftContent,
			rightContent,
			leftContentCount = leftContent ? 1 : 0,
			rightContentCount = rightContent ? 1 : 0,
			...props
		},
		ref,
	) => {
		const innerRef = useRef<HTMLInputElement>(null);

		useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

		const [isFocused, setIsFocused] = useState(false);
		const [hasValue, setHasValue] = useState(!!value);
		const [showPassword, setShowPassword] = useState(false);
		const [currentLength, setCurrentLength] = useState(
			value?.toString().length || 0,
		);

		useEffect(() => {
			setHasValue(!!value);
		}, [value]);

		const isPasswordType = type === "password";
		const currentType = isPasswordType && showPassword ? "text" : type;
		const isFloatingType = ["text", "email", "password"].includes(type);

		const lengthLimit = (() => {
			if (minLength && maxLength) {
				return `${minLength} ~ ${maxLength}`;
			}
			if (maxLength) {
				return `~ ${maxLength}`;
			}
			if (minLength) {
				return `${minLength} ~`;
			}

			return null;
		})();

		const getValidationStatus = () => {
			if (currentLength === 0) return "empty";

			const isUnderMin = minLength !== undefined && currentLength < minLength;
			const isOverMax = maxLength !== undefined && currentLength > maxLength;
			const isPatternInvalid =
				patternRegex !== undefined &&
				!patternRegex.test(innerRef.current?.value || "");

			if (isUnderMin || isOverMax || isPatternInvalid) {
				return "invalid";
			}
			return "valid";
		};

		const getLengthColor = () => {
			const status = getValidationStatus();
			if (status === "empty") return "text-d5 dark:text-l5";
			if (status === "invalid") return "text-orange";
			return "text-blue";
		};

		const activeLabelColor = labelClassName || getLengthColor();

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;

			setHasValue(val.length > 0);
			setCurrentLength(val.length);

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
				setCurrentLength(0);

				innerRef.current.focus();
			}
		};

		const handleAutoFill = (e: React.AnimationEvent<HTMLInputElement>) => {
			if (e.animationName === "onAutoFillStart") {
				setHasValue(true);
			}
		};

		const autofillClass = cn(
			"autofill:shadow-[0_0_0_1024px_theme(colors.l1)_inset] dark:autofill:shadow-[0_0_0_1024px_theme(colors.d1)_inset]",
			"autofill:[-webkit-text-fill-color:theme(colors.d1)] dark:autofill:[-webkit-text-fill-color:theme(colors.l1)]",
		);

		if (type === "checkbox") {
			const isCheckedValue = typeof value === "boolean" ? value : props.checked;

			return (
				<CheckboxInput
					{...props}
					ref={ref}
					onChange={onChange}
					className={className}
					visibility={visibility}
					label={label}
					isChecked={!!isCheckedValue}
				/>
			);
		}

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
								minLength={minLength}
								maxLength={maxLength}
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
									"peer size-full pt-2 text-left font-medium text-base text-d1 caret-blue outline-none dark:text-l1",
									props.disabled && "cursor-not-allowed",
									autofillClass,
								)}
							/>

							<label
								className={cn(
									"all pointer-events-none absolute left-0 origin-left flex flex-row gap-1 justify-center items-center",
									"peer-focus:-translate-y-4 peer-focus:scale-75",
									"peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75",
									(isFocused || hasValue) && "-translate-y-4 scale-75",
									activeLabelColor,
								)}
							>
								<span className="text-base text-left font-medium whitespace-nowrap ">
									{label || placeholder}
								</span>

								{props.required && (
									<span className="font-mono whitespace-nowrap font-black text-xl text-red text-center">
										*
									</span>
								)}
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
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											{showPassword ? (
												<Eye className="flex-none all text-yellow" />
											) : (
												<EyeClosed className="flex-none all text-yellow" />
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
											type="button"
											onClick={handleInputClear}
											className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2"
										>
											<Trash2 className="flex-none all text-red" />
										</Button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					<AnimatePresence>
						{notice && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.5, ease: "backOut" }}
								className="w-full flex justify-center items-center"
							>
								<div className="flex size-full flex-row justify-start items-stretch pt-2 divide-x divide-dashed divide-blue colors">
									{lengthLimit && (
										<div className="px-2 flex flex-col justify-center items-center">
											<span
												className={`text-sm font-bold font-mono text-center whitespace-nowrap colors ${getLengthColor()}`}
											>
												{lengthLimit}
											</span>

											<span
												className={`text-sm font-bold font-mono text-center whitespace-nowrap colors ${getLengthColor()}`}
											>
												- {currentLength} -
											</span>
										</div>
									)}

									<div className="px-2 flex justify-center items-center">
										{notice}
									</div>
								</div>
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
