// src/index.ts
import "dotenv/config";
import express10 from "express";

// src/api/energy-generation-record.ts
import express from "express";

// src/infrastructure/entities/EnergyGenerationRecord.ts
import mongoose from "mongoose";
var energyGenerationRecordSchema = new mongoose.Schema({
  solarUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SolarUnit",
    required: true
  },
  energyGenerated: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  intervalHours: {
    type: Number,
    default: 2,
    min: 0.1,
    max: 24
  }
});
var EnergyGenerationRecord = mongoose.model(
  "EnergyGenerationRecord",
  energyGenerationRecordSchema
);

// src/infrastructure/entities/SolarUnit.ts
import mongoose2 from "mongoose";
var solarUnitSchema = new mongoose2.Schema({
  userId: {
    type: mongoose2.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  installationDate: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"]
  },
  lastInvoiceDate: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
  // This adds createdAt and updatedAt fields
});
var SolarUnit = mongoose2.model("SolarUnit", solarUnitSchema);

// src/domain/errors/errors.ts
var NotFoundError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
};
var ValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
};
var UnauthorizedError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
  }
};

// src/application/energy-generation-record.ts
import mongoose3 from "mongoose";
var getAllEnergyGenerationRecordsBySolarUnitId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { groupBy } = req.query;
    if (!groupBy) {
      const energyGenerationRecords = await EnergyGenerationRecord.find({
        solarUnitId: id
      }).sort({ timestamp: -1 });
      res.status(200).json(energyGenerationRecords);
      return;
    }
    if (groupBy === "date") {
      const energyGenerationRecords = await EnergyGenerationRecord.aggregate([
        {
          $match: {
            solarUnitId: new mongoose3.Types.ObjectId(id)
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
              }
            },
            totalEnergyGenerated: { $sum: "$energyGenerated" }
          }
        },
        {
          $sort: { "_id.date": -1 }
        }
      ]);
      res.status(200).json(
        energyGenerationRecords.slice(
          0,
          parseInt(req.query.limit) || energyGenerationRecords.length
        )
      );
      return;
    }
  } catch (error) {
    next(error);
  }
};
var getCapacityFactorBySolarUnitId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);
    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    const capacity = solarUnit.capacity;
    const records = await EnergyGenerationRecord.aggregate([
      {
        $match: {
          solarUnitId: new mongoose3.Types.ObjectId(id)
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            }
          },
          totalEnergyGenerated: { $sum: "$energyGenerated" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);
    const capacityFactorData = records.map((record) => {
      const actualEnergy = record.totalEnergyGenerated;
      const theoreticalMax = capacity * 24;
      const capacityFactor = actualEnergy / theoreticalMax * 100;
      return {
        date: record._id.date,
        capacityFactor: parseFloat(capacityFactor.toFixed(2)),
        actualEnergy
      };
    });
    res.status(200).json(capacityFactorData);
  } catch (error) {
    next(error);
  }
};

// src/api/energy-generation-record.ts
var energyGenerationRecordRouter = express.Router();
energyGenerationRecordRouter.route("/solar-unit/:id").get(getAllEnergyGenerationRecordsBySolarUnitId);
energyGenerationRecordRouter.route("/capacity-factor/:id").get(getCapacityFactorBySolarUnitId);
var energy_generation_record_default = energyGenerationRecordRouter;

// src/api/middlewares/global-error-handling-middleware.ts
var globalErrorHandler = (err, req, res, next) => {
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
  return res.status(500).json({ message: "Internal server error", error: err.message });
};

