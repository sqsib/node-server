var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  friends: [String],
  online: {
    type: Boolean,
    default: false
  },
  location: {
    lat: Number,
    long: Number,
  }

});

module.exports = mongoose.model('User', UserSchema);
