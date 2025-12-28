import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SupabaseProvider from '@/components/providers/supabase-provider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "30Minutes | Create Your Market",
  description: "Dominating Rajkot's Ad Space. Book Billboards & Influencers in minutes.",
  icons: {
    icon: "/logo.png", // Uses your transparent logo as the favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}