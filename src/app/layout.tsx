import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "Halal KMS-DSS",
	description: "Knowledge Management & Decision Support System untuk Rantai Pasok Halal",
	openGraph: {
		title: "Halal KMS-DSS",
		description: "Knowledge Management & Decision Support System untuk Rantai Pasok Halal",
		url: "https://halal-kms.com",
		siteName: "Halal KMS",
		images: [
			{
				url: "https://halal-kms.com/og-image.png",
				width: 1200,
				height: 630,
			},
		],
		locale: "id_ID",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Halal KMS-DSS",
		description: "Knowledge Management & Decision Support System Rantai Pasok Halal",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background`}
				suppressHydrationWarning
			>
				<AuthProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<Toaster richColors position="top-center" />
						{children}
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
