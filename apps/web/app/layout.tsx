import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "Light Kids - Child Management System",
  description: "A modern, secure platform for parents, mentors, and admins to manage child care and education seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body>
        <main className="app-main">
          {children}
          <ThemeToggle />
        </main>
      </body>
    </html>
  );
}
