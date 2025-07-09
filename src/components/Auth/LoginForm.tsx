import { useState, useEffect, createContext, useContext } from 'react';

// Simple user type
interface User {
  email: string;
  isAuthenticated: boolean;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Valid credentials (you can expand this to support multiple users)
const VALID_CREDENTIALS = [
  { email: 'storeadmin@toolinventory.com', password: 'Admin@123' },
  { email: 'admin@toolinventory.com', password: 'Admin@123' }
];

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in on app start
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    if (isAuthenticated && userEmail) {
      setUser({
        email: userEmail,
        isAuthenticated: true
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find matching credentials
      const validUser = VALID_CREDENTIALS.find(
        cred => cred.email === email && cred.password === password
      );

      if (validUser) {
        // Login successful
        const userData: User = {
          email: email,
          isAuthenticated: true
        };

        setUser(userData);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
      } else {
        // Invalid credentials
        throw new Error('Invalid credentials. Please check your email and password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    setError('');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook to check if user is authenticated
export const useRequireAuth = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  }, [user]);

  return user;
};

// Component to protect routes
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user?.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};