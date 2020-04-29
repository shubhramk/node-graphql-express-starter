const {GraphQLNonNull , GraphQLString} = require('graphql');
const mongoose = require('mongoose');
const UserType  = require('./../types/user-type').UserType;
const UserModel = mongoose.model('User');
const {ERROR_CODE} = require('./../../../constants/error-code');
const {MESSAGE_INFO} =  require('./../../../constants/message');

exports.update = {
    type: UserType,
    args: { 
        id: { type: new GraphQLNonNull(GraphQLString)},
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
        status:{ type: new GraphQLNonNull(GraphQLString)}
    },
    resolve: async(root, args) =>{
        const updatedUser = await UserModel.findByIdAndUpdate(args.id,args);
        if (!updatedUser) {
            const error = new Error(MESSAGE_INFO.ERROR);
            error.code  = ERROR_CODE.RESOURCE.GENERIC;
            throw error;
        }

        return {
            ...updatedUser
          }
    }
}
