import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Crypto from "expo-crypto";

WebBrowser.maybeCompleteAuthSession();

const AUTH_KEY = "@gpa_user_auth";
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  provider: "apple" | "google";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithApple: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
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

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
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
      const redirectUri = Linking.createURL("auth");
      const state = await Crypto.getRandomBytesAsync(16).then(bytes => 
        Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      );
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&state=${state}`;

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
