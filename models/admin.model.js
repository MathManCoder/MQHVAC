var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const connection = require("./conn_db");

var adminSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('admin', adminSchema); 