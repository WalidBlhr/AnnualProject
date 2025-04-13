import React, { createContext, useContext, ReactNode } from "react";

export interface ApiContextType {
    baseUrl: string;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";

    const value: ApiContextType = {
        baseUrl,
    };

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
    const context = useContext(ApiContext);
    if (!context) {
        throw new Error("useApi doit être utilisé dans un ApiProvider");
    }
    return context;
};
