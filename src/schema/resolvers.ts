import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { HashManager, validator } from '../services';
import { CustomError } from '../model/error';

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
        throw new CustomError('wrong password format', 400);
      }

      if (!validator.email(email)) {
        throw new CustomError('wrong email format', 400);
      }

      const userRepository = getRepository(User);
      const emailAlreadyExists = await userRepository.findOne({ email });
      if (emailAlreadyExists) {
        return new CustomError('email already exists', 409);
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
