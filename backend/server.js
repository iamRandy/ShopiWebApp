import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import express from 'express';
const app = express();

const PORT = import.meta.env.VITE_PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.post('/api/login', (req, res) => {
  // handle login logic
});

app.get('/api/products', (req, res) => {
  // send product data
});

// Serve React build (only if deploying frontend + backend together)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));