import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    // Start auth check immediately but don't block rendering
    const timer = setTimeout(() => {
      checkAppState();
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // Check if user is authenticated
      const isAuth = await base44.auth.isAuthenticated();
      
      if (isAuth) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
      
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setIsLoadingPublicSettings(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated with timeout
      setIsLoadingAuth(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      );
      
      const authPromise = base44.auth.me();
      const currentUser = await Promise.race([authPromise, timeoutPromise]);
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      
      // Check if user exists in interns, experts, or managers
      if (currentUser?.email) {
        const [interns, experts, managers] = await Promise.all([
          base44.entities.Intern.filter({ email: currentUser.email }),
          base44.entities.Expert.filter({ email: currentUser.email }),
          base44.entities.Manager.filter({ email: currentUser.email }),
        ]);

        // If user not found in any list, create access request
        if (interns.length === 0 && experts.length === 0 && managers.length === 0) {
          const existing = await base44.entities.AccessRequest.filter({ email: currentUser.email });
          if (existing.length === 0) {
            await base44.entities.AccessRequest.create({
              email: currentUser.email,
              full_name: currentUser.full_name || currentUser.email,
              status: 'pending'
            });
          }
          
          // Set error to show pending access page
          setAuthError({
            type: 'user_not_registered',
            message: 'Pending access approval'
          });
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};