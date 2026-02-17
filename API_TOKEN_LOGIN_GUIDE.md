# API Token Login Implementation Guide

This guide explains how the API Token login functionality works in your application, similar to app.binarytool.site.

## Overview

The API Token login allows users to authenticate using their Deriv API tokens instead of going through the OAuth flow. This is useful for:
- Quick testing and development
- Automated trading bots
- Users who prefer direct API access
- Integration with third-party tools

## Architecture

### 1. Service Layer (`src/services/api-token-auth.service.ts`)
The core authentication service that handles:
- Token validation
- API authorization calls
- Storage of authentication data
- Session management

### 2. React Hook (`src/hooks/auth/useApiTokenAuth.ts`)
A custom hook that provides:
- Authentication state management
- Easy-to-use authentication methods
- Error handling
- Loading states

### 3. UI Component (`src/components/auth/ApiTokenLogin.tsx`)
A reusable component with:
- Token input field
- Show/hide password toggle
- Instructions for getting tokens
- Error handling and validation

## How It Works

### Authentication Flow

```
1. User enters API token
   ↓
2. Token format validation
   ↓
3. Call Deriv API authorize endpoint
   ↓
4. Receive user account data
   ↓
5. Store authentication data in localStorage
   ↓
6. Reload application with authenticated session
```

### Data Storage

The following data is stored in localStorage:
- `authToken`: The API token
- `active_loginid`: Current active account ID
- `accountsList`: List of all user accounts
- `clientAccounts`: Detailed account information

## Usage Examples

### Example 1: Using the Service Directly

```typescript
import { apiTokenAuthService } from '@/services/api-token-auth.service';

// Authenticate
const result = await apiTokenAuthService.authenticateWithToken('your-token-here');

if (result.success) {
  console.log('Logged in as:', result.data?.loginid);
  window.location.reload();
} else {
  console.error('Login failed:', result.error);
}

// Check authentication status
const isAuth = apiTokenAuthService.isAuthenticated();

// Logout
apiTokenAuthService.logout();
```

### Example 2: Using the React Hook

```typescript
import { useApiTokenAuth } from '@/hooks/auth/useApiTokenAuth';

function MyComponent() {
  const { authenticate, isAuthenticating, error, logout } = useApiTokenAuth();

  const handleLogin = async (token: string) => {
    const result = await authenticate(token);
    if (result.success) {
      // Handle success
    }
  };

  return (
    <div>
      {isAuthenticating && <p>Authenticating...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={() => handleLogin('token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Example 3: Using the UI Component

```typescript
import { ApiTokenLogin } from '@/components/auth';

function LoginPage() {
  return (
    <ApiTokenLogin
      onSuccess={() => console.log('Login successful!')}
      onError={(error) => console.error('Login failed:', error)}
      showInstructions={true}
      autoReload={true}
    />
  );
}
```

### Example 4: In a Modal (like in header.tsx)

```typescript
import { useState } from 'react';
import Modal from '@/components/shared_ui/modal';
import { apiTokenAuthService } from '@/services/api-token-auth.service';

function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!apiTokenAuthService.validateTokenFormat(apiToken)) {
      setError('Invalid token format');
      return;
    }

    const result = await apiTokenAuthService.authenticateWithToken(apiToken);
    
    if (result.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>API Token Login</button>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <input
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Enter API token"
        />
        {error && <p>{error}</p>}
        <button onClick={handleLogin}>Login</button>
      </Modal>
    </>
  );
}
```

## Getting API Tokens

Users can get their API tokens from:
1. Go to [https://app.deriv.com/account/api-token](https://app.deriv.com/account/api-token)
2. Create a new token with required scopes:
   - **Read**: View account information
   - **Trade**: Execute trades
   - **Payments**: Manage deposits/withdrawals
   - **Admin**: Full account access
3. Copy the generated token
4. Use it in your application

## Security Considerations

### Best Practices
- ✅ Store tokens in localStorage (not in cookies for XSS protection)
- ✅ Use password input type to hide tokens
- ✅ Validate token format before API calls
- ✅ Clear tokens on logout
- ✅ Handle token expiration gracefully

### What NOT to Do
- ❌ Don't expose tokens in URLs
- ❌ Don't log tokens to console in production
- ❌ Don't share tokens between users
- ❌ Don't commit tokens to version control

## API Response Structure

### Successful Authorization Response

```json
{
  "authorize": {
    "loginid": "CR123456",
    "currency": "USD",
    "email": "[email protected]",
    "fullname": "John Doe",
    "balance": 10000,
    "country": "us",
    "account_list": [
      {
        "loginid": "CR123456",
        "currency": "USD",
        "is_virtual": 0,
        "is_disabled": 0,
        "account_type": "trading",
        "landing_company_name": "svg"
      }
    ],
    "scopes": ["read", "trade", "payments", "admin"]
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "InvalidToken",
    "message": "The token you provided is invalid or has expired"
  }
}
```

## Integration with Existing Code

The API Token login integrates seamlessly with your existing authentication system:

1. **Header Component**: Already updated to use the new service
2. **API Base**: Automatically picks up stored tokens
3. **Client Store**: Works with token-based authentication
4. **OAuth Flow**: Can coexist with API token login

## Testing

### Manual Testing
1. Get a valid API token from Deriv
2. Click "API Token" button in header
3. Enter token and submit
4. Verify successful login and account data display

### Automated Testing
```typescript
import { apiTokenAuthService } from '@/services/api-token-auth.service';

describe('API Token Authentication', () => {
  it('should validate token format', () => {
    expect(apiTokenAuthService.validateTokenFormat('abc123')).toBe(false);
    expect(apiTokenAuthService.validateTokenFormat('a1-validtoken123')).toBe(true);
  });

  it('should authenticate with valid token', async () => {
    const result = await apiTokenAuthService.authenticateWithToken('valid-token');
    expect(result.success).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: "Invalid token format"
- **Solution**: Ensure token contains only alphanumeric characters, hyphens, and underscores

**Issue**: "Authentication failed"
- **Solution**: Check if token is expired or revoked in Deriv account settings

**Issue**: "Token works but no account data"
- **Solution**: Verify token has required scopes (Read, Trade, etc.)

**Issue**: "Login successful but page doesn't reload"
- **Solution**: Check browser console for errors, ensure `window.location.reload()` is called

## Comparison with app.binarytool.site

Your implementation now matches the app.binarytool.site pattern:

| Feature | app.binarytool.site | Your Implementation |
|---------|---------------------|---------------------|
| Token Input | ✅ | ✅ |
| Format Validation | ✅ | ✅ |
| API Authorization | ✅ | ✅ |
| Account Storage | ✅ | ✅ |
| Error Handling | ✅ | ✅ |
| Reusable Service | ✅ | ✅ |
| React Hook | ✅ | ✅ |
| UI Component | ✅ | ✅ |

## Next Steps

1. Test the implementation with real API tokens
2. Add token refresh logic if needed
3. Implement token expiration handling
4. Add analytics for login success/failure
5. Consider adding multi-account switching

## Support

For issues or questions:
- Check Deriv API documentation: [https://developers.deriv.com](https://developers.deriv.com)
- Review the code in `src/services/api-token-auth.service.ts`
- Check browser console for detailed error messages
