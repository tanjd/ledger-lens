import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { YearProvider } from "@/context/YearContext";
import { PrivacyProvider } from "@/context/PrivacyContext";
import { BrokerProvider } from "@/context/BrokerContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { PrivacyWrapper } from "@/components/layout/PrivacyWrapper";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ledger Lens",
  description: "Personal IBKR portfolio analysis dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased`}>
        <YearProvider>
          <BrokerProvider>
          <PrivacyProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <PrivacyWrapper>
                  <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </PrivacyWrapper>
              </div>
            </div>
            <Toaster richColors position="bottom-right" />
          </PrivacyProvider>
          </BrokerProvider>
        </YearProvider>
      </body>
    </html>
  );
}
