/**
 * React Hook for API Token Authentication
 * Provides easy access to API token authentication functionality
 */

import { useState, useCallback } from 'react';
import { apiTokenAuthService, type TokenAuthResult } from '@/services/api-token-auth.service';

export interface UseApiTokenAuthReturn {
    isAuthenticating: boolean;
    error: string | null;
    authenticate: (token: string) => Promise<TokenAuthResult>;
    logout: () => void;
    isAuthenticated: boolean;
    validateToken: (token: string) => boolean;
}

export const useApiTokenAuth = (): UseApiTokenAuthReturn => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const authenticate = useCallback(async (token: string): Promise<TokenAuthResult> => {
        setIsAuthenticating(true);
        setError(null);

        try {
            const result = await apiTokenAuthService.authenticateWithToken(token);
            
            if (!result.success) {
                setError(result.error || 'Authentication failed');
            }
            
            return result;
        } catch (err: any) {
            const errorMessage = err?.message || 'An unexpected error occurred';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const logout = useCallback(() => {
        apiTokenAuthService.logout();
        setError(null);
    }, []);

    const validateToken = useCallback((token: string): boolean => {
        return apiTokenAuthService.validateTokenFormat(token);
    }, []);

    const isAuthenticated = apiTokenAuthService.isAuthenticated();

    return {
        isAuthenticating,
        error,
        authenticate,
        logout,
        isAuthenticated,
        validateToken,
    };
};
