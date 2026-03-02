import { Router } from "express";
import { entry, exit } from "../controllers/parking.controller";
import { validate } from "../middleware/validate.middleware";
import { entrySchema, exitSchema } from "../../validation/parking.schema";

const router = Router();

router.post("/entry", validate(entrySchema), entry);
router.post("/exit", validate(exitSchema), exit);

export default router;
