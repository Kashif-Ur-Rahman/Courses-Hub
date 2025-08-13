import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";

interface AuthContextType {
    token: string | null;
    setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType>({ token: null, setToken: () => { } });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

    const saveToken = (t: string) => {
        localStorage.setItem("token", t);
        setToken(t);
    };

    return <AuthContext.Provider value={{ token, setToken: saveToken }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
