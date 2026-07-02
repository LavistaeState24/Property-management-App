const TOKEN_KEY = "pmcrm_token";
const USER_KEY = "pmcrm_user";
export const AUTH_STORAGE_EVENT = "pmcrm:auth-storage-change";

const emitAuthStorageChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  }
};

const clearStoredAuth = ({ emit = true } = {}) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (emit) {
    emitAuthStorageChange();
  }
};

const decodeTokenPayload = (token) => {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch (_error) {
    return null;
  }
};

const isTokenValid = (token) => {
  if (!token) {
    return false;
  }

  const payload = decodeTokenPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
};

export const authStorage = {
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return null;
    }

    const payload = decodeTokenPayload(token);

    if (!payload) {
      return token;
    }

    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      clearStoredAuth();
      return null;
    }

    return token;
  },
  getRawToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    emitAuthStorageChange();
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    emitAuthStorageChange();
  },
  getUser: () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!isTokenValid(token)) {
      clearStoredAuth({ emit: false });
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);

    try {
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emitAuthStorageChange();
  },
  clear: clearStoredAuth,
};
