import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import manufacturersRouter from "./api/routes/manufacturers.js";
import retailersRouter from "./api/routes/retailers.js";
import productsRouter from "./api/routes/products.js";
import ordersRouter from "./api/routes/orders.js";
import orderItemsRouter from "./api/routes/orderItems.js";
import uipathRouter from "./api/routes/uipath.js";
import logsRouter from "./api/routes/logs.js";
import invoicesRouter from "./api/routes/invoices.js";
import notificationsRouter from "./api/routes/notifications.js";
import validationRouter from "./api/routes/validation.js";
import testRouter from "./api/routes/test.js";
import { verifyEmailConfig } from "./services/emailService.js";

dotenv.config();

const app = express();

// Verify email configuration on startup
// This is async but we don't need to await it - just run it in the background
verifyEmailConfig()
  .then(result => console.log('Email configuration verified on startup'))
  .catch(error => {
    console.error('WARNING: Email configuration verification failed on startup:', error.message);
    console.error('Emails may not work correctly. Please check your EMAIL_* environment variables.');
    // We don't exit the app since email might not be critical for all operations
  });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
}));
app.use(express.json({ 
    type: ['application/json', 'text/plain'] // Accept both JSON and plain text
}));
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded bodies

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/manufacturers", manufacturersRouter);
app.use("/api/retailers", retailersRouter);
// app.use("/api/products", productsRouter);  // Remove
app.use("/api/orders", ordersRouter);
app.use("/api/order-items", orderItemsRouter);
// app.use("/api/uipath", uipathRouter);      // Remove
// app.use("/api/logs", logsRouter);          // Remove 
// app.use("/api/invoices", invoicesRouter);  // Remove
// app.use("/api/notifications", notificationsRouter); // Remove
// app.use("/api/validation", validationRouter);       // Remove
app.use('/api/test', testRouter);  // Keep this as it's in use

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

export default app;
