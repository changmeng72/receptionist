const mongoose = require("mongoose");

const VisitSchema = mongoose.Schema({
    firstname: {type:String,default:null},  /*name of visitor */
    lastname:  {type:String},
    email: {type:String, lowercase:true}, //contact infor
    phonenum: String,
    companyname: String,

    contact: mongoose.Types.ObjectId, //link to the employee to be visited
    contactname:{type:String},
    signature: String,
    checkin:{type:Date,default:null},
    checkout:{type:Date,default:null},
    preregistertime:{type:Date,default:null}, //preregistered time of visit
    createdtime:{type:Date, default:Date.now()},
    precreatedcontact: mongoose.Types.ObjectId, //link to the employee create this visitor in advance
    buttontype: {type:String, default:"Here for an appointment"},
    emailnotified:  {type:Date,default:null},
    smsnotified:    {type:Date,default:null},
    location:{type: String,default:""},
    subject:{type: String,default:""},
    description:{type: String,default:""},
    duration: {type: Number , default: 0} ,
    photo:{type:Boolean, default:false}  ,
    idphoto:{type:Boolean, default:false} ,
    deleteDate:{type:Date,default:null},
    deleteAdmin:{type:mongoose.Types.ObjectId,default:null}

});

module.exports = mongoose.model('visit',VisitSchema);