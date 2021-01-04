const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema({
    firstname: {type:String, required:true},
    lastname:  {type:String,default:null},
    email: {type:String,  lowercase:true},//contact infor
    phonenum: {type:String,default:null},
    companyname: {type:String,default:null},

    creatorid: mongoose.Types.ObjectId, //link to the employee to be visited
    creatorname:{type:String,required:true} ,
    createdtime:{type:Date, default:Date.now()}
     
});

module.exports = mongoose.model('contact',ContactSchema);