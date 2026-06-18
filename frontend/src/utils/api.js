// Utility function for making authenticated API calls with automatic token refresh
import { jwtDecode } from "jwt-decode";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const clearAuthStorage = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userSub");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userPicture");
};

const isAccessTokenValid = (token) => {
  const decoded = jwtDecode(token);
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp > currentTime;
};

/** Custom avatars were briefly embedded in JWTs, blowing past header limits. */
const isOversizedAccessToken = (token) => {
  if (!token) return false;
  if (token.length > 4096) return true;
  try {
    const decoded = jwtDecode(token);
    return (
      typeof decoded.picture === "string" && decoded.picture.startsWith("data:")
    );
  } catch {
    return false;
  }
};

/** Refresh tokens; optionally redirect to login when refresh fails. */
export const refreshAccessToken = async ({ redirectOnFailure = true } = {}) => {
  const refreshTokenValue = localStorage.getItem("refreshToken");

  if (!refreshTokenValue) {
    clearAuthStorage();
    if (redirectOnFailure) window.location.href = "/login";
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_URL}/api/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });

  if (!response.ok) {
    clearAuthStorage();
    if (redirectOnFailure) window.location.href = "/login";
    throw new Error("Refresh token invalid");
  }

  const data = await response.json();

  localStorage.setItem("authToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return data.accessToken;
};

/**
 * Returns true when the user has a usable session (valid access token or
 * successful silent refresh). Clears stale tokens without redirecting.
 */
export const ensureValidSession = async () => {
  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!token || !refreshToken) {
    return false;
  }

  try {
    if (isOversizedAccessToken(token)) {
      await refreshAccessToken({ redirectOnFailure: false });
      return true;
    }

    if (isAccessTokenValid(token)) {
      return true;
    }

    await refreshAccessToken({ redirectOnFailure: false });
    return true;
  } catch {
    clearAuthStorage();
    return false;
  }
};

export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No authentication token found");
  }

  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));

    // Check if token is expired
    if (errorData.code === "TOKEN_EXPIRED") {
      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          // Retry with new token
          const newOptions = {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          return fetch(url, newOptions);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        // Retry original request with new token
        const newOptions = {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };

        return fetch(url, newOptions);
      } catch (refreshError) {
        processQueue(refreshError, null);
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    } else {
      clearAuthStorage();
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }
  } else if(response.status === 405) {
    console.error("405 error in authFetch", response);
  }

  return response;
};

// Logout function that also calls the backend to invalidate refresh token
export const logout = async () => {
  try {
    await fetch(`${API_URL}/api/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
  } catch (error) {
    console.error("Error during logout:", error);
    // Continue with local logout even if server logout fails
  }

  clearAuthStorage();
};