// src/api/middlewares/logger-middleware.ts
var loggerMiddleware = (req, res, next) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url}`);
  next();
};

// src/api/solar-unit.ts
import express2 from "express";

// src/domain/dtos/solar-unit.ts
import { z } from "zod";
var CreateSolarUnitDto = z.object({
  serialNumber: z.string().min(1),
  installationDate: z.string().min(1),
  capacity: z.number(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"])
});
var UpdateSolarUnitDto = z.object({
  serialNumber: z.string().min(1),
  installationDate: z.string().min(1),
  capacity: z.number(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  userId: z.string().nullable().optional()
});
var GetAllEnergyGenerationRecordsQueryDto = z.object({
  groupBy: z.enum(["date"]).optional(),
  limit: z.string().min(1)
});

// src/infrastructure/entities/User.ts
import mongoose4 from "mongoose";
var userSchema = new mongoose4.Schema({
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  clerkUserId: {
    type: String,
    required: true,
    unique: true
  }
});
var User = mongoose4.model("User", userSchema);

// src/application/solar-unit.ts
import { getAuth } from "@clerk/express";
var getAllSolarUnits = async (req, res, next) => {
  try {
    const solarUnits = await SolarUnit.find();
    res.status(200).json(solarUnits);
  } catch (error) {
    next(error);
  }
};
var createSolarUnitValidator = (req, res, next) => {
  const result = CreateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};
var createSolarUnit = async (req, res, next) => {
  try {
    const data = req.body;
    const newSolarUnit = {
      serialNumber: data.serialNumber,
      installationDate: new Date(data.installationDate),
      capacity: data.capacity,
      status: data.status
    };
    const createdSolarUnit = await SolarUnit.create(newSolarUnit);
    res.status(201).json(createdSolarUnit);
  } catch (error) {
    next(error);
  }
};
var getSolarUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);
    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    res.status(200).json(solarUnit);
  } catch (error) {
    next(error);
  }
};
var getSolarUnitForUser = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const solarUnits = await SolarUnit.find({ userId: user._id });
    res.status(200).json(solarUnits[0]);
  } catch (error) {
    next(error);
  }
};
var updateSolarUnitValidator = (req, res, next) => {
  const result = UpdateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};
var updateSolarUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { serialNumber, installationDate, capacity, status, userId } = req.body;
    const solarUnit = await SolarUnit.findById(id);
    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(
      id,
      {
        serialNumber,
        installationDate: new Date(installationDate),
        capacity,
        status,
        userId: userId || null
      },
      { new: true }
    );
    res.status(200).json(updatedSolarUnit);
  } catch (error) {
    next(error);
  }
};
var deleteSolarUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);
    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    await SolarUnit.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// src/api/middlewares/authentication-middleware.ts
import { getAuth as getAuth2 } from "@clerk/express";
var authenticationMiddleware = (req, res, next) => {
  const auth = getAuth2(req);
  console.log("Authentication Middleware - Clerk User ID:", auth.userId);
  if (!auth.userId) {
    throw new UnauthorizedError("Unauthorized");
  }
  next();
};

// src/api/solar-unit.ts
var solarUnitRouter = express2.Router();
solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnitValidator, createSolarUnit);
solarUnitRouter.route("/me").get(authenticationMiddleware, getSolarUnitForUser);
solarUnitRouter.route("/:id").get(getSolarUnitById).put(updateSolarUnitValidator, updateSolarUnit).delete(deleteSolarUnit);
var solar_unit_default = solarUnitRouter;

// src/infrastructure/db.ts
import mongoose5 from "mongoose";
var connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://imashaperera09_db_user:1234@cluster0.sq36bbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose5.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error while connecting to MongoDB:", error);
  }
};

// src/index.ts
import cors from "cors";

// src/api/webhooks.ts
import express3 from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import Stripe from "stripe";

// src/infrastructure/entities/Invoice.ts
import mongoose6 from "mongoose";
var InvoiceSchema = new mongoose6.Schema({
  userId: {
    type: String,
    required: true
  },
  solarUnitId: {
    type: mongoose6.Schema.Types.ObjectId,
    ref: "SolarUnit",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  energyGenerated: {
    type: Number,
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED"],
    default: "PENDING"
  },
  stripePaymentIntentId: {
    type: String
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
var Invoice = mongoose6.model("Invoice", InvoiceSchema);

// src/api/webhooks.ts
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  typescript: true
});
var webhooksRouter = express3.Router();
webhooksRouter.post(
  "/clerk",
  express3.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const evt = await verifyWebhook(req);
      const { id } = evt.data;
      const eventType = evt.type;
      console.log(
        `Received webhook with ID ${id} and event type of ${eventType}`
      );
      if (eventType === "user.created") {
        const { id: id2 } = evt.data;
        const user = await User.findOne({ clerkUserId: id2 });
        if (user) {
          console.log("User already exists");
          return res.send("User already exists");
        }
        await User.create({
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          email: evt.data.email_addresses[0].email_address,
          clerkUserId: id2
        });
      }
      if (eventType === "user.updated") {
        const { id: id2 } = evt.data;
        await User.findOneAndUpdate({ clerkUserId: id2 }, {
          role: evt.data.public_metadata.role
        });
      }
      if (eventType === "user.deleted") {
        const { id: id2 } = evt.data;
        await User.findOneAndDelete({ clerkUserId: id2 });
      }
      return res.send("Webhook received");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).send("Error verifying webhook");
    }
  }
);
webhooksRouter.post(
  "/stripe",
  express3.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        event = req.body;
      }
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const invoiceId = paymentIntent.metadata.invoiceId;
        if (invoiceId) {
          await Invoice.findByIdAndUpdate(invoiceId, { status: "PAID" });
          console.log(`Invoice ${invoiceId} marked as PAID`);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return res.send();
  }
);
var webhooks_default = webhooksRouter;

// src/api/users.ts
import express4 from "express";

// src/application/users.ts
var getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// src/api/users.ts
var usersRouter = express4.Router();
usersRouter.route("/").get(getAllUsers);
var users_default = usersRouter;

// src/api/weather.ts
import express5 from "express";
var weatherRouter = express5.Router();
weatherRouter.get("/", async (req, res, next) => {
  try {
    const { lat = 52.52, lon = 13.41 } = req.query;
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,shortwave_radiation`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch weather data from Open-Meteo");
    }
    const data = await response.json();
    res.status(200).json(data.current);
  } catch (error) {
    next(error);
  }
});
var weather_default = weatherRouter;

