import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { connectToSocket } from './src/controllers/socketManager.js';
import userRoute from './src/routes/userRoute.js';

const app = express();
const server = createServer(app);

connectToSocket(server);

app.use(cors());
app.use(express.json());
app.use('/api/v1/users', userRoute);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
