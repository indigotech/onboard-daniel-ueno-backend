const { ApolloServer, gql } = require('apollo-server');

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Hello {
    ptBr: String
    en: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each.
  type Query {
    hello: Hello
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
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }: any) => {
  console.log(`🚀  Server ready at ${url}`);
});
