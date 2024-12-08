import axios from 'axios';

const API_BASE_URL = 'https://exchangenative.onrender.com'; // Replace with your server's address if needed

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
    return axios.post(`${API_BASE_URL}/fund`, { userId, amount });
};

// Fetch exchange rates
export const getExchangeRates = async () => {
    return axios.get(`${API_BASE_URL}/rates`);
};

// Buy currency
export const buyCurrency = async (userId, currency, amount, cost) => {
    return axios.post(`${API_BASE_URL}/buy`, { userId, currency, amount, cost });
};

//Sell curr
export const sellCurrency = async (userId, currency, amount) => {
    return axios.post(`${API_BASE_URL}/sell`, { userId, currency, amount });
};

// Get archived rates and transactions
export const getArchivedRates = async (userId) => {
    return axios.get(`${API_BASE_URL}/archived/${userId}`);
};
