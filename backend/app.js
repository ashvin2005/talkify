import express from "express";
import cors from cors;

const app = express()
const server = createServer(app)

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["*"],
  credentials: true,
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));


server.listen(app.get("port"), () => {
  console.log(`🚀 Server listening on port ${app.get("port")}`);
});