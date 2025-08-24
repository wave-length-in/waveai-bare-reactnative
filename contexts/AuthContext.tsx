import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  userId: string;
  userName: string;
  mobileNumber: string;
  mobileNumberVerified: boolean;
  age: number;
  gender: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = async (userData: User) => {
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    setUserState(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("userData");
    setUserState(null);
  };

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem("userData");
      if (stored) {
        setUserState(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};