// src/api/invoice.ts
import express6 from "express";
import Stripe2 from "stripe";

// src/jobs/invoice-scheduler.ts
import cron from "node-cron";
var generateInvoicesForAllUnits = async () => {
  const thirtyDaysAgo = /* @__PURE__ */ new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const unitsToInvoice = await SolarUnit.find({
    $or: [
      { lastInvoiceDate: { $exists: false } },
      { lastInvoiceDate: { $lt: thirtyDaysAgo } }
    ],
    status: "ACTIVE"
  });
  console.log(`Found ${unitsToInvoice.length} units to invoice.`);
  const results = {
    totalUnits: unitsToInvoice.length,
    successCount: 0,
    errorCount: 0,
    invoicesGenerated: 0,
    errors: []
  };
  for (const unit of unitsToInvoice) {
    try {
      const endDate = /* @__PURE__ */ new Date();
      const startDate = unit.lastInvoiceDate || unit.installationDate;
      const records = await EnergyGenerationRecord.find({
        solarUnitId: unit._id,
        timestamp: { $gte: startDate, $lte: endDate }
      });
      const totalEnergy = records.reduce((sum, record) => sum + record.energyGenerated, 0);
      if (totalEnergy <= 0) {
        console.log(`No energy generated for unit ${unit._id}, skipping invoice.`);
        continue;
      }
      const ratePerKwh = 0.15;
      const amount = totalEnergy * ratePerKwh;
      const user = await User.findById(unit.userId);
      if (!user) {
        console.error(`User not found for unit ${unit._id}, skipping invoice.`);
        results.errorCount++;
        results.errors.push({ unitId: unit._id.toString(), error: "User not found" });
        continue;
      }
      await Invoice.create({
        userId: user.clerkUserId,
        solarUnitId: unit._id,
        amount: parseFloat(amount.toFixed(2)),
        energyGenerated: parseFloat(totalEnergy.toFixed(2)),
        periodStart: startDate,
        periodEnd: endDate,
        status: "PENDING"
      });
      unit.lastInvoiceDate = endDate;
      await unit.save();
      results.successCount++;
      results.invoicesGenerated++;
      console.log(`Generated invoice for unit ${unit._id}`);
    } catch (error) {
      results.errorCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ unitId: unit._id.toString(), error: errorMessage });
      console.error(`Error generating invoice for unit ${unit._id}:`, error);
    }
  }
  return results;
};
var initInvoiceScheduler = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running automated invoice generation job...");
    try {
      const results = await generateInvoicesForAllUnits();
      console.log(
        `Invoice generation job completed. Generated ${results.invoicesGenerated} invoices. Success: ${results.successCount}, Errors: ${results.errorCount}`
      );
    } catch (error) {
      console.error("Error in automated invoice generation job:", error);
    }
  });
  console.log("Invoice scheduler initialized - will run daily at midnight");
};

