// hooks/useFirebaseAuth.js
import { useState, useEffect, useRef, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Check every 10 minutes
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh if expiring within 5 minutes

export const useFirebaseAuth = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const tokenRefreshIntervalRef = useRef(null);
  const lastTokenRefreshRef = useRef(null);

  // Proactive token refresh function
  const refreshTokenIfNeeded = useCallback(async (currentUser) => {
    if (!currentUser) return;

    try {
      const idTokenResult = await currentUser.getIdTokenResult();
      const expirationTime = new Date(idTokenResult.expirationTime).getTime();
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;

      // Refresh if token expires within threshold (5 minutes)
      if (timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD_MS) {
        console.log("[Auth] Token expiring soon, refreshing...");
        const newToken = await currentUser.getIdToken(true);
        Cookies.set("auth_token", newToken, { expires: 2147483647 });
        lastTokenRefreshRef.current = Date.now();
        console.log("[Auth] Token refreshed successfully");
      } else {
        // Token still valid, just update cookie if needed
        const currentCookieToken = Cookies.get("auth_token");
        if (!currentCookieToken || currentCookieToken !== idTokenResult.token) {
          Cookies.set("auth_token", idTokenResult.token, { expires: 2147483647 });
        }
      }
    } catch (error) {
      console.error("[Auth] Token refresh error:", error);
    }
  }, []);

  // Handle visibility change - refresh token when user returns to page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Only refresh if last refresh was more than 5 minutes ago
        const now = Date.now();
        if (!lastTokenRefreshRef.current || (now - lastTokenRefreshRef.current) > TOKEN_REFRESH_THRESHOLD_MS) {
          refreshTokenIfNeeded(user);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshTokenIfNeeded]);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Initial token refresh
        await refreshTokenIfNeeded(user);
        lastTokenRefreshRef.current = Date.now();

        // Set up periodic token refresh interval
        if (tokenRefreshIntervalRef.current) {
          clearInterval(tokenRefreshIntervalRef.current);
        }

        tokenRefreshIntervalRef.current = setInterval(() => {
          refreshTokenIfNeeded(user);
        }, TOKEN_REFRESH_INTERVAL_MS);

      } else {
        // User logged out - clear interval and token
        if (tokenRefreshIntervalRef.current) {
          clearInterval(tokenRefreshIntervalRef.current);
          tokenRefreshIntervalRef.current = null;
        }
        localStorage.removeItem("token");
        Cookies.remove("auth_token");
      }

      setAuthLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribe();
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [refreshTokenIfNeeded]);

  return { user, authLoading, refreshTokenIfNeeded };
};
