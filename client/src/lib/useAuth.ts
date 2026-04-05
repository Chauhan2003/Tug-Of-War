import { useState, useEffect, useCallback } from 'react';
import { getStoredUser, setStoredUser, isLoggedIn, apiLogout } from './api';

export function useAuth() {
  const [user, setUser] = useState<any>(getStoredUser());
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    setUser(getStoredUser());
    setLoggedIn(isLoggedIn());
  }, []);

  const updateUser = useCallback((userData: any) => {
    setStoredUser(userData);
    setUser(userData);
    setLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setLoggedIn(false);
  }, []);

  return { user, loggedIn, updateUser, logout };
}
