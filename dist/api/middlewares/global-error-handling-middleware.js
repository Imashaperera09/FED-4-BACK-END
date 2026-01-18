export const globalErrorHandler = (err, req, res, next) => {
    console.error("=== ERROR CAUGHT ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("==================");
    if (err.name === "NotFoundError") {
        return res.status(404).json({ message: err.message });
    }
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({ message: err.message });
    }
    // Handle other errors
    return res.status(500).json({ message: "Internal server error", error: err.message });
};
