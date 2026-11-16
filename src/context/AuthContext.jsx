// AgriTwin — Unified Authentication Context
// Supports 3 Farmer-Friendly Login Methods: Phone Number OTP, Email/Password, and Google Auth
import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseBridge } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const current = firebaseBridge.getCurrentUser();
    if (current) return current;
    try {
      const saved = localStorage.getItem('agritwin_demo_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = firebaseBridge.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, []);

  // 1. Email Login
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const u = await firebaseBridge.signIn(email, password);
      setUser(u);
      return u;
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 1b. Email Register / Create Account
  const registerWithEmail = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const u = await firebaseBridge.signUp(email, password);
      setUser(u);
      return u;
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Login
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const u = await firebaseBridge.signInWithGoogle();
      setUser(u);
      return u;
    } catch (err) {
      setAuthError(err.message || 'Google sign in was cancelled or failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Phone OTP Verification
  const verifyPhoneOtp = async (phoneNumber, otpCode) => {
    setLoading(true);
    setAuthError(null);
    try {
      const u = await firebaseBridge.verifyPhoneOtp(phoneNumber, otpCode);
      setUser(u);
      return u;
    } catch (err) {
      setAuthError(err.message || 'The OTP is incorrect. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Password Reset
  const resetPassword = async (email) => {
    setLoading(true);
    try {
      return await firebaseBridge.sendPasswordReset(email);
    } finally {
      setLoading(false);
    }
  };

  // 5. 1-Click Academic Demonstration Mode
  const loginDemo = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const u = await firebaseBridge.signInDemo();
      setUser(u);
      try {
        localStorage.setItem('agritwin_demo_user', JSON.stringify(u));
      } catch (e) {}
      return u;
    } finally {
      setLoading(false);
    }
  };

  // 6. Sign Out
  const logout = async () => {
    await firebaseBridge.signOut();
    try {
      localStorage.removeItem('agritwin_demo_user');
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isDemo: user?.isDemo ?? false,
      loading,
      authError,
      setAuthError,
      login: loginWithEmail,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      verifyPhoneOtp,
      resetPassword,
      loginDemo,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
