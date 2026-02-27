import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c97e8718/health", (c) => {
  return c.json({ status: "ok" });
});

// ========== AUTH ROUTES ==========

// Sign up new user
app.post("/make-server-c97e8718/auth/signup", async (c) => {
  try {
    const { email, password, name, age } = await c.req.json();

    if (!email || !password || !name || !age) {
      return c.json({ error: 'Email, password, name, and age are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, age },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      user: data.user,
      message: 'User created successfully' 
    });
  } catch (error) {
    console.log('Signup exception:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Sign in user
app.post("/make-server-c97e8718/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('Sign in error:', error);
      return c.json({ error: error.message }, 401);
    }

    return c.json({ 
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.log('Sign in exception:', error);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Get current user
app.get("/make-server-c97e8718/auth/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.log('Get user exception:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// ========== USER DATA ROUTES ==========

// Save user data
app.post("/make-server-c97e8718/user/data", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized: No access token' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }

    const userData = await c.req.json();
    
    // Save user data to KV store with user ID as prefix
    await kv.set(`user_data:${user.id}`, userData);

    return c.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.log('Save user data error:', error);
    return c.json({ error: 'Failed to save user data' }, 500);
  }
});

// Get user data
app.get("/make-server-c97e8718/user/data", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized: No access token' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }

    // Get user data from KV store
    const userData = await kv.get(`user_data:${user.id}`);

    if (!userData) {
      return c.json({ data: null });
    }

    return c.json({ data: userData });
  } catch (error) {
    console.log('Get user data error:', error);
    return c.json({ error: 'Failed to get user data' }, 500);
  }
});

Deno.serve(app.fetch);