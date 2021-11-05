import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { ApolloServer } from 'apollo-server';
import * as dotenv from 'dotenv';
import { resolvers, typeDefs } from './schema';
import { User } from './entity/User';

const isTest: boolean = process.env.TEST === 'true';
dotenv.config({ path: process.cwd() + (isTest ? '/test.env' : '/.env') });

const server = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  server.listen({ port: process.env.PORT }).then(({ url }: any) => {
    console.log(`🚀  Server ready at ${url}`);
  });
};

const connection = async () => {
  return createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [User],
  });
};

export const setup = async () => {
  connection();
  server();
};
