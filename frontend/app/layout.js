import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ChatX — Real-time messaging for modern teams",
  description:
    "ChatX is a real-time chat platform powered by Next.js, Socket.io, and MongoDB.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-chat-pattern opacity-30" />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(26, 26, 29, 0.95)",
              color: "#E4E4E7",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
            },
            success: {
              iconTheme: {
                primary: "#6D5DFB",
                secondary: "#E4E4E7",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#E4E4E7",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
