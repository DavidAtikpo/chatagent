export {};

declare global {
  interface Window {
    ChatAgentBoot?: {
      key: string;
      api?: string;
      trafficSlug?: string;
      autoOpen?: boolean;
      mode?: "bubble" | "page";
    };
    ChatAgent?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}
