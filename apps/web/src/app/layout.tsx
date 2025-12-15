import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repaso - Preparación para la Reválida de Psicología",
  description: "Plataforma de estudio y preparación para el examen de Reválida de Psicología en Puerto Rico",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('repaso:theme');
  const theme = themeCookie?.value === 'light' || themeCookie?.value === 'dark' ? themeCookie.value : undefined;
  return (
    <html lang="en" {...(theme ? { 'data-theme': theme } : {})}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
