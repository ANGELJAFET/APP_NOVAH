import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { AuthenticatedUser } from "../types";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token de autenticación no proporcionado.");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as AuthenticatedUser;
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Token de autenticación inválido o expirado.");
  }
}
