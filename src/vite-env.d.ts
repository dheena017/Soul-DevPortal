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
