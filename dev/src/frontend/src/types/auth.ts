export interface SignupRequest {
    email: string;
    password: string;
    lastname: string;
    firstname: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
}