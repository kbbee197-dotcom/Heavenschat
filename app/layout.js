import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SoundManager from "./components/SoundManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Heavens Chat",
  description: "A new kind of memorial.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SoundManager />
        {children}
      </body>
    </html>
  );
}
