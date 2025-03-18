import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import app from './app.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT+1}...`);
        server.close();
        app.listen(PORT+1, () => {
          console.log(`Server running on port ${PORT+1}`);
        });
      } else {
        console.error(err);
      }
    })
    .on('listening', () => {
      console.log(`Server running in development mode on port ${PORT}`);
    });
} else {
  console.log('Running in production mode - serverless environment');
} 