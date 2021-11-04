import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { HashManager, validator } from '../services';

const hello = {
  ptBr: 'olar',
  en: 'Hello, World',
};

export const resolvers = {
  Query: {
    hello: () => hello,
  },

  Mutation: {
    async createUser(_parent: any, args: { data: { name: string; email: string; password: string } }) {
      const { name, email, password } = args.data;
      if (!validator.password(password)) {
        throw new Error('wrong password format');
      }

      if (!validator.email(email)) {
        throw new Error('wrong email format');
      }

      const userRepository = getRepository(User);
      const emailAlreadyExists = await userRepository.findOne({ email });
      if (emailAlreadyExists) {
        return new Error('email already exists');
      }

      const hashManager = new HashManager();
      const hashPassword = await hashManager.hash(password);

      const user = new User();
      user.name = name;
      user.email = email;
      user.password = hashPassword;
      return userRepository.save(user);
    },
  },
};
