import "./globals.css";
import { cn, constructMetadata } from "@/lib/utils";
import Navbar from "@/components/navbar";
import Provider from "@/components/providers";
import "react-loading-skeleton/dist/skeleton.css";
import { ToastContainer } from "react-toastify";
import "simplebar-react/dist/simplebar.min.css";
import Script from "next/script";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Provider>
        <body
          className={cn(
            "min-h-screen font-sans antialiased grainy",
            inter.className
          )}
        >
          {" "}
          {/* <Header /> */}
          {/* <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        > */}
          <ToastContainer />
          <Navbar />
          {children}
          {/* </ThemeProvider> */}
          <Script
            id="razorpay-checkout-js"
            src="https://checkout.razorpay.com/v1/checkout.js"
          />
        </body>
      </Provider>
    </html>
  );
}
