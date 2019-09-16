const mongoose = require("mongoose");
var Schema = mongoose.Schema;

var AddSchema = new Schema({
  userid: {
    type: String,
    required:true
  },  
  description: {
    type: String,
    required:true
  },  
  duration: {
    type: Number,
    required:true
  },
  date: {
    type: Date
  }
})

module.exports = mongoose.model('Add', AddSchema);
