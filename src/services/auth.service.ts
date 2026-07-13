import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { RowDataPacket } from "mysql2/promise";
import { pool } from "../config/db";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { LoginDTO } from "../validators/auth.validator";

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
}

export async function login(input: LoginDTO): Promise<{ token: string; username: string }> {
  const [results] = await pool.query<[UserRow[]]>("CALL sp_user_get_by_username(?)", [
    input.username,
  ]);
  const userRow = results[0][0];

  if (!userRow) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos.");
  }

  const passwordMatches = await bcrypt.compare(input.password, userRow.password_hash);
  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos.");
  }

  const token = jwt.sign(
    { id: userRow.id, username: userRow.username },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } as SignOptions
  );

  return { token, username: userRow.username };
}
