import React, { createContext, useContext, useState } from 'react';

interface ApiContextType {
    data: any;
    fetchData: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<any>(null);

    const fetchData = async () => {
        // Fetch data from API and update state
        // Example: const response = await fetch('your-api-url');
        // const result = await response.json();
        // setData(result);
    };

    return (
        <ApiContext.Provider value={{ data, fetchData }}>
            {children}
        </ApiContext.Provider>
    );
};

export const useApi = () => {
    const context = useContext(ApiContext);
    if (context === undefined) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};