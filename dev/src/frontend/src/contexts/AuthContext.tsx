import axios from 'axios';
import {createContext, useContext, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {ACCESS_TOKEN_STORAGE_KEY, API_URL, REFRESH_TOKEN_STORAGE_KEY} from '../const';
import jwtDecode from 'jwt-decode';
import {useLocation, useNavigate} from 'react-router-dom';

interface AuthContextType {
    isAuthenticated: boolean;
    user: {
        userId: number;
        firstname: string;
        lastname: string;
        email: string;
        role: number;
        createdAt: Date;
    } | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: () => boolean;
};

interface LoginResponse {
    token: string;
    refresh_token: string;
};

interface DecodedToken {
  userId: number;
  email: string;
  role: number;
  firstname: string;
  lastname: string;
  createdAt: string;
  iat: number;
  exp: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post<LoginResponse>(
                API_URL + "/auth/login",
                {email, password}
            );

            const accessToken = res.data.token;
            localStorage.setItem("token", accessToken);
            localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.data.refresh_token);
            setIsAuthenticated(true);

            loadAccessTokenInfo(accessToken);
        } catch (e) {
            localStorage.removeItem("token");
            localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
            setIsAuthenticated(false);
            setUser(null);
            console.log(e);
            throw e;
        }
        
    };

    const logout = async () : Promise<void> => {
        try {
            await axios.delete(
                API_URL + "/auth/logout",
                {
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("token")
                    },
                }
            );
        } catch(e) {
            console.log(e);
            throw e;
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    const refresh = async () : Promise<void> => {
        try {
            const res = await axios.post<LoginResponse>(
                API_URL + "/auth/refresh",
                {
                    refresh_token: "Bearer " + localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
                }
            );
            const newAccesstoken = res.data.token;
            localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, newAccesstoken);
            localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.data.refresh_token);
            loadAccessTokenInfo(newAccesstoken);
        } catch (e) {
            localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
            throw e;
        }
    };

    const loadAccessTokenInfo = (accessToken : string) : void => {
        const decodedAccessToken = jwtDecode<DecodedToken>(accessToken);
        setUser({
            userId: decodedAccessToken.userId,
            email: decodedAccessToken.email,
            firstname: decodedAccessToken.firstname,
            lastname: decodedAccessToken.lastname,
            role: decodedAccessToken.role,
            createdAt: new Date(decodedAccessToken.createdAt),
        });
    };

    const isAdmin = () : boolean => user !== null && user.role === 1;

    useEffect(() => {
        const checkToken = async () => {
            setIsAuthChecking(true);

            const accessToken = localStorage.getItem("token");
            if (!accessToken) {
                setIsAuthChecking(false);
                setIsAuthenticated(false);
                return;
            }

            try {
                const decoded = jwtDecode<DecodedToken>(accessToken);
                const now = Date.now() / 1000;

                if (decoded.exp < now) {
                    await refresh();
                } else if (user === null) {
                    loadAccessTokenInfo(accessToken);
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.log(e);
                await logout();
                navigate('/login');
                window.location.reload();
                return;
            }

            setIsAuthChecking(false);
        };

        checkToken();
    }, [location.pathname]);

    if (isAuthChecking) {
        return <div>Chargement...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
