import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// In Node.js scripts, suppress WebSocket by providing a no-op constructor
// The app (React Native/Expo) uses its own WebSocket natively
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class NoopWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

