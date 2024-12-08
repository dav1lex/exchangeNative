import React, { createContext, useState, useEffect } from 'react';

export const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
    const [balance, setBalance] = useState(0); // User balance
    const [userId, setUserId] = useState(null); // Dynamic user ID

    return (
        <BalanceContext.Provider value={{ balance, setBalance, userId, setUserId }}>
            {children}
        </BalanceContext.Provider>
    );
};
