import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string;
    status?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: async () => { },
    logout: async () => { },
    isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('authToken');
            const storedUser = await AsyncStorage.getItem('userData');

            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                setAuthToken(storedToken); // Set global axios header
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, newUser: User) => {
        try {
            setToken(newToken);
            setUser(newUser);
            setAuthToken(newToken);

            await AsyncStorage.setItem('authToken', newToken);
            await AsyncStorage.setItem('userData', JSON.stringify(newUser));
        } catch (error) {
            console.error('Login storage error:', error);
        }
    };

    const logout = async () => {
        try {
            setToken(null);
            setUser(null);
            setAuthToken(null);
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
        } catch (error) {
            console.error('Logout storage error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
