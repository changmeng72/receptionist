const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema({
    firstname: {type:String, required:true},
    lastname:  {type:String},
    email: String,  //contact infor
    phonenum: String,
    companyname: String,

    creatorid: mongoose.Types.ObjectId, //link to the employee to be visited
    creatorname:{type:String} ,
    createdtime:{type:Date, default:Date.now()}
     
});

module.exports = mongoose.model('contact',ContactSchema);