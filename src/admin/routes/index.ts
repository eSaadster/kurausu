/**
 * Admin routes aggregator
 */

import { Router } from "express";
import configRoutes from "./config.js";
import modelsRoutes from "./models.js";
import settingsRoutes from "./settings.js";
import sessionsRoutes from "./sessions.js";
import mcpRoutes from "./mcp.js";
import clicksRoutes from "./clicks.js";
import gripsRoutes from "./grips.js";

const router = Router();

// Mount route modules
router.use("/config", configRoutes);
router.use("/models", modelsRoutes);
router.use("/settings", settingsRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/mcp", mcpRoutes);
router.use("/clicks", clicksRoutes);
router.use("/grips", gripsRoutes);

export default router;
