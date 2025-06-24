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