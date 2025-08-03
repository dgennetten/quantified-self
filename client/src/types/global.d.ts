declare global {
  interface Window {
    MockAPI?: {
      getDashboardData: () => Promise<any>;
      connectOura: () => Promise<any>;
      login: (email: string, password: string) => Promise<any>;
      verify2FA: (email: string, code: string) => Promise<any>;
    };
  }
}

export {};
