import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// User registration
export const registerUser = async (email, password) => {
    return axios.post(`${API_BASE_URL}/register`, { email, password });
};

// User login
export const loginUser = async (email, password) => {
    return axios.post(`${API_BASE_URL}/login`, { email, password });
};

// Fund account
export const fundAccount = async (userId, amount) => {
    const numericAmount = parseFloat(amount);
    return axios.post(`${API_BASE_URL}/fund`, { userId, amount: numericAmount });
};

// Fetch exchange rates
export const getExchangeRates = async () => {
    return axios.get(`${API_BASE_URL}/rates`);
};

// Buy currency
export const buyCurrency = async (userId, currency, amount, cost) => {
    const numericAmount = parseFloat(amount);
    const numericCost = parseFloat(cost);
    return axios.post(`${API_BASE_URL}/buy`, { userId, currency, amount: numericAmount, cost: numericCost });
};

// Sell currency
export const sellCurrency = async (userId, currency, amount) => {
    const numericAmount = parseFloat(amount);
    return axios.post(`${API_BASE_URL}/sell`, { userId, currency, amount: numericAmount });
};

// Get archived rates and transactions
export const getArchivedRates = async (userId) => {
    return axios.get(`${API_BASE_URL}/archived/${userId}`);
};

export const getHoldings = async (userId) => {
    return axios.get(`${API_BASE_URL}/holdings/${userId}`);
};