import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const AUTH_KEY = "@gpa_user_auth";
const SAVED_ACCOUNTS_KEY = "@gpa_saved_accounts";
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

function getGoogleRedirectUri(): string {
  if (Platform.OS === "web") {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) {
      const cleanDomain = domain.replace(/:5000$/, "");
      return `https://${cleanDomain}/auth`;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth`;
    }
    return "http://localhost:8081/auth";
  }
  
  return Linking.createURL("auth");
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  provider: "apple" | "google";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  savedAccountsCount: number;
  signInWithApple: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState<User[]>([]);

  useEffect(() => {
    loadUser();
    loadSavedAccounts();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedAccounts = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch {
      // Silent fail
    }
  };

  const addToSavedAccounts = async (userData: User) => {
    try {
      // Read directly from storage to avoid race conditions
      const stored = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
      const existingAccounts: User[] = stored ? JSON.parse(stored) : [];
      const filteredAccounts = existingAccounts.filter(acc => acc.id !== userData.id);
      const updated = [...filteredAccounts, userData];
      await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch {
      // Silent fail
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
      await addToSavedAccounts(userData);
    } catch {
      // Silent fail
    }
  };

  const fetchGoogleUserInfo = async (accessToken: string) => {
    try {
      const response = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await response.json();
      
      const userData: User = {
        id: userInfo.id,
        email: userInfo.email || null,
        name: userInfo.name || userInfo.given_name || null,
        provider: "google",
      };
      
      await saveUser(userData);
      return true;
    } catch (error) {
      console.error("Error fetching Google user info:", error);
      return false;
    }
  };

  const signInWithApple = useCallback(async (): Promise<boolean> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const userData: User = {
        id: credential.user,
        email: credential.email,
        name: credential.fullName?.givenName || credential.fullName?.familyName || null,
        provider: "apple",
      };

      if (userData.name) {
        await AsyncStorage.setItem(`@apple_name_${credential.user}`, userData.name);
      } else {
        const cachedName = await AsyncStorage.getItem(`@apple_name_${credential.user}`);
        if (cachedName) {
          userData.name = cachedName;
        }
      }

      await saveUser(userData);
      return true;
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        return false;
      }
      console.error("Apple Sign-In error:", error);
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const redirectUri = getGoogleRedirectUri();
      
      const state = await Crypto.getRandomBytesAsync(16).then(bytes => 
        Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      );
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&state=${state}`;

      console.log("Google Auth redirect URI:", redirectUri);
      console.log("Platform:", Platform.OS);
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        
        if (accessToken) {
          return await fetchGoogleUserInfo(accessToken);
        }
      }
      
      return false;
    } catch (error) {
      console.error("Google Sign-In error:", error);
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      setUser(null);
    } catch {
      // Silent fail
    }
  }, []);

  const savedAccountsCount = savedAccounts.length;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        savedAccountsCount,
        signInWithApple,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
