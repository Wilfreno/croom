import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import CustomServerSessionProvider from "@/components/providers/CustomServerSessionProvider";
import WebsocketProvider from "@/components/providers/WebsocketProvider";

const poppins = Poppins({
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
      <body className={cn(poppins.className, "w-full h-dvh")}>
        <NextAuthProvider>
          <CustomServerSessionProvider>
            <ReactQueryProvider>
              <WebsocketProvider>{children}</WebsocketProvider>
            </ReactQueryProvider>
          </CustomServerSessionProvider>
          <Toaster richColors />
        </NextAuthProvider>
      </body>
    </html>
  );
}
