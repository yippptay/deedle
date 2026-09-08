import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const skipFont = localFont({
  src: "../../public/fonts/FOT-Skip_Std_B.otf",
  variable: "--font-skip",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KeksDeedle",
  description: "Hall of shame",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${skipFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-900">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}