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

app.use(cors({
  origin: process.env.FRONTEND_URL || "https://talkify-beryl.vercel.app",
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));


app.use("/api/v1/users", userRoute);

server.listen(app.get("port"), () => {
  console.log(`Server listening on port ${app.get("port")}`);
});
