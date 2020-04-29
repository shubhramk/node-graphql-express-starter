var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName:String,
  lastName:String,
  avatar:String,
  empCode:{type: String, required: true, unique: true},
  email:{type: String, required: true, unique: true},
  designation:{type:mongoose.Schema.ObjectId, ref: 'Designations'},
  group:String,
  location:String,
  role:String,
  joiningDate:{type:Date, default:Date.now},
  status:{type: String, default:'ACTIVE'},
  billing:[{type:mongoose.Schema.ObjectId, ref: 'Billing',default:[]}],
  hash: String,
  salt: String
});
const UserModel = mongoose.model('User', UserSchema);
module.exports  = UserModel;