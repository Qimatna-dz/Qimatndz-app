import * as fs from 'fs';
import * as path from 'path';

// Mock WebSocket globally for Node < 22 to bypass @supabase/supabase-js validation 
// (We only use standard HTTP REST calls, so real WebSocket is not needed)
(global as any).WebSocket = class {};

// Manually parse .env file at startup to be 100% hoisting-safe and dependency-free
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      // Ignore comments and empty lines
      if (!line.trim() || line.trim().startsWith('#')) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        let val = line.substring(equalIndex + 1).trim();
        // Remove surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  } else {
    console.warn(".env file not found at " + envPath);
  }
} catch (e) {
  console.error("Error loading .env manually:", e);
}
