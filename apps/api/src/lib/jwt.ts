import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET requis dans apps/api/.env");
}

const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "30d";

export type AuthPayload = { id: string; email: string };

export function sign(payload: AuthPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
}

export function verify(token: string): AuthPayload {
  return jwt.verify(token, SECRET) as AuthPayload;
}
