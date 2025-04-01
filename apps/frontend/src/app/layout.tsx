import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import Header from "@/components/ui/header";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `min-h-screen grainy antialiased h-full w-full`,
          inter.className
        )}
      >
        {/* <Header /> */}
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        > */}
        <Navbar />
        {children}
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
