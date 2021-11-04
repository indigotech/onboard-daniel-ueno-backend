const { ApolloServer, gql } = require('apollo-server');

import 'reflect-metadata';
import { createConnection, getRepository } from 'typeorm';
import { User } from './entity/User';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Hello {
    ptBr: String
    en: String
  }
  input UserInput {
    name: String!
    email: String!
    password: String!
  }
  type User {
    id: ID
    name: String
    email: String
  }
  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each.
  type Query {
    hello: Hello
  }
  type Mutation {
    createUser(data: UserInput!): User
  }
`;

// data to be fetch
const hello = {
  ptBr: 'olar',
  en: 'Hello, World',
};
// Resolvers define the technique for fetching the types defined in the
// schema.

const resolvers = {
  Query: {
    hello: () => hello,
  },
  Mutation: {
    async createUser(_parent: any, args: { data: { name: string; email: string; password: string } }) {
      const { name, email, password } = args.data;
      if (!/^((?=\S*?[a-z,A-Z])(?=\S*?[0-9]).{6,})\S/.test(password)) {
        throw new Error('wrong password format');
      }
      if (!/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
        throw new Error('wrong email format');
      }

      const userRepository = getRepository(User);
      const emailAlreadyExists = await userRepository.findOne({ email });
      if (emailAlreadyExists) {
        return new Error('email already exists');
      }

      const user = new User();
      user.name = name;
      user.email = email;
      user.password = password;
      return userRepository.save(user);
    },
  },
};
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });
const connection = async () => {
  return createConnection();
};
// The `listen` method launches a web server.
server.listen().then(({ url }: any) => {
  connection();
  console.log(`🚀  Server ready at ${url}`);
});
