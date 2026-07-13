import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as personController from "../controllers/person.controller";

export const personRouter = Router();

personRouter.use(requireAuth);
personRouter.get("/", personController.list);
personRouter.get("/:id", personController.getById);
personRouter.post("/", personController.create);
personRouter.put("/:id", personController.update);
personRouter.delete("/:id", personController.remove);
