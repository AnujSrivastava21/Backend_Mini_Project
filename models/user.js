const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/MiniProject");

const newUser = mongoose.Schema({
    username: String,
    name: String,
    password: String,
    age: Number,
    email: String,
    post:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'post'
        }
    ]
});

module.exports = mongoose.model('user', newUser);
