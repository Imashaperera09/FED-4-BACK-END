import express from "express";

const server = express();

server.get("/api", (req, res) => {
    res.status(200).json({ message: "Hello, World!" });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});