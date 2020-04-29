
const { 
  GraphQLObjectType , 
  GraphQLNonNull ,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLInt
}  = require('graphql');

exports.UserType = new GraphQLObjectType({
  name: 'user',
  fields:  () =>{
    return {
      id: { type: new GraphQLNonNull(GraphQLID) },
      firstName:{ type: GraphQLString },
      lastName:{ type: GraphQLString },
      avatar:{ type: GraphQLString },
      empCode:{ type: GraphQLString },
      email:{ type: GraphQLString },
      designation:{ type: GraphQLString },
      group:{ type: GraphQLString },
      location:{ type: GraphQLString },
      role:{ type: GraphQLInt },
      joiningDate:{ type: GraphQLString },
      status:{ type: GraphQLString },
      hash: { type: GraphQLString },
      salt: { type: GraphQLString }
    }
  }
});



