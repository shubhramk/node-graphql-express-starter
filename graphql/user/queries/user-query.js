
const {GraphQLList , GraphQLString ,GraphQLObjectType} = require('graphql');
const UserModel = require('../../../models/User');
const UserType = require('./../types/user-type').UserType;

exports.UserQuery = new GraphQLObjectType({
  name: 'Query',
  fields:  ()=> {
    return {
      users: {
        type: new GraphQLList(UserType),
        resolve:  async ()=> {
          const users = await UserModel.find();
          if (!users) {
            throw new Error('error while fetching data')
          }
          return users;
        }
      },
      user: {
        type: UserType,
        args: {
          id : {  type: GraphQLString}
        },
        resolve:  async (parent,{id})=> {
          const user = await UserModel.find({empCode:id.toString()});
          return user[0];
        }
      }
    }
  }
});
