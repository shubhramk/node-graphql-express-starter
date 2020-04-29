const addUser = require('./add-user').add;
const updateUser = require('./update-user').update;
const deleteUser = require('./delete-user').remove;
module.exports = {
  addUser,
  updateUser,
  deleteUser
}