// hooks/useFirebaseAuth.js
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";

export const useFirebaseAuth = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const token = idTokenResult.expirationTime <= Date.now()
            ? await user.getIdToken(true)
            : idTokenResult.token;
          
          Cookies.set("auth_token", token, { expires: 2147483647 });
        } catch (error) {
          console.error("Token refresh error:", error);
        }
      } else {
        localStorage.removeItem("token");
      }
      
      setAuthLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  return { user, authLoading };
};