// src/api/invoice.ts
var router = express6.Router();
var stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  typescript: true
});
router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});
router.post("/generate", async (req, res, next) => {
  try {
    const { solarUnitId } = req.body;
    const solarUnit = await SolarUnit.findById(solarUnitId);
    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found");
    }
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - 30);
    const records = await EnergyGenerationRecord.find({
      solarUnitId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    const totalEnergy = records.reduce((sum, record) => sum + record.energyGenerated, 0);
    const ratePerKwh = 0.15;
    const amount = totalEnergy * ratePerKwh;
    const user = await User.findById(solarUnit.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const invoice = await Invoice.create({
      userId: user.clerkUserId,
      solarUnitId,
      amount: parseFloat(amount.toFixed(2)),
      energyGenerated: parseFloat(totalEnergy.toFixed(2)),
      periodStart: startDate,
      periodEnd: endDate,
      status: "PENDING"
    });
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
});
router.post("/auto-generate", async (req, res, next) => {
  try {
    console.log("Manual auto-generation triggered...");
    const results = await generateInvoicesForAllUnits();
    res.status(200).json({
      message: `Auto-generation completed. Generated ${results.invoicesGenerated} invoices.`,
      results: {
        totalUnits: results.totalUnits,
        invoicesGenerated: results.invoicesGenerated,
        successCount: results.successCount,
        errorCount: results.errorCount,
        errors: results.errors
      }
    });
  } catch (error) {
    next(error);
  }
});
router.post("/create-payment-intent", async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }
    const paymentIntent = await stripe2.paymentIntents.create({
      amount: Math.round(invoice.amount * 100),
      // Amount in cents
      currency: "usd",
      metadata: { invoiceId: invoice._id.toString() },
      automatic_payment_methods: {
        enabled: true
      }
    });
    invoice.stripePaymentIntentId = paymentIntent.id;
    await invoice.save();
    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    next(error);
  }
});

