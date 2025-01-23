import axios from 'axios';

const API_BASE_URL = 'https://exchangenative.onrender.com';

export const registerUser = async (email, password) => {
    try {
        console.log('Attempting to register:', { email });
        const response = await axios.post(`${API_BASE_URL}/register`, {
            email: email.trim().toLowerCase(),
            password
        });
        console.log('Registration response:', response.data);
        return response;
    } catch (error) {
        console.error('Registration error:', {
            status: error.response?.status,
            data: error.response?.data,
            error: error.message
        });
        throw error;
    }
};

export const loginUser = async (email, password) => {
    return axios.post(`${API_BASE_URL}/login`, { email, password });
};

export const fundAccount = async (userId, amount) => {
    const numericAmount = parseFloat(amount);
    return axios.post(`${API_BASE_URL}/fund`, { userId, amount: numericAmount });
};

export const getExchangeRates = async () => {
    return axios.get(`${API_BASE_URL}/rates`);
};

export const buyCurrency = async (userId, currency, amount, cost) => {
    const numericAmount = parseFloat(amount);
    const numericCost = parseFloat(cost);
    return axios.post(`${API_BASE_URL}/buy`, { userId, currency, amount: numericAmount, cost: numericCost });
};

export const sellCurrency = async (userId, currency, amount) => {
    const numericAmount = parseFloat(amount);
    return axios.post(`${API_BASE_URL}/sell`, { userId, currency, amount: numericAmount });
};

export const getArchivedRates = async (userId) => {
    return axios.get(`${API_BASE_URL}/archived/${userId}`);
};

export const getHoldings = async (userId) => {
    return axios.get(`${API_BASE_URL}/holdings/${userId}`);
};