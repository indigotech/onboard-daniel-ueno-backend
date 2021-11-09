import { connection } from '../setup';
import { seedDatabase } from './user-seed';

export async function generateSeed() {
  const dbConnection = await connection();
  await seedDatabase();
  await dbConnection.close();
}

generateSeed();
