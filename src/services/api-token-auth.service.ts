/**
 * API Token Authentication Service
 * Handles authentication using Deriv API tokens
 * Similar to app.binarytool.site implementation
 */

import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import type { ClientAccounts } from '@/app/types';

export interface AuthorizeResponse {
    authorize?: {
        loginid: string;
        currency: string;
        email: string;
        fullname: string;
        balance: number;
        country: string;
        account_list: Array<{
            loginid: string;
            currency?: string;
            is_virtual: number;
            is_disabled: number;
            account_type: string;
            landing_company_name: string;
            created_at?: number;
        }>;
        scopes: string[];
    };
    error?: {
        code: string;
        message: string;
    };
}

export interface TokenAuthResult {
    success: boolean;
    error?: string;
    data?: {
        loginid: string;
        currency: string;
        email: string;
        accounts: ClientAccounts;
    };
}

class APITokenAuthService {
    private static instance: APITokenAuthService;

    static getInstance(): APITokenAuthService {
        if (!APITokenAuthService.instance) {
            APITokenAuthService.instance = new APITokenAuthService();
        }
        return APITokenAuthService.instance;
    }

    /**
     * Authenticate user with API token
     * @param token - Deriv API token
     * @returns Authentication result with user data
     */
    async authenticateWithToken(token: string): Promise<TokenAuthResult> {
        if (!token || token.trim().length === 0) {
            return {
                success: false,
                error: 'API token is required',
            };
        }

        try {
            // Create API instance
            const api = generateDerivApiInstance();

            // Authorize with the token
            const response: AuthorizeResponse = await api.authorize(token.trim());

            // Check for errors
            if (response.error) {
                return {
                    success: false,
                    error: response.error.message || 'Authentication failed',
                };
            }

            // Check if authorization was successful
            if (!response.authorize) {
                return {
                    success: false,
                    error: 'Invalid response from server',
                };
            }

            const authData = response.authorize;

            // Build accounts structure compatible with existing code
            const clientAccounts: ClientAccounts = {};
            const accountsList: Record<string, string> = {};

            authData.account_list?.forEach(account => {
                // Store token as value for compatibility with V2GetActiveClientId
                accountsList[account.loginid] = token.trim();
                clientAccounts[account.loginid] = {
                    loginid: account.loginid,
                    token: token.trim(),
                    currency: account.currency,
                };
            });

            // Store authentication data in localStorage
            this.storeAuthData(token.trim(), authData.loginid, accountsList, clientAccounts);

            return {
                success: true,
                data: {
                    loginid: authData.loginid,
                    currency: authData.currency,
                    email: authData.email,
                    accounts: clientAccounts,
                },
            };
        } catch (error: any) {
            console.error('API Token authentication error:', error);
            return {
                success: false,
                error: error?.message || 'Failed to authenticate with token',
            };
        }
    }

    /**
     * Store authentication data in localStorage
     */
    private storeAuthData(
        token: string,
        loginid: string,
        accountsList: Record<string, string>,
        clientAccounts: ClientAccounts
    ): void {
        localStorage.setItem('authToken', token);
        localStorage.setItem('active_loginid', loginid);
        localStorage.setItem('accountsList', JSON.stringify(accountsList));
        localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));
    }

    /**
     * Get stored API token
     */
    getStoredToken(): string | null {
        return localStorage.getItem('authToken');
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = this.getStoredToken();
        const loginid = localStorage.getItem('active_loginid');
        return !!(token && loginid);
    }

    /**
     * Logout user and clear authentication data
     */
    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('active_loginid');
        localStorage.removeItem('accountsList');
        localStorage.removeItem('clientAccounts');
    }

    /**
     * Validate token format (basic validation)
     */
    validateTokenFormat(token: string): boolean {
        // Deriv API tokens typically start with a letter and contain alphanumeric characters
        const tokenRegex = /^[a-zA-Z0-9_-]+$/;
        return tokenRegex.test(token) && token.length > 10;
    }
}

export const apiTokenAuthService = APITokenAuthService.getInstance();
