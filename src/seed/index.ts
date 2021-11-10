import { seedDatabase } from './user-seed';

export async function generateSeed() {
  await seedDatabase();
}

generateSeed();
