import * as jwt from 'jsonwebtoken';
import { CustomError } from '../model/error';

export interface AuthenticationData {
  id: number;
  rememberMe: boolean;
}

export class Authenticator {
  public generate(input: AuthenticationData): string {
    const token = jwt.sign(input, process.env.JWT_KEY, {
      expiresIn: input.rememberMe
        ? process.env.ACCESS_TOKEN_EXPIRES_IN_REMEMBER_ME
        : process.env.ACCESS_TOKEN_EXPIRES_IN,
    });
    return token;
  }

  public isTokenValid(token: string) {
    if (!token) {
      throw new CustomError('Token not found', 401);
    }

    try {
      jwt.verify(token, process.env.JWT_KEY);
      return true;
    } catch {
      throw new CustomError('Invalid token', 401);
    }
  }
}
