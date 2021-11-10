import { HashManager } from '../services';
import { getRepository } from 'typeorm';
import { User } from '../entity/user';

export async function seedDatabase() {
  const userRepository = getRepository(User);
  const hashManager = new HashManager();
  const users = [];

  for (let i = 1; i <= 50; i++) {
    const user = new User();
    user.name = `seed user ${i}`;
    user.email = `seed${i}@email.com.br`;
    user.password = await hashManager.hash('123456a');
    users.push(user);
  }
  try {
    await userRepository.save(users);
    console.info('seed database completed');
  } catch {
    console.error('error at saving the seeds');
  }
}
