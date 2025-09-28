import express from "express";

const app = express();
const PORT = 8001;

app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

app.get("/api/solar-units", (req, res) => {
    res.json([{ id: 1, name: "test solar unit" }]);
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
