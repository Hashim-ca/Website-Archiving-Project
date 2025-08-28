import express from 'express';
import archiveRoutes from './routes/archive';
import websiteRoutes from './routes/websites';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api', archiveRoutes);
app.use('/api', websiteRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Website Archiving Project' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
