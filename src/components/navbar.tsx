"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, User, ChevronDown, Menu, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

const ROLE_SHORT: Record<string, string> = {
	ADMIN: "Admin",
	CP1_FARM: "CP1",
	CP2_FEED: "CP2",
	CP3_TRANSPORT: "CP3",
	CP4_SLAUGHTER: "CP4",
	CP5_POST_SLAUGHTER: "CP5",
	CP6_PROCESSING: "CP6",
	CP7_STORAGE: "CP7",
	CP8_DISTRIBUTION: "CP8",
	CP9_RETAIL: "CP9",
	CP10_CONSUMER: "CP10",
	PAKAR_K1: "Pakar K1",
	PAKAR_K2: "Pakar K2",
};

interface NavItem {
	href: string;
	label: string;
	children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
	{ href: "/dashboard", label: "Dashboard" },
	{
		href: "#", label: "K1",
		children: [
			{ href: "/dashboard/kuesioner-pembobotan", label: "Input Pembobotan" },
			{ href: "/dashboard/rekap-pembobotan", label: "Rekap Data" },
		],
	},
	{
		href: "#", label: "K2",
		children: [
			{ href: "/dashboard/kuesioner-risiko", label: "Input Risiko" },
			{ href: "/dashboard/rekap-risiko", label: "Rekap Data" },
		],
	},
	{
		href: "#", label: "K3",
		children: [
			{ href: "/dashboard/kuesioner-aktual", label: "Input Aktual" },
			{ href: "/dashboard/rekap-aktual", label: "Rekap Data" },
		],
	},
	{ href: "/dashboard/input", label: "Kelola CP" },
	{ href: "/dashboard/ahp-steps", label: "Tahapan AHP" },
	{ href: "/chat", label: "Chat" },
];

function NavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isChildActive = item.children?.some((c) => pathname.startsWith(c.href.split("?")[0])) ?? false;

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen(!open)}
				className={`flex items-center gap-1 text-sm transition-colors hover:text-foreground/80 ${
					isChildActive ? "text-foreground font-medium" : "text-muted-foreground"
				}`}
			>
				{item.label}
				<ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
			</button>
			{open && (
				<div className="absolute top-full left-0 mt-2 w-48 rounded-xl border bg-card shadow-xl py-1.5 z-50">
					{item.children?.map((child) => (
						<Link
							key={child.href}
							href={child.href}
							onClick={() => setOpen(false)}
							className={`block px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
								pathname.startsWith(child.href.split("?")[0])
									? "text-foreground font-medium bg-muted/50"
									: "text-muted-foreground"
							}`}
						>
							{child.label}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export function Navbar() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const [menuOpen, setMenuOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const dynamicNavItems = useMemo(() => {
		const role = (session?.user as any)?.role;

		if (!session?.user) {
			return [{ href: "/chat", label: "Chat" }];
		}

		// PAKAR_K1 — hanya Kuesioner 1 + Chat
		if (role === "PAKAR_K1") {
			return [
				{
					href: "#", label: "K1",
					children: [
						{ href: "/dashboard/kuesioner-pembobotan", label: "Input Pembobotan" },
						{ href: "/dashboard/rekap-pembobotan", label: "Rekap Data" },
					],
				},
				{ href: "/chat", label: "Chat" },
			];
		}

		// PAKAR_K2 — hanya Kuesioner 2 + Chat
		if (role === "PAKAR_K2") {
			return [
				{
					href: "#", label: "K2",
					children: [
						{ href: "/dashboard/kuesioner-risiko", label: "Input Risiko" },
						{ href: "/dashboard/rekap-risiko", label: "Rekap Data" },
					],
				},
				{ href: "/chat", label: "Chat" },
			];
		}

		// CP1..CP10 — hanya Kuesioner 3 + Chat
		if (role !== "ADMIN") {
			const isFarmOrSlaughter = role === "CP1_FARM" || role === "CP4_SLAUGHTER";
			return [
				{
					href: "#", label: "K3",
					children: [
						...(isFarmOrSlaughter ? [{ href: "/dashboard/batch-management", label: "Manajemen Sapi" }] : []),
						{ href: "/dashboard/kuesioner-aktual", label: "Input Aktual" },
						{ href: "/dashboard/rekap-aktual", label: "Rekap Data" },
					],
				},
				{ href: "/chat", label: "Chat" },
			];
		}

		// ADMIN — semua menu + Chat dropdown + Kelola User
		const chatItem: NavItem = {
			href: "#", label: "Chat",
			children: [
				{ href: "/chat", label: "Chatbot" },
				{ href: "/docs", label: "Tambah Knowledge" },
			],
		};

		const items = navItems.filter((item) => item.href !== "/chat");
		items.push(chatItem);
		items.push({ href: "/dashboard/user-management", label: "Kelola User" });
		return items;
	}, [session?.user]);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = async () => {
		setMenuOpen(false);
		await signOut({ callbackUrl: "/login" });
	};

	const roleLabel = session?.user?.role
		? ROLE_SHORT[session.user.role] || session.user.role
		: "";

	// Mobile: flatten dropdowns
	const flatMobileItems = useMemo(() => {
		const flat: { href: string; label: string; indent?: boolean }[] = [];
		for (const item of dynamicNavItems) {
			if (item.children) {
				flat.push({ href: "#", label: item.label });
				for (const child of item.children) {
					flat.push({ href: child.href, label: child.label, indent: true });
				}
			} else {
				flat.push({ href: item.href, label: item.label });
			}
		}
		return flat;
	}, [dynamicNavItems]);

	return (
		<header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
			<div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
				<Link href="/" className="flex items-center space-x-2">
					<span className="font-mono font-bold text-lg">Integrated Halal Supply Chain</span>
				</Link>
				<div className="flex items-center gap-4 sm:gap-6">
					<nav className="hidden md:flex items-center gap-4">
						{dynamicNavItems.map((item) =>
							item.children ? (
								<NavDropdown key={item.label} item={item} pathname={pathname} />
							) : (
								<Link
									key={item.href}
									href={item.href}
									className={`text-sm transition-colors hover:text-foreground/80 ${
										pathname === item.href
											? "text-foreground font-medium"
											: "text-muted-foreground"
									}`}
								>
									{item.label}
								</Link>
							)
						)}
					</nav>

					<div className="flex items-center gap-2 sm:gap-3">
						<ThemeToggle />

						{/* Auth section */}
						{status === "loading" ? (
							<div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
						) : session?.user ? (
							<div className="relative" ref={menuRef}>
								<div
									role="button"
									tabIndex={0}
									onClick={() => setMenuOpen(!menuOpen)}
									className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-border/50 bg-muted/50 hover:bg-muted transition-colors text-sm cursor-pointer"
								>
									<div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
										<User className="h-3.5 w-3.5 text-white" />
									</div>
									<span className="hidden sm:inline font-medium max-w-[120px] truncate">
										{session.user.name}
									</span>
									<span className="hidden sm:inline text-[10px] font-mono bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded-md">
										{roleLabel}
									</span>
									<ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`} />
								</div>

								{menuOpen && (
									<div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card shadow-xl py-2 z-50">
										<div className="px-3 py-2 border-b">
											<p className="text-sm font-medium truncate">{session.user.name}</p>
											<p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
											<p className="text-[10px] font-mono text-cyan-500 mt-1">{session.user.role}</p>
										</div>
										<button
											onClick={handleLogout}
											className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors mt-1"
										>
											<LogOut className="h-4 w-4" />
											Keluar
										</button>
									</div>
								)}
							</div>
						) : (
							<Link
								href="/login"
								className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-sm font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all shadow-sm"
							>
								<LogIn className="h-4 w-4" />
								<span className="hidden sm:inline">Masuk</span>
							</Link>
						)}

						{/* Mobile Hamburger */}
						<button
							className="md:hidden flex p-2 -mr-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							{mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Dropdown Menu */}
			{mobileMenuOpen && (
				<div className="md:hidden absolute top-16 left-0 w-full bg-background/95 backdrop-blur-md border-b shadow-lg z-40">
					<nav className="flex flex-col p-4 space-y-1">
						{flatMobileItems.map((item, i) =>
							item.href === "#" ? (
								<p key={i} className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									{item.label}
								</p>
							) : (
								<Link
									key={`${item.href}-${i}`}
									href={item.href}
									onClick={() => setMobileMenuOpen(false)}
									className={`px-4 py-3 rounded-xl text-sm transition-colors ${item.indent ? "pl-8" : ""} ${
										pathname === item.href.split("?")[0]
											? "bg-muted text-foreground font-medium"
											: "text-muted-foreground hover:bg-muted/50"
									}`}
								>
									{item.label}
								</Link>
							)
						)}
					</nav>
				</div>
			)}
		</header>
	);
}
