const {GraphQLNonNull , GraphQLString , GraphQLList} = require('graphql');
const mongoose = require('mongoose');
const UserType  = require('./../types/user-type').UserType;
const UserModel = mongoose.model('User');
const {ERROR_CODE} = require('./../../../constants/error-code');
const {MESSAGE_INFO} =  require('./../../../constants/message');

exports.add = {
  type: UserType,
  args: { 
    firstName:{ type: new GraphQLNonNull(GraphQLString)},
    lastName:{ type: new GraphQLNonNull(GraphQLString)},
    avtar:{ type: GraphQLString},
    empCode:{ type: new GraphQLNonNull(GraphQLString)},
    email:{ type: new GraphQLNonNull(GraphQLString)},
    designation:{ type: new GraphQLNonNull(GraphQLString)},
    group:{ type: new GraphQLNonNull(GraphQLString)},
    location:{ type: new GraphQLNonNull(GraphQLString)},
    role:{ type: new GraphQLNonNull(GraphQLString)},
    joiningDate:{ type: new GraphQLNonNull(GraphQLString)},
    status:{ type: new GraphQLNonNull(GraphQLString)},
    billing:{ type: new GraphQLList(GraphQLString)}
  },
  resolve: async(root, args)=> { 

    const user = await UserModel.findOne({ $or:[ {empCode:args.empCode} , {email:args.email}]});
    if (user) {
      const error = new Error(MESSAGE_INFO.RESOURCE_EXIST);
      error.code  = ERROR_CODE.RESOURCE.DUPLICATE_RESOURCE;
      throw error;
    }
    const uModel  = new UserModel(args);
    const newUser = await uModel.save();
    if (!newUser) {
      const error = new Error(MESSAGE_INFO.ERROR);
      error.code  = ERROR_CODE.RESOURCE.GENERIC;
      throw error;
  }
    return newUser;
  }
}
