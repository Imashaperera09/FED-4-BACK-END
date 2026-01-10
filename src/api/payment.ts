
import express from "express";
import { createCheckoutSession, getSessionStatus } from "../application/payment";
// import { authenticationMiddleware } from "./middlewares/authentication-middleware"; // Assuming this exists or similar

const router = express.Router();

// TODO: Add authenticationMiddleware once confirmed
router.post("/create-checkout-session", createCheckoutSession);
router.get("/session-status", getSessionStatus);

export default router;
