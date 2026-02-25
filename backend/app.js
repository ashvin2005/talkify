import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";


dotenv.config();

import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoute from "./src/routes/userRoute.js";
import { admin } from "./src/firebase.js";

const app = express();
const server = createServer(app);


connectToSocket(server);

app.set("port", process.env.PORT || 8000);

// Configure CORS to allow both production and localhost origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://talkify-beryl.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));


app.use("/api/v1/users", userRoute);

server.listen(app.get("port"), () => {
  console.log(`Server listening on port ${app.get("port")}`);
});
