import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import Provider from "@/components/providers";
import "react-loading-skeleton/dist/skeleton.css";
import { ToastContainer } from "react-toastify";
import "simplebar-react/dist/simplebar.min.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Provider>
        <body className={cn(`min-h-screen grainy antialiased h-full w-full`)}>
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
        </body>
      </Provider>
    </html>
  );
}
