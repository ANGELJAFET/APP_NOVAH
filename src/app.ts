import cors from "cors";
import express, { Express } from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { personRouter } from "./routes/person.routes";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/persons", personRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
