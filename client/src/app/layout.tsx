import type { Metadata } from "next";
import "./globals.css";
import { Work_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import SocketIOProvider from "@/components/providers/SocketIOProvider";

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
        <ReactQueryProvider>
          <AuthProvider>
            <SocketIOProvider>{children}</SocketIOProvider>
          </AuthProvider>
        </ReactQueryProvider>
        <Toaster richColors expand={true} />
      </body>
    </html>
  );
}
