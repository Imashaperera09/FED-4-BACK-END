export const loggerMiddleware = (req, res, next) => {
    // Log method, url, and timestamp for better debugging
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
};
