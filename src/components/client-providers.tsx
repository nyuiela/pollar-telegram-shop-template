"use client";

import type { ReactNode } from "react";
import { PollarAppProvider } from "@/components/pollar-provider";
import { TelegramProvider } from "@/components/telegram-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <TelegramProvider>
      <PollarAppProvider>{children}</PollarAppProvider>
    </TelegramProvider>
  );
}
