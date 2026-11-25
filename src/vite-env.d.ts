/// <reference types="vite/client" />

declare module 'virtual:workspace-packages' {
  import { WorkspaceData } from './types';
  const data: WorkspaceData;
  export default data;
}

declare module '@workspace/logger' {
  export const consoleLogger: any;
  export const serverLogger: any;
}

declare module '@workspace/config/tailwind/tokens' {
  export const tokens: {
    colors: {
      brand?: { DEFAULT?: string };
      accent?: { DEFAULT?: string };
      [key: string]: any;
    };
    [key: string]: any;
  };
}

interface SoulDesktopBridge {
  isDesktop: boolean;
  platform: string;
  versions?: {
    electron?: string;
    chrome?: string;
    node?: string;
  };
  navigate?: (route: string) => void;
  onNavigate?: (cb: (route: string) => void) => () => void;
  openExternal?: (url: string) => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface Window {
  soulDesktop?: SoulDesktopBridge;
}
