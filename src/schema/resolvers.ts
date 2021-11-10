import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { Authenticator, HashManager, validator } from '../services';
import { CustomError } from '../model/error';

const hello = {
  ptBr: 'olar',
  en: 'Hello, World',
};

export const resolvers = {
  Query: {
    hello: () => hello,

    async user(_parent, args: { data: { id: number } }, context: { token: string }) {
      new Authenticator().isTokenValid(context.token);

      const userRepository = getRepository(User);
      const user = await userRepository.findOne({ id: args.data.id });

      if (!user) {
        throw new CustomError('user not found', 404);
      }
      return user;
    },

    async users(_parent, args: { data: { limit: number; page: number } }, context: { token: string }) {
      new Authenticator().isTokenValid(context.token);
      const page = args.data.page ?? 1;
      const take = args.data.limit ?? 10;
      const skip = take * (page - 1);
      if (page < 0) {
        throw new CustomError(`page must not be negative`, 400);
      }
      if (take <= 0) {
        throw new CustomError(`limit must be higher than zero`, 400);
      }

      const userRepository = getRepository(User);
      const [users, count] = await userRepository.findAndCount({ order: { name: 'ASC' }, skip, take });

      const totalPage = Math.floor(count / take);
      const hasPreviousPage = page > 1;
      const hasNextPage = page < totalPage;

      const result = {
        users,
        page,
        totalPage,
        hasPreviousPage,
        hasNextPage,
      };

      return result;
    },
  },

  Mutation: {
    async createUser(
      _parent: any,
      args: { data: { name: string; email: string; password: string } },
      context: { token: string },
    ) {
      new Authenticator().isTokenValid(context.token);

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
      const hashedPassword = await hashManager.hash(password);

      const user = new User();
      user.name = name;
      user.email = email;
      user.password = hashedPassword;
      return userRepository.save(user);
    },

    async login(_parent: any, args: { data: { email: string; password: string; rememberMe?: boolean } }) {
      const { email, password, rememberMe } = args.data;
      if (!validator.password(password)) {
        throw new CustomError('wrong password format', 400);
      }

      if (!validator.email(email)) {
        throw new CustomError('wrong email format', 400);
      }

      const userRepository = getRepository(User);
      const databaseUser = await userRepository.findOne({ email });
      if (!databaseUser) {
        return new CustomError('e-mail or password not correct', 401);
      }
      const hashManager = new HashManager();
      const correctPassword = await hashManager.compare(password, databaseUser.password);
      if (!correctPassword) {
        return new CustomError('e-mail or password not correct', 401);
      }

      const authenticator = new Authenticator();
      const token = authenticator.generate({ id: databaseUser.id, rememberMe });

      const response = {
        login: { user: { id: databaseUser.id, name: databaseUser.name, email: databaseUser.email }, token },
      };

      return response;
    },
  },
};
