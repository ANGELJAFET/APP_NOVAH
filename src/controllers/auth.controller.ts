import { NextFunction, Request, Response } from "express";
import { loginSchema } from "../validators/auth.validator";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
