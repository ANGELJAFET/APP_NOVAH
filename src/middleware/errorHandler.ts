import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, toAppError } from "../utils/AppError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Datos inválidos.",
      issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    return;
  }

  const appError: AppError = toAppError(err);
  if (appError.statusCode === 500) {
    console.error(err);
  }
  res.status(appError.statusCode).json({ code: appError.code, message: appError.message });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ code: "NOT_FOUND", message: "Recurso no encontrado." });
}
