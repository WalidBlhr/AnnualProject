import axios from 'axios';
import { API_URL } from '../const';

const apiClient = axios.create({
    baseURL: API_URL, // Replace with your API base URL
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchData = async (endpoint: string) => {
    try {
        const response = await apiClient.get(endpoint);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching data: ${error}`);
    }
};

export const submitData = async (endpoint: string, data: any) => {
    try {
        const response = await apiClient.post(endpoint, data);
        return response.data;
    } catch (error) {
        throw new Error(`Error submitting data: ${error}`);
    }
};

export const fetchAllUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get('/users?limit=1000&page=1', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.data;
    } catch (error) {
        throw new Error(`Error fetching users: ${error}`);
    }
};

export const createTicTacToeGame = async (opponentId: number) => {
    const token = localStorage.getItem('token');
    const response = await apiClient.post('/tictactoe', { opponentId }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getTicTacToeGame = async (opponentId: number) => {
    const token = localStorage.getItem('token');
    const response = await apiClient.get(`/tictactoe?opponentId=${opponentId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const playTicTacToeMove = async (gameId: number, index: number) => {
    const token = localStorage.getItem('token');
    const response = await apiClient.put(`/tictactoe/${gameId}/move`, { index }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};