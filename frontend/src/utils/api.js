// Utility function for making authenticated API calls with automatic token refresh
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

const refreshToken = async () => {
  const refreshTokenValue = localStorage.getItem("refreshToken");

  if (!refreshTokenValue) {
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
    // Refresh token is invalid or expired
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userSub");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    window.location.href = "/";
    throw new Error("Refresh token invalid");
  }

  const data = await response.json();

  // Store new tokens
  localStorage.setItem("authToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return data.accessToken;
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
  console.log("fetchoptions:", fetchOptions);

  const response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    console.log("EREROEOROREOR");
    const errorData = await response.json().catch(() => ({}));

    // Check if token is expired
    if (errorData.code === "TOKEN_EXPIRED") {
      console.log("token expired... refreshing");
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
        const newToken = await refreshToken();
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
      // Other auth error, clear tokens and redirect
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userSub");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      window.location.href = "/";
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

  // Clear all tokens
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userSub");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
};
