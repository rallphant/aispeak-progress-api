// src/index.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import './supabaseClient'; // Initialize Supabase client
import progressRoutes from './routes/progressRoutes';

dotenv.config(); // To load environment variables from a .env file

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

app.get('/', (req: Request, res: Response) => {
  res.send('Aispeak Progress API is running!');
  return;
});

// Mount the progress routes
app.use('/progress', progressRoutes);
  
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
