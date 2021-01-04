const mongoose = require("mongoose");





const EmployeeSchema = mongoose.Schema({
    firstname: {type:String, required:true},
    lastname:  {type:String,default:null},
    email: {type:String, required:true,lowercase:true,unique:true,trim:true},  //contact infor
    phonenum: String,
    department: {type:String,default:null},
    photo:   {type:String},
    position:String,
    password:{type:String,required:true},
    createdtime: {type:Date,default:Date.now()},
    firstLogin: {type:Boolean, default:false},
    usedPassword:{type:[String],default:[]},
    lastDateChangePass:{type:Date, default:null},
    role:{type:String,enum:["common","receptionist","admin"],default:"common"}

});

module.exports  =   mongoose.model('employees',EmployeeSchema);