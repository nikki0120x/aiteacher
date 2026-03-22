"use client";
import {
	BellRing,
	BrickWallShield,
	ChevronRight,
	CircleUserRound,
	Info,
	LogIn,
	LogOut,
	MessageCircleMore,
	MessageSquareWarning,
	MonitorCog,
	Settings,
	SquareUserRound,
	UserRoundPlus,
	WalletCards,
	X,
} from "lucide-react";
import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react";
import Image from "next/image";
import { useAppView } from "@/app/[language]/[location]/views/viewApp";
import { Icons } from "@/components/parts/icons";
import { Button, Input, Label } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import {
	APP_LANGUAGE_MAP,
	APP_LOCATION_MAP,
	APP_MENU_MAP,
	APP_NOTIFICATION_MAP,
	APP_THEME_MAP,
	type AppLanguage,
	type AppLocation,
	type AppTheme,
} from "@/models/modelApp";

export default function Sidebar() {
	const { states, actions } = useAppView();
	const { data: session } = useSession();

	return (
		<div className="flex select-none items-center justify-center">
			<AnimatePresence>
				{states.isSidebarOpen && (
					<motion.div
						initial={{ opacity: 0, pointerEvents: "none" }}
						animate={{ opacity: 1, pointerEvents: "auto" }}
						exit={{ opacity: 0, pointerEvents: "none" }}
						transition={{ duration: 0.5, ease: "backOut" }}
						onClick={actions.setSidebarOpen}
						className="colors absolute inset-0 z-10000 size-full cursor-pointer items-center justify-center bg-l1/50 backdrop-blur-lg max-lg:flex lg:hidden dark:bg-d1/50"
					/>
				)}
			</AnimatePresence>

			<motion.aside
				initial={false}
				animate={
					{
						"--sidebar-w-desktop": states.isSidebarOpen ? "20rem" : "3.5rem",
						"--sidebar-w-mobile": states.isSidebarOpen
							? "min(calc(100% - 3.5rem), 20rem)"
							: "0px",
						"--sidebar-border-mobile": states.isSidebarOpen ? "1px" : "0px",
						"--sidebar-opacity-mobile": states.isSidebarOpen ? 1 : 0,
					} as HTMLMotionProps<"aside">["animate"]
				}
				transition={{ duration: 0.5, ease: "backOut" }}
				className="colors max-lg:border-r-(length:--sidebar-border-mobile) z-10000 flex h-full flex-none flex-col items-center justify-between overflow-hidden border-l5 max-lg:absolute max-lg:inset-0 max-lg:w-(--sidebar-w-mobile) max-lg:bg-l1/50 max-lg:opacity-(--sidebar-opacity-mobile) max-lg:shadow-lg max-lg:backdrop-blur-lg lg:relative lg:w-(--sidebar-w-desktop) lg:border-r lg:bg-l1 lg:opacity-100 lg:shadow-none lg:backdrop-blur-none dark:border-d5 dark:lg:bg-d1 dark:max-lg:bg-d1/50"
			>
				<div className="flex size-full flex-1 flex-col items-start justify-start gap-2 p-2">
					<Button
						onClick={() => actions.router.push("/")}
						className="flex h-10 w-full px-2 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2 colors"
					>
						<div
							className={`flex size-full transform flex-row items-center justify-start gap-8 ${states.isSidebarOpen ? "origin-left" : "origin-center"}`}
						>
							<Image
								src="/images/icons/webp/Icon_AITeacher_small_theme.webp"
								alt="The AITeacher Logo"
								width={40}
								height={40}
								priority
								className="w-6 transform object-contain flex-none"
							/>

							<AnimatePresence>
								{states.isSidebarOpen && (
									<motion.div
										layout
										initial={{ x: -16, opacity: 0 }}
										animate={{ x: 0, opacity: 1 }}
										exit={{ x: -16, opacity: 0 }}
										transition={{ duration: 0.5, ease: "backOut" }}
										className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1"
									>
										<Image
											src="/images/logos/webp/Logo_AITeacher_small_theme.webp"
											alt="The AITeacher Logo"
											width={160}
											height={40}
											priority
											className="w-30 transform object-contain"
										/>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</Button>

					<div className="colors h-px w-full rounded-full bg-l5 dark:bg-d5" />

					<Link href="/chat" className="contents">
						<Button
							onClick={actions.handleSidebarLinkClick}
							className={`flex h-10 w-full px-2 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${
								actions.isPathActive("/chat") && "bg-l5! dark:bg-d5!"
							}`}
						>
							<div
								className={`flex size-full transform flex-row items-center justify-start gap-8 ${states.isSidebarOpen ? "origin-left" : "origin-center"}`}
							>
								<MessageCircleMore className="colors flex-none text-d1 dark:text-l1" />

								<AnimatePresence>
									{states.isSidebarOpen && (
										<motion.span
											initial={{ x: -16, opacity: 0 }}
											animate={{ x: 0, opacity: 1 }}
											exit={{ x: -16, opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="colors whitespace-nowrap truncate text-left font-medium text-base text-d1 dark:text-l1"
										>
											{states.app("bar.questions")}
										</motion.span>
									)}
								</AnimatePresence>
							</div>
						</Button>
					</Link>

					<div className="colors h-px w-full rounded-full bg-l5 dark:bg-d5" />
				</div>

				<div className="colors flex size-full flex-0 flex-col items-center justify-start gap-2 border-l5 border-t p-2 dark:border-d5">
					<Link href="/settings" className="contents">
						<Button
							onClick={actions.handleSidebarLinkClick}
							className={`flex h-10 w-full px-2 items-center justify-center rounded-full hover:bg-l2 focus-visible:bg-l2 dark:focus-visible:bg-d2 dark:hover:bg-d2 colors ${
								actions.isPathActive("/settings") && "bg-l5! dark:bg-d5!"
							}`}
						>
							<div
								className={`flex size-full transform flex-row items-center justify-start gap-8 ${states.isSidebarOpen ? "origin-left" : "origin-center"}`}
							>
								<Settings className="colors flex-none text-d1 dark:text-l1" />

								<AnimatePresence>
									{states.isSidebarOpen && (
										<motion.span
											initial={{ x: -16, opacity: 0 }}
											animate={{ x: 0, opacity: 1 }}
											exit={{ x: -16, opacity: 0 }}
											transition={{ duration: 0.5, ease: "backOut" }}
											className="colors whitespace-nowrap truncate text-left font-medium text-base text-d1 dark:text-l1"
										>
											{states.app("bar.settings")}
										</motion.span>
									)}
								</AnimatePresence>
							</div>
						</Button>
					</Link>
				</div>
			</motion.aside>

			<AnimatePresence>
				{states.activeMenu && (
					<motion.div
						onClick={() => actions.setActiveMenu(null, 0)}
						className="absolute inset-0 z-1000 size-full cursor-pointer items-center justify-center max-lg:hidden lg:flex"
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{states.activeMenu && (
					<motion.div
						layout
						initial={
							{
								opacity: 0,
								filter: "blur(1rem)",
								"--menu-width": "0%",
								"--menu-scale": 0.5,
							} as HTMLMotionProps<"div">["initial"]
						}
						animate={
							{
								opacity: 1,
								filter: "blur(0)",
								"--menu-width": "100%",
								"--menu-scale": 1,
							} as HTMLMotionProps<"div">["animate"]
						}
						exit={
							{
								opacity: 0,
								filter: "blur(1rem)",
								"--menu-width": "0%",
								"--menu-scale": 0.5,
							} as HTMLMotionProps<"div">["exit"]
						}
						transition={{ duration: 0.5, ease: "backOut" }}
						style={{
							originX: 1,
							originY: 0,
						}}
						className="colors absolute z-1000 flex flex-col overflow-hidden border-l5 bg-l1/50 shadow-lg backdrop-blur-lg max-lg:top-0 max-lg:right-0 max-lg:size-full max-lg:w-(--menu-width) max-lg:rounded-none max-lg:border-0 lg:top-2 lg:right-2 lg:max-h-[calc(100%-1rem)] lg:scale-(--menu-scale) lg:rounded-4xl lg:border dark:border-d5 dark:bg-d1/50"
					>
						<div className="colors flex flex-none flex-row items-center justify-between border-l5 border-b p-2 dark:border-d5">
							<div className="flex size-10 items-center justify-center rounded-full" />

							<AnimatePresence mode="popLayout">
								<motion.span
									layout
									key={states.activeMenu}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.5, ease: "backOut" }}
									className="colors whitespace-nowrap text-center font-bold text-d1 text-lg dark:text-l1"
								>
									{states.activeMenu &&
										states.app(`options.${APP_MENU_MAP[states.activeMenu]}`)}
								</motion.span>
							</AnimatePresence>

							<Button
								onClick={() => actions.setActiveMenu(null, 0)}
								className="colors flex size-10 items-center justify-center rounded-full hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50"
							>
								<X className="all text-d1 dark:text-l1" />
							</Button>
						</div>

						<AnimatePresence mode="popLayout">
							{states.activeMenu && (
								<motion.div
									layout
									key={states.activeMenu}
									initial={{
										x:
											states.menuDirection === 0
												? 0
												: states.menuDirection > 0
													? 64
													: -64,
										opacity: 0,
										filter: "blur(1rem)",
									}}
									animate={{ x: 0, opacity: 1, filter: "blur(0)" }}
									exit={{
										x:
											states.menuDirection === 0
												? 0
												: states.menuDirection > 0
													? 64
													: -64,
										opacity: 0,
										filter: "blur(1rem)",
									}}
									transition={{ duration: 0.5, ease: "backOut" }}
									className="flex size-full min-h-0 items-center justify-start p-2 lg:flex-col"
								>
									{states.activeMenu === "notifications" && (
										<div className="flex size-full min-w-3xs flex-col items-center justify-center gap-2 overflow-y-auto p-2">
											<div className="colors relative flex w-full items-center justify-center gap-1 overflow-hidden rounded-full bg-l2/50 p-1 dark:bg-d2/50">
												{(
													Object.keys(
														APP_NOTIFICATION_MAP,
													) as (keyof typeof APP_NOTIFICATION_MAP)[]
												).map((tabId) => (
													<Label
														key={tabId}
														className="overflow-visible! colors group relative flex size-full flex-1 items-center justify-center rounded-full py-2 hover:bg-l3/50 lg:px-8 hover:dark:bg-d3/50"
													>
														<Input
															type="radio"
															name="notification_tab"
															value={tabId}
															visibility={false}
															checked={states.activeNotificationTab === tabId}
															onChange={() =>
																actions.setActiveNotificationTab(tabId)
															}
														/>

														{states.activeNotificationTab === tabId && (
															<motion.div
																layoutId="activeNotificationTab"
																transition={{
																	duration: 0.5,
																	ease: "backOut",
																}}
																className="colors absolute inset-0 z-10 size-full rounded-full bg-blue"
															/>
														)}

														<span
															className={`colors relative z-10 whitespace-nowrap text-center font-medium text-base ${
																states.activeNotificationTab === tabId
																	? "text-d1 dark:text-l1"
																	: "text-l5 group-hover:text-d1 dark:text-d5 dark:group-hover:text-l1"
															}`}
														>
															{states.app(
																`options.${APP_NOTIFICATION_MAP[tabId]}`,
															)}
														</span>
													</Label>
												))}
											</div>

											<div className="relative size-full flex-1 lg:min-h-40">
												<AnimatePresence mode="wait">
													<motion.div
														key={states.activeNotificationTab}
														initial={{ opacity: 0, y: 8 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: -8 }}
														transition={{ duration: 0.25, ease: "backOut" }}
														className="absolute inset-0 flex flex-col gap-2 overflow-y-auto"
													>
														{states.activeNotificationTab === "all" && (
															<div className="p-2 text-d1 dark:text-l1">
																全部の通知リスト...
																<div className="p-2 text-d1 dark:text-l1">
																	全部の通知リスト...
																</div>
																<div className="p-2 text-d1 dark:text-l1">
																	全部の通知リスト...
																</div>
																<div className="p-2 text-d1 dark:text-l1">
																	全部の通知リスト...
																</div>
																<div className="p-2 text-d1 dark:text-l1">
																	全部の通知リスト...
																</div>
																<div className="p-2 text-d1 dark:text-l1">
																	全部の通知リスト...
																</div>
																<div className="p-2 text-d1 dark:text-l1">
																	全部の通知リスト...
																</div>
															</div>
														)}
														{states.activeNotificationTab === "unread" && (
															<div className="p-2 text-d1 dark:text-l1">
																未読の通知リスト...
															</div>
														)}
														{states.activeNotificationTab === "read" && (
															<div className="p-2 text-d1 dark:text-l1">
																既読の通知リスト...
															</div>
														)}
													</motion.div>
												</AnimatePresence>
											</div>
										</div>
									)}

									{states.activeMenu === "theme" && (
										<div className="flex size-full min-w-3xs flex-row items-center justify-between gap-2 overflow-y-auto p-2">
											{(Object.keys(APP_THEME_MAP) as AppTheme[]).map(
												(themeId) => (
													<Label
														key={themeId}
														className={`colors flex size-full flex-1 flex-col items-center justify-center gap-2 rounded-2xl p-2 hover:bg-l2/50 dark:hover:bg-d2/50 ${states.theme === themeId && "bg-l5/50! dark:bg-d5/50!"}`}
													>
														{themeId === "system" && (
															<div className="contents">
																<Icons.SystemThemeLarge className="w-25 max-lg:hidden lg:block" />
																<Icons.SystemThemeSmall className="w-25 max-lg:block lg:hidden" />
															</div>
														)}

														{themeId === "light" && (
															<div className="contents">
																<Icons.LightThemeLarge className="w-25 max-lg:hidden lg:block" />
																<Icons.LightThemeSmall className="w-25 max-lg:block lg:hidden" />
															</div>
														)}

														{themeId === "dark" && (
															<div className="contents">
																<Icons.DarkThemeLarge className="w-25 max-lg:hidden lg:block" />
																<Icons.DarkThemeSmall className="w-25 max-lg:block lg:hidden" />
															</div>
														)}

														<span className="colors whitespace-nowrap text-center font-medium text-base text-d1 dark:text-l1">
															{states.app(`options.${APP_THEME_MAP[themeId]}`)}
														</span>

														<Input
															type="radio"
															name="theme"
															value={themeId}
															checked={states.theme === themeId}
															onChange={() =>
																actions.handleThemeChange(themeId)
															}
															className="colors flex size-5 items-center justify-center rounded-full border-l5 dark:border-d5"
														/>
													</Label>
												),
											)}
										</div>
									)}

									{states.activeMenu === "language" && (
										<div className="flex size-full min-w-3xs flex-col items-center justify-start gap-2 overflow-y-auto p-2">
											{(Object.keys(APP_LANGUAGE_MAP) as AppLanguage[]).map(
												(languageId) => (
													<Label
														key={languageId}
														className={`colors flex w-full flex-none flex-raw items-center justify-start gap-2 rounded-2xl p-2 hover:bg-l2/50 dark:hover:bg-d2/50 ${states.language === languageId && "bg-l5/50! dark:bg-d5/50!"}`}
													>
														<Input
															type="radio"
															name="language"
															value={languageId}
															checked={states.language === languageId}
															onChange={() =>
																actions.handleLanguageChange(languageId)
															}
															className="colors flex size-5 items-center justify-center rounded-full border-l5 dark:border-d5"
														/>

														<span className="colors text-left font-bold text-base text-d1 dark:text-l1">
															{states.app(
																`options.${APP_LANGUAGE_MAP[languageId]}.native`,
															)}{" "}
															/{" "}
															{states.app(
																`options.${APP_LANGUAGE_MAP[languageId]}.name`,
															)}
														</span>
													</Label>
												),
											)}
										</div>
									)}

									{states.activeMenu === "location" && (
										<div className="flex size-full min-w-3xs flex-col items-center justify-start gap-2 overflow-y-auto p-2">
											{(Object.keys(APP_LOCATION_MAP) as AppLocation[]).map(
												(locationId) => (
													<Label
														key={locationId}
														className={`colors flex w-full flex-none flex-raw items-center justify-start gap-2 rounded-2xl p-2 hover:bg-l2/50 dark:hover:bg-d2/50 ${states.location === locationId && "bg-l5/50! dark:bg-d5/50!"}`}
													>
														<Input
															type="radio"
															name="location"
															value={locationId}
															checked={states.location === locationId}
															onChange={() =>
																actions.handleLocationChange(locationId)
															}
															className="colors flex size-5 items-center justify-center rounded-full border-l5 dark:border-d5"
														/>

														<span className="colors text-left font-bold text-base text-d1 dark:text-l1">
															{states.app(
																`options.${APP_LOCATION_MAP[locationId]}`,
															)}
														</span>
													</Label>
												),
											)}
										</div>
									)}

									{states.activeMenu === "settings" && (
										<div className="flex size-full min-w-3xs flex-col items-center justify-start gap-2 overflow-y-auto">
											<div className="flex size-full flex-col items-center justify-start gap-2 overflow-y-auto p-2">
												<div className="flex w-full flex-none flex-row items-center justify-start gap-4 py-2">
													<div className="colors h-7 w-1 flex-none rounded-full bg-blue" />

													<span className="colors whitespace-nowrap text-left font-bold text-blue text-xl">
														管理
													</span>

													<div className="colors h-px w-full rounded-full bg-blue" />
												</div>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<CircleUserRound className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															アカウント
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<SquareUserRound className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															プロフィール
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<WalletCards className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															プラン
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<div className="flex w-full flex-none flex-row items-center justify-start gap-4 py-2">
													<div className="colors h-7 w-1 flex-none rounded-full bg-blue" />

													<span className="colors whitespace-nowrap text-left font-bold text-blue text-xl">
														構成
													</span>

													<div className="colors h-px w-full rounded-full bg-blue" />
												</div>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<BellRing className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															通知設定
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<MonitorCog className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															システム設定
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<BrickWallShield className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															プライバシー設定
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<MessageSquareWarning className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															報告
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>

												<Button className="colors flex h-10 w-full flex-none items-center justify-start rounded-full px-2 hover:bg-l2/50 focus-visible:bg-l2/50 dark:focus-visible:bg-d2/50 dark:hover:bg-d2/50">
													<div className="flex size-full origin-left transform flex-row items-center justify-start gap-4">
														<Info className="colors text-d1 dark:text-l1" />

														<span className="colors whitespace-nowrap text-left font-medium text-base text-d1 dark:text-l1">
															詳細
														</span>
													</div>

													<ChevronRight className="all text-d1 dark:text-l1" />
												</Button>
											</div>

											<div className="flex w-full flex-none flex-col gap-2 p-2">
												<div className="flex w-full flex-none flex-row items-center justify-center">
													<div className="colors h-px w-full rounded-full bg-l5 dark:bg-d5" />
												</div>

												<AnimatePresence mode="popLayout">
													{session ? (
														<motion.div
															key="signin-up"
															layout
															initial={{
																y: 32,
																opacity: 0,
																filter: "blur(1rem)",
															}}
															animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
															exit={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
															transition={{ duration: 0.5, ease: "backOut" }}
															className="flex w-full flex-none flex-row items-center justify-center gap-2"
														>
															<Link
																href="/sign?mode=signout"
																className="contents"
															>
																<Button className="colors flex w-full h-15 items-center justify-center rounded-full px-4 bg-red">
																	<div className="flex size-full transform flex-row items-center justify-center gap-4">
																		<LogOut className="colors flex-none text-l1" />

																		<span className="colors truncate whitespace-nowrap text-center font-medium text-base text-l1">
																			切断
																		</span>
																	</div>
																</Button>
															</Link>
														</motion.div>
													) : (
														<motion.div
															key="signout"
															layout
															initial={{
																y: 32,
																opacity: 0,
																filter: "blur(1rem)",
															}}
															animate={{ y: 0, opacity: 1, filter: "blur(0)" }}
															exit={{ y: 32, opacity: 0, filter: "blur(1rem)" }}
															transition={{ duration: 0.5, ease: "backOut" }}
															className="flex w-full flex-none flex-row items-center justify-center gap-2"
														>
															<Link
																href="/sign?mode=signin"
																className="contents"
															>
																<Button className="colors flex w-full h-15 flex-1 items-center justify-center rounded-full px-4 hover:bg-l2/50 dark:hover:bg-d2/50">
																	<div className="flex size-full transform flex-row items-center justify-center gap-4">
																		<LogIn className="flex-none colors text-d1 dark:text-l1" />

																		<span className="truncate colors whitespace-nowrap text-center font-medium text-base text-d1 dark:text-l1">
																			接続
																		</span>
																	</div>
																</Button>
															</Link>

															<Link
																href="/sign?mode=signup"
																className="contents"
															>
																<Button className="colors flex w-full h-15 flex-1 items-center justify-center rounded-full bg-blue px-4">
																	<div className="flex size-full transform flex-row items-center justify-center gap-4">
																		<UserRoundPlus className="flex-none colors text-l1" />

																		<span className="truncate colors whitespace-nowrap text-center font-medium text-base text-l1">
																			登録
																		</span>
																	</div>
																</Button>
															</Link>
														</motion.div>
													)}
												</AnimatePresence>
											</div>
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
