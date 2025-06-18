import axios from 'axios';
import {API_URL} from '../const';

export const signup = async (data: {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
}) => {
    const response = await axios.post(`${API_URL}/auth/signup`, {
        ...data,
        role: 0 // 0 = user par défaut
    });
    return response.data;
};
