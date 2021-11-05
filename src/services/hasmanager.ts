import * as bcrypt from 'bcryptjs';

export class HashManager {
  public async hash(text: string): Promise<string> {
    const rounds = 7;
    const salt = await bcrypt.genSalt(rounds);
    return bcrypt.hash(text, salt);
  }

  public async compare(text: string, hash: string): Promise<boolean> {
    return bcrypt.compare(text, hash);
  }
}
