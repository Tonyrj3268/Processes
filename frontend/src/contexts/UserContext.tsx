// contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface UserData {
  userId: string;
  userName: string;
  accountName: string;
  avatarUrl: string;
  bio: string;
  isPublic: boolean;
  followersCount: number;
}

interface UserContextType {
  userData: UserData | null;
  updateUserData: (data: Partial<UserData>) => void;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserData(null);
        setIsLoading(false);
        return;
      }

      const decoded = jwtDecode<{ id: string }>(token);
      const userId = decoded.id;

      const response = await fetch(`/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      setUserData({
        userId: data._id,
        userName: data.userName,
        accountName: data.accountName,
        avatarUrl: data.avatarUrl || "/default_avatar.jpg",
        bio: data.bio || "尚未設定個人簡介",
        isPublic: data.isPublic || false,
        followersCount: data.followersCount ?? 0,
      });
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setUserData(null);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = (newData: Partial<UserData>) => {
    setUserData(prev => prev ? { ...prev, ...newData } : null);
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  return (
    <UserContext.Provider value={{ userData, updateUserData, refreshUserData, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
