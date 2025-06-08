import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import express from 'express';
const app = express();

const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(cors({
  origin: "*", // or use "*" during dev only
  // credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.post('/api/login/google', (req, res) => {
  console.log("Google login endpoint hit!:", req.body);
  res.status(200).json({message: "ok!"})
});

// app.get('/api/products', (req, res) => {
//   // send product data
// });

// Serve React build (only if deploying frontend + backend together)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for React Router
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));