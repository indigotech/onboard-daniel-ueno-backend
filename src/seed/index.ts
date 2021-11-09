import { connection } from '../setup';
import { seedDatabase } from './user-seed';

async function generateSeed() {
  await connection();
  await seedDatabase();
}

generateSeed();
