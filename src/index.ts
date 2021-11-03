const { ApolloServer, gql } = require('apollo-server');

import 'reflect-metadata';
import { createConnection } from 'typeorm';
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
    name: String
    email: String
    password: String
  }
  type UserOutput {
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
    createUser(data: UserInput!): UserOutput
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
    async createUser(parent, args) {
      const data = await createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'testando123',
        password: 'senha123',
        database: 'database123',
        entities: [User],
        synchronize: true,
        logging: false,
      })
        .then((connection) => {
          const user = new User();
          user.name = args.data.name;
          user.email = args.data.email;
          user.password = args.data.email;
          return connection.manager.save(user).then((user) => {
            connection.close();
            return { name: user.name, id: user.id, email: user.email };
          });
        })
        .catch((error) => console.log(error));
      return data;
    },
  },
};
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }: any) => {
  console.log(`🚀  Server ready at ${url}`);
});
