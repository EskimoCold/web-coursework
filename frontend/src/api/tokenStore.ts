let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken: (): string | null => accessToken,

  setAccessToken: (token: string | null): void => {
    accessToken = token;
  },

  clearAccessToken: (): void => {
    accessToken = null;
  },
};
