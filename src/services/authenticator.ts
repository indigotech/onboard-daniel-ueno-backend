import * as jwt from 'jsonwebtoken';

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

  public getTokenData(token: string): AuthenticationData {
    const data = jwt.verify(token, process.env.JWT_KEY);
    return data as AuthenticationData;
  }
}
