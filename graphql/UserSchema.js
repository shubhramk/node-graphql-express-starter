const { GraphQLSchema , GraphQLObjectType } = require('graphql');
const queryType = require('./user/queries/user-query').UserQuery;
const mutation  = require('./user/mutations/user-mutation');

exports.UserSchema = new GraphQLSchema({
  query: queryType,
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    description:'Mutation',
    fields: mutation
  })
});