// src/jobs/energy-sync-job.ts
import cron2 from "node-cron";
var DATA_API_URL = "http://localhost:8001/api";
var initEnergySyncJob = () => {
  cron2.schedule("5 */2 * * *", async () => {
    console.log("Running energy sync job...");
    try {
      const activeUnits = await SolarUnit.find({ status: "ACTIVE" });
      for (const unit of activeUnits) {
        try {
          const latestRecord = await EnergyGenerationRecord.findOne({ solarUnitId: unit._id }).sort({ timestamp: -1 });
          let url = `${DATA_API_URL}/energy-generation-records/solar-unit/${unit.serialNumber}`;
          if (latestRecord) {
            url += `?sinceTimestamp=${latestRecord.timestamp.toISOString()}`;
          }
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Failed to fetch data for unit ${unit.serialNumber}: ${response.statusText}`);
            continue;
          }
          const records = await response.json();
          if (records.length > 0) {
            const recordsToInsert = records.map((r) => ({
              solarUnitId: unit._id,
              energyGenerated: r.energyGenerated,
              timestamp: new Date(r.timestamp),
              intervalHours: r.intervalHours || 2
            }));
            await EnergyGenerationRecord.insertMany(recordsToInsert);
            console.log(`Synced ${recordsToInsert.length} records for unit ${unit.serialNumber}`);
          }
        } catch (error) {
          console.error(`Error syncing data for unit ${unit.serialNumber}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in energy sync job:", error);
    }
  });
};

// src/jobs/anomaly-detection-job.ts
import cron3 from "node-cron";

// src/infrastructure/entities/Anomaly.ts
import mongoose7 from "mongoose";
var anomalySchema = new mongoose7.Schema({
  solarUnitId: {
    type: mongoose7.Schema.Types.ObjectId,
    ref: "SolarUnit",
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["ZERO_GENERATION", "LOW_EFFICIENCY", "DATA_GAP", "OVER_CAPACITY_SPIKE"]
  },
  severity: {
    type: String,
    required: true,
    enum: ["CRITICAL", "WARNING", "INFO"]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ["OPEN", "RESOLVED"],
    default: "OPEN"
  },
  affectedPeriodStart: {
    type: Date,
    required: false
  },
  affectedPeriodEnd: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});
var Anomaly = mongoose7.model("Anomaly", anomalySchema);

// src/jobs/anomaly-detection-job.ts
var initAnomalyDetectionJob = () => {
  cron3.schedule("20 */2 * * *", async () => {
    console.log("Running anomaly detection job...");
    await runAnomalyDetection();
  });
};
var runAnomalyDetection = async (lookbackDays = 1) => {
  try {
    const activeUnits = await SolarUnit.find({ status: "ACTIVE" });
    for (const unit of activeUnits) {
      try {
        const lookbackDate = /* @__PURE__ */ new Date();
        lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
        const records = await EnergyGenerationRecord.find({
          solarUnitId: unit._id,
          timestamp: { $gte: lookbackDate }
        }).sort({ timestamp: 1 });
        if (records.length === 0) continue;
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          const hour = record.timestamp.getUTCHours();
          const energy = record.energyGenerated;
          const capacity = unit.capacity;
          const interval = record.intervalHours || 2;
          if (hour >= 8 && hour <= 18 && energy === 0) {
            await createAnomalyIfNotExists({
              solarUnitId: unit._id,
              type: "ZERO_GENERATION",
              severity: "CRITICAL",
              timestamp: record.timestamp,
              description: `Zero energy generated during daylight hours (${hour}:00).`,
              affectedPeriodStart: record.timestamp,
              affectedPeriodEnd: record.timestamp
            });
          }
          if (hour >= 11 && hour <= 15 && energy < capacity * interval * 0.1) {
            await createAnomalyIfNotExists({
              solarUnitId: unit._id,
              type: "LOW_EFFICIENCY",
              severity: "WARNING",
              timestamp: record.timestamp,
              description: `Low efficiency detected: ${energy}Wh generated (Capacity: ${capacity}W).`,
              affectedPeriodStart: record.timestamp,
              affectedPeriodEnd: record.timestamp
            });
          }
          if (energy > capacity * interval * 1.1) {
            await createAnomalyIfNotExists({
              solarUnitId: unit._id,
              type: "OVER_CAPACITY_SPIKE",
              severity: "WARNING",
              timestamp: record.timestamp,
              description: `Energy spike detected: ${energy}Wh exceeds capacity of ${capacity}W.`,
              affectedPeriodStart: record.timestamp,
              affectedPeriodEnd: record.timestamp
            });
          }
          if (i > 0) {
            const prevRecord = records[i - 1];
            const gapMs = record.timestamp.getTime() - prevRecord.timestamp.getTime();
            const expectedGapMs = interval * 60 * 60 * 1e3;
            if (gapMs > expectedGapMs * 1.5) {
              await createAnomalyIfNotExists({
                solarUnitId: unit._id,
                type: "DATA_GAP",
                severity: "INFO",
                timestamp: record.timestamp,
                description: `Data gap detected between ${prevRecord.timestamp.toISOString()} and ${record.timestamp.toISOString()}.`,
                affectedPeriodStart: prevRecord.timestamp,
                affectedPeriodEnd: record.timestamp
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error detecting anomalies for unit ${unit.serialNumber}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in anomaly detection job:", error);
  }
};
async function createAnomalyIfNotExists(anomalyData) {
  const startOfHour = new Date(anomalyData.timestamp);
  startOfHour.setMinutes(0, 0, 0);
  const endOfHour = new Date(anomalyData.timestamp);
  endOfHour.setMinutes(59, 59, 999);
  const existing = await Anomaly.findOne({
    solarUnitId: anomalyData.solarUnitId,
    type: anomalyData.type,
    timestamp: { $gte: startOfHour, $lte: endOfHour }
  });
  if (!existing) {
    await Anomaly.create(anomalyData);
    console.log(`[Anomaly Detected] ${anomalyData.type} for unit ${anomalyData.solarUnitId}`);
  }
}

// src/application/payment.ts
import Stripe3 from "stripe";
var stripe3 = new Stripe3(process.env.STRIPE_SECRET_KEY || "");
var createCheckoutSession = async (req, res) => {
  const { invoiceId } = req.body;
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }
  if (invoice.status === "PAID") {
    throw new ValidationError("Invoice already paid");
  }
  const session = await stripe3.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: Math.round(invoice.energyGenerated)
        // kWh as quantity
      }
    ],
    mode: "payment",
    return_url: `${process.env.FRONTEND_URL}/dashboard/invoices/complete?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      invoiceId: invoice._id.toString()
    }
  });
  return res.json({ clientSecret: session.client_secret });
};
var getSessionStatus = async (req, res) => {
  const { session_id } = req.query;
  if (!session_id || typeof session_id !== "string") {
    throw new ValidationError("Session ID is required");
  }
  const session = await stripe3.checkout.sessions.retrieve(session_id);
  return res.json({
    status: session.status,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total
  });
};
var handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe3.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    if (invoiceId && session.payment_status === "paid") {
      await Invoice.findByIdAndUpdate(invoiceId, {
        status: "PAID",
        paidAt: /* @__PURE__ */ new Date(),
        stripePaymentIntentId: session.payment_intent
      });
      console.log("Invoice marked as PAID:", invoiceId);
    }
  }
  return res.status(200).json({ received: true });
};

// src/api/payment.ts
import express7 from "express";
var router2 = express7.Router();
router2.post("/create-checkout-session", createCheckoutSession);
router2.get("/session-status", getSessionStatus);
var payment_default = router2;

// src/api/anomaly.ts
import express8 from "express";
import { getAuth as getAuth3 } from "@clerk/express";
var anomalyRouter = express8.Router();
anomalyRouter.get("/", async (req, res, next) => {
  try {
    const { type, severity, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    const anomalies = await Anomaly.find(filter).populate({
      path: "solarUnitId",
      populate: {
        path: "userId",
        model: "User"
      }
    }).sort({ timestamp: -1 });
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
});
anomalyRouter.get("/user", async (req, res, next) => {
  try {
    const auth = getAuth3(req);
    const clerkUserId = auth.userId;
    const user = await User.findOne({ clerkUserId });
    if (!user) throw new NotFoundError("User not found");
    const solarUnits = await SolarUnit.find({ userId: user._id });
    const unitIds = solarUnits.map((u) => u._id);
    const { type, severity, status } = req.query;
    const filter = { solarUnitId: { $in: unitIds } };
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    const anomalies = await Anomaly.find(filter).sort({ timestamp: -1 });
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
});
anomalyRouter.get("/solar-unit/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, severity, status } = req.query;
    const filter = { solarUnitId: id };
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    const anomalies = await Anomaly.find(filter).sort({ timestamp: -1 });
    res.status(200).json(anomalies);
  } catch (error) {
    next(error);
  }
});
anomalyRouter.patch("/:id/resolve", async (req, res, next) => {
  try {
    const { id } = req.params;
    const anomaly = await Anomaly.findByIdAndUpdate(id, { status: "RESOLVED" }, { new: true });
    if (!anomaly) throw new NotFoundError("Anomaly not found");
    res.status(200).json(anomaly);
  } catch (error) {
    next(error);
  }
});
var anomaly_default = anomalyRouter;

// src/index.ts
import { clerkMiddleware } from "@clerk/express";

// src/api/settings.ts
import express9 from "express";

// src/infrastructure/entities/SystemSetting.ts
import mongoose8, { Schema } from "mongoose";
var SystemSettingSchema = new Schema({
  appName: { type: String, default: "SolarNova Admin" },
  maintenanceMode: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  logRetention: { type: Number, default: 30 }
}, { timestamps: true });
var SystemSetting = mongoose8.model("SystemSetting", SystemSettingSchema);

// src/api/settings.ts
var settingsRouter = express9.Router();
settingsRouter.get("/", async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
});
settingsRouter.put("/", async (req, res, next) => {
  try {
    const { appName, maintenanceMode, emailNotifications, logRetention } = req.body;
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({ appName, maintenanceMode, emailNotifications, logRetention });
    } else {
      settings.appName = appName ?? settings.appName;
      settings.maintenanceMode = maintenanceMode ?? settings.maintenanceMode;
      settings.emailNotifications = emailNotifications ?? settings.emailNotifications;
      settings.logRetention = logRetention ?? settings.logRetention;
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
});
var settings_default = settingsRouter;

// src/index.ts
var server = express10();
server.use(cors({ origin: "http://localhost:5173" }));
server.use(loggerMiddleware);
server.use(clerkMiddleware());
server.use("/api/webhooks", webhooks_default);
server.post(
  "/api/stripe/webhook",
  express10.raw({ type: "application/json" }),
  handleStripeWebhook
);
server.use(express10.json());
server.use("/api/solar-units", solar_unit_default);
server.use("/api/energy-generation-records", energy_generation_record_default);
server.use("/api/users", users_default);
server.use("/api/weather", weather_default);
server.use("/api/invoices", router);
server.use("/api/payments", payment_default);
server.use("/api/anomalies", anomaly_default);
server.use("/api/settings", settings_default);
server.use(globalErrorHandler);
initInvoiceScheduler();
initEnergySyncJob();
initAnomalyDetectionJob();
connectDB();
var PORT = process.env.PORT || 8e3;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
