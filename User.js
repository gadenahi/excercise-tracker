const mongoose = require("mongoose");
const shortid = require('shortid');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  _id: {
    type: String,
    default: shortid.generate
       },
  username: {
    type: String,
    required:true
  }
})

module.exports = mongoose.model('User', UserSchema);
