
const {GraphQLList , GraphQLString ,GraphQLObjectType} = require('graphql');
const UserModel = require('../../../models/User');
const UserType = require('./../types/user-type').UserType;
const {ERROR_CODE} = require('./../../../constants/error-code');
const {MESSAGE_INFO} =  require('./../../../constants/message');

exports.UserQuery = new GraphQLObjectType({
  name: 'Query',
  fields:  ()=> {
    return {
      users: {
        type: new GraphQLList(UserType),
        resolve:  async ()=> {
          const users = await UserModel.find();
          if (!users) {
            const error = new Error(MESSAGE_INFO.RESOURCE_NOT_FOUND);
            error.code  = ERROR_CODE.RESOURCE.RESOURCE_NOT_FOUND;
            throw error;
          }
          return users;
        }
      },
      user: {
        type: UserType,
        args: {
          empCode : {  type: GraphQLString},
          email : {  type: GraphQLString}
        },
        resolve:  async (parent,{empCode,email})=> {
          const user = await UserModel.findOne({ $or:[ {empCode:empCode} , {email:email}]});
          if (!user) {
            const error = new Error(MESSAGE_INFO.RESOURCE_NOT_FOUND);
            error.code  = ERROR_CODE.RESOURCE.RESOURCE_NOT_FOUND;
            throw error;
          }
        
          return user;
        }
      }
    }
  }
});
