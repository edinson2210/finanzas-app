"use client";

import { FinanceProvider } from "@/context/finance-context";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FinanceProvider>{children}</FinanceProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
