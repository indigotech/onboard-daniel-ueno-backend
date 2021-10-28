"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var _a = require('apollo-server'), ApolloServer = _a.ApolloServer, gql = _a.gql;
var typeDefs = gql(__makeTemplateObject(["\n  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.\n\n  type Hello {\n    ptBr: String\n    en: String\n  }\n\n  # The \"Query\" type is special: it lists all of the available queries that\n  # clients can execute, along with the return type for each.\n  type Query {\n    hello: Hello\n  }\n"], ["\n  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.\n\n  type Hello {\n    ptBr: String\n    en: String\n  }\n\n  # The \"Query\" type is special: it lists all of the available queries that\n  # clients can execute, along with the return type for each.\n  type Query {\n    hello: Hello\n  }\n"]));
var hello = {
    ptBr: 'olar',
    en: 'Hello, World',
};
var resolvers = {
    Query: {
        hello: function () { return hello; },
    },
};
var server = new ApolloServer({ typeDefs: typeDefs, resolvers: resolvers });
server.listen().then(function (_a) {
    var url = _a.url;
    console.log("\uD83D\uDE80  Server ready at " + url);
});
