import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEARNEXA",
  description: "Student Skill Exchange and Learning Partner System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}