/**
 * API Token Login Component
 * Reusable component for API token authentication
 * Based on app.binarytool.site implementation pattern
 */

import React, { useState } from 'react';
import { useApiTokenAuth } from '@/hooks/auth/useApiTokenAuth';
import './ApiTokenLogin.scss';

interface ApiTokenLoginProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    showInstructions?: boolean;
    autoReload?: boolean;
}

export const ApiTokenLogin: React.FC<ApiTokenLoginProps> = ({
    onSuccess,
    onError,
    showInstructions = true,
    autoReload = true,
}) => {
    const [token, setToken] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { isAuthenticating, error, authenticate, validateToken } = useApiTokenAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token.trim()) {
            onError?.('Please enter an API token');
            return;
        }

        if (!validateToken(token.trim())) {
            onError?.('Invalid token format');
            return;
        }

        const result = await authenticate(token.trim());

        if (result.success) {
            onSuccess?.();
            if (autoReload) {
                window.location.reload();
            }
        } else {
            onError?.(result.error || 'Authentication failed');
        }
    };

    return (
        <div className='api-token-login'>
            <form onSubmit={handleSubmit} className='api-token-form'>
                <div className='form-group'>
                    <label htmlFor='api-token'>Deriv API Token</label>
                    <div className='input-wrapper'>
                        <input
                            id='api-token'
                            type={showPassword ? 'text' : 'password'}
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            placeholder='Enter your API token'
                            disabled={isAuthenticating}
                            className={error ? 'error' : ''}
                        />
                        <button
                            type='button'
                            className='toggle-visibility'
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide token' : 'Show token'}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    {error && <span className='error-message'>{error}</span>}
                </div>

                <button type='submit' className='submit-button' disabled={isAuthenticating || !token.trim()}>
                    {isAuthenticating ? 'Authenticating...' : 'Login with Token'}
                </button>
            </form>

            {showInstructions && (
                <div className='instructions'>
                    <h4>📌 How to get your API token:</h4>
                    <ol>
                        <li>
                            <a
                                href='https://app.deriv.com/account/api-token'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Go to Deriv API Token page
                            </a>
                        </li>
                        <li>Create a new token with required scopes (Read, Trade, Payments, Admin)</li>
                        <li>Copy the generated token</li>
                        <li>Paste it in the field above</li>
                    </ol>

                    <div className='info-box'>
                        <strong>⚠️ Important:</strong>
                        <ul>
                            <li>Never share your API token with anyone</li>
                            <li>Tokens with Admin scope have full account access</li>
                            <li>You can revoke tokens anytime from your Deriv account</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
