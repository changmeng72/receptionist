const mongoose = require("mongoose");





const EmployeeSchema = mongoose.Schema({
    firstname: {type:String, required:true},
    lastname:  {type:String, required:true},
    email: {type:String, required:true},  //contact infor
    phonenum: String,
    department: String,
    photo:  String ,
    position:String,
    password:String

});

module.exports  =   mongoose.model('employees',EmployeeSchema);