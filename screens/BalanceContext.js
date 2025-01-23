import React, { createContext, useState } from 'react';

export const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
    const [balance, setBalance] = useState(0);
    const [userId, setUserId] = useState(null);

    const updateBalance = (newBalance) => {
        setBalance(parseFloat(newBalance));
    };

    return (
        <BalanceContext.Provider value={{ balance, setBalance: updateBalance, userId, setUserId }}>
            {children}
        </BalanceContext.Provider>
    );
};