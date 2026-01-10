import "dotenv/config";
import express from "express";
import energyGenerationRecordRouter from "./api/energy-generation-record";
import { globalErrorHandler } from "./api/middlewares/global-error-handling-middleware";
import { loggerMiddleware } from "./api/middlewares/logger-middleware";
import solarUnitRouter from "./api/solar-unit";
import { connectDB } from "./infrastructure/db";
import cors from "cors";
import webhooksRouter from "./api/webhooks";
import usersRouter from "./api/users";
import weatherRouter from "./api/weather";
import { invoiceRouter } from "./api/invoice";
import { initInvoiceScheduler } from "./jobs/invoice-scheduler";
import { initEnergySyncJob } from "./jobs/energy-sync-job";
import { initAnomalyDetectionJob } from "./jobs/anomaly-detection-job";

import { handleStripeWebhook } from "./application/payment";
import paymentRouter from "./api/payment";


import { clerkMiddleware } from "@clerk/express";

const server = express();

server.use(cors({ origin: "http://localhost:5173" }));
server.use(loggerMiddleware);
server.use(clerkMiddleware());

server.use("/api/webhooks", webhooksRouter);

// MUST be before express.json()
server.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

server.use(express.json());

server.use("/api/solar-units", solarUnitRouter);
server.use("/api/energy-generation-records", energyGenerationRecordRouter);
server.use("/api/users", usersRouter);
server.use("/api/weather", weatherRouter);
server.use("/api/invoices", invoiceRouter);
server.use("/api/payments", paymentRouter);

server.use(globalErrorHandler);

// Initialize automated jobs
initInvoiceScheduler();
initEnergySyncJob();
initAnomalyDetectionJob();

connectDB();

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
