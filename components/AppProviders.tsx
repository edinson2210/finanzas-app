"use client";

import React from "react";
import { ThemeProvider } from "./theme-provider";
import { FinanceProvider } from "@/context/finance-context";
import { Toaster } from "@/components/toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <FinanceProvider>
        {children}
        <Toaster />
      </FinanceProvider>
    </ThemeProvider>
  );
}
