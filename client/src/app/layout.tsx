import type { Metadata } from "next";
import "./globals.css";
<<<<<<< HEAD
import { Work_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import AuthProvider from "@/components/providers/SessionProvider";
=======
import {  Work_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import CustomServerSessionProvider from "@/components/providers/CustomServerSessionProvider";
import WebsocketProvider from "@/components/providers/WebsocketProvider";
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

const work_sans = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chatup",
  description: "Simple chat app where you and your friends can hangout",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(work_sans.className, "w-full h-dvh")}>
<<<<<<< HEAD
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
        <Toaster richColors />
=======
        <NextAuthProvider>
          <CustomServerSessionProvider>
            <ReactQueryProvider>
              <WebsocketProvider>{children}</WebsocketProvider>
            </ReactQueryProvider>
          </CustomServerSessionProvider>
          <Toaster richColors />
        </NextAuthProvider>
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      </body>
    </html>
  );
}
