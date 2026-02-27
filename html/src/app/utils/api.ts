import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from './supabase-client';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c97e8718`;

export interface SignupData {
  email: string;
  password: string;
  name: string;
  age: number;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResponse {
  session?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      user_metadata: {
        name: string;
        age: number;
      };
    };
  };
  user?: any;
  error?: string;
}

// Sign up new user (using Supabase client-side SDK)
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  try {
    // First, create user via backend to set metadata
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Signup error:', result);
      return { error: result.error || 'Signup failed' };
    }

    return { user: result.user };
  } catch (error) {
    console.error('Signup exception:', error);
    return { error: 'Network error during signup' };
  }
};

// Sign in user (using Supabase client-side SDK)
export const signin = async (data: SigninData): Promise<AuthResponse> => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('Signin error:', error);
      return { error: error.message || 'Invalid credentials' };
    }

    if (!authData.session) {
      return { error: 'No session created' };
    }

    return { 
      session: authData.session,
      user: authData.user,
    };
  } catch (error) {
    console.error('Signin exception:', error);
    return { error: 'Network error during signin' };
  }
};

// Get current session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Get session exception:', error);
    return null;
  }
};

// Sign out
export const signout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Sign out exception:', error);
    return false;
  }
};

// Save user data
export const saveUserData = async (accessToken: string, data: any): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/user/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Save user data error:', result);
      return { success: false, error: result.error || 'Failed to save data' };
    }

    return { success: true };
  } catch (error) {
    console.error('Save user data exception:', error);
    return { success: false, error: 'Network error while saving data' };
  }
};

// Get user data
export const getUserData = async (accessToken: string): Promise<{ data: any; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/user/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Get user data error:', result);
      return { data: null, error: result.error || 'Failed to get data' };
    }

    return result;
  } catch (error) {
    console.error('Get user data exception:', error);
    return { data: null, error: 'Network error while getting data' };
  }
};