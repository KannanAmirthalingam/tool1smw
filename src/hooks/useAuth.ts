import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updatePassword,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Attempting login with:', email);
      
      try {
        // Try to sign in first
        console.log('Trying to sign in...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful');
      } catch (signInError: any) {
        console.log('Sign in failed:', signInError.code, signInError.message);
        // If user doesn't exist and it's the default admin, create the account
        if (signInError.code === 'auth/user-not-found' && 
            email === 'storeadmin@toolinventory.com' && 
            password === 'Admin@123') {
          console.log('Creating default admin user...');
          await createUserWithEmailAndPassword(auth, email, password);
          console.log('Default admin user created successfully');
        } else {
          throw signInError;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await signOut(auth);
      console.log('Logout successful');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      console.log('Changing password...');
      await updatePassword(user, newPassword);
      console.log('Password changed successfully');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user
  };
};