export const typeDefs = `
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
  input UserQuery {
    id: ID
  }
  type User {
    id: ID
    name: String
    email: String
  }
  input LoginInput {
    email: String!
    password: String!
    rememberMe: Boolean!
  }
  type Login {
    user: User
    token: String
  }
  type LoginAuth {
    login: Login
  }
  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each.
  type Query {
    hello: Hello
    user(data: UserQuery!): User
  }
  type Mutation {
    createUser(data: UserInput!): User
    login(data:LoginInput!): LoginAuth
  }
`;
