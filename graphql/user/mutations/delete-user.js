const {GraphQLNonNull , GraphQLString} = require('graphql');
const mongoose = require('mongoose');
const UserType  = require('./../types/user-type').UserType;
const UserModel = mongoose.model('User');
const {ERROR_CODE} = require('./../../../constants/error-code');
const {MESSAGE_INFO} =  require('./../../../constants/message');

exports.remove = {
  type: UserType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  resolve: async(root, args)=> {
    const user = await UserModel.findById(args.id)
    if (!user) {
      const error = new Error(MESSAGE_INFO.RESOURCE_NOT_FOUND);
      error.code  = ERROR_CODE.RESOURCE.NOT_FOUND;
      throw error;
    }

    const removedUser = await UserModel.findOneAndDelete(args.id)
    if (!removedUser) {
      const error = new Error(MESSAGE_INFO.ERROR);
      error.code  = ERROR_CODE.RESOURCE.GENERIC;
      throw error;
    }
  
    return removedUser;
  }
}
