import express from "express";
import { listBatches } from "../controllers/batch.controller.js";

const router = express.Router();

router.get("/", listBatches);

export default router;
