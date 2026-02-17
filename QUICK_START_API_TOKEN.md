# Quick Start: API Token Login

## 🚀 Ready to Use!

Your API Token login is already implemented and ready to use. Here's how:

## For End Users

### Step 1: Get Your API Token
1. Go to https://app.deriv.com/account/api-token
2. Login to your Deriv account
3. Click "Create new token"
4. Select scopes: **Read**, **Trade**, **Payments**, **Admin**
5. Click "Create" and copy the token

### Step 2: Login to Your App
1. Open your application
2. Click the **"API Token"** button in the header
3. Paste your token in the input field
4. Click **"Login with Token"**
5. Wait for authentication (you'll see "Authenticating...")
6. Page reloads and you're logged in! 🎉

## For Developers

### Using in Your Code

#### Option 1: Use the Service
```typescript
import { apiTokenAuthService } from '@/services/api-token-auth.service';

// Login
const result = await apiTokenAuthService.authenticateWithToken('your-token');
if (result.success) {
  console.log('Logged in as:', result.data?.loginid);
}

// Check if authenticated
const isAuth = apiTokenAuthService.isAuthenticated();

// Logout
apiTokenAuthService.logout();
```

#### Option 2: Use the React Hook
```typescript
import { useApiTokenAuth } from '@/hooks/auth/useApiTokenAuth';

function MyComponent() {
  const { authenticate, isAuthenticating, error, logout } = useApiTokenAuth();

  const handleLogin = async (token: string) => {
    const result = await authenticate(token);
    if (result.success) {
      // Success!
    }
  };

  return (
    <div>
      {isAuthenticating && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Option 3: Use the UI Component
```typescript
import { ApiTokenLogin } from '@/components/auth';

function LoginPage() {
  return (
    <ApiTokenLogin
      onSuccess={() => alert('Login successful!')}
      onError={(error) => alert(error)}
    />
  );
}
```

## 🔍 What Happens Behind the Scenes

1. **Token Validation**: Checks if token format is valid
2. **API Call**: Calls Deriv's `authorize` endpoint
3. **Data Storage**: Stores account info in localStorage
4. **Session Setup**: Sets up authenticated session
5. **Page Reload**: Reloads to initialize with auth data

## 📦 What's Stored

After successful login, these are stored in localStorage:
- `authToken`: Your API token
- `active_loginid`: Current account ID
- `accountsList`: List of your accounts
- `clientAccounts`: Detailed account data

## ⚠️ Important Notes

- **Never share your API token** with anyone
- Tokens with **Admin scope** have full account access
- You can **revoke tokens** anytime from Deriv settings
- Tokens are stored **locally** in your browser

## 🎯 Testing

### Test with Demo Account
1. Get a token from a demo account
2. Test the login flow
3. Verify account data appears correctly

### Test Error Handling
1. Try with invalid token → Should show error
2. Try with empty token → Should show validation error
3. Try with expired token → Should show auth error

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid token format" | Token must be alphanumeric with `-` or `_` |
| "Authentication failed" | Token may be expired or revoked |
| "No account data" | Token needs Read, Trade, Payments, Admin scopes |
| Page doesn't reload | Check browser console for errors |

## 📚 More Information

- **Full Guide**: See `API_TOKEN_LOGIN_GUIDE.md`
- **Implementation Details**: See `API_TOKEN_IMPLEMENTATION_SUMMARY.md`
- **Deriv API Docs**: https://developers.deriv.com

## ✅ Checklist

- [x] Service layer implemented
- [x] React hook created
- [x] UI component built
- [x] Header updated
- [x] Error handling added
- [x] Documentation written
- [x] TypeScript types defined
- [x] Ready to use!

## 🎉 You're All Set!

The API Token login is fully functional and integrated into your app. Just click the "API Token" button in the header to try it out!
