import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';
import { ApolloServer } from 'apollo-server';
import * as dotenv from 'dotenv';
import { resolvers, typeDefs } from './schema';
import { User } from './entity/user';
import { Address } from './entity/address';

const isTest: boolean = process.env.TEST === 'true';
dotenv.config({ path: process.cwd() + (isTest ? '/test.env' : '/.env') });

const server = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      token: req.headers.authorization,
    }),
  });
  const { url } = await server.listen({ port: process.env.PORT });
  console.log(`🚀  Server ready at ${url}`);
};

export const connection = async (): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [User, Address],
  });
};

export const setup = async (): Promise<void> => {
  try {
    await connection();
    await server();
  } catch {
    console.error('error at setup start');
  }
};
