const mongoose = require("mongoose");

const VisitSchema = mongoose.Schema({
    visitorid: mongoose.Types.ObjectId,
    firstname: {type:String, required:true},  /*name of visitor */
    lastname:  {type:String},
    email: String,  //contact infor
    phonenum: String,
    companyname: String,
    contact: mongoose.Types.ObjectId, //link to the employee to be visited
    contactname:{type:String},
    signature: String,
    checkin:Date,
    checkout:Date,
    preregistertime:Date, //preregistered time of visit
    createdtime:Date,
    precreatedcontact: mongoose.Types.ObjectId, //link to the employee create this visitor in advance
    buttontype: String,
    emailnotified:  Date,
    smsnotified: Date,
    location:{type: String,default:""},
    subject:{type: String,default:""},
    description:{type: String,default:""},
    duration: {type: Number , default: 0}    
});

module.exports = mongoose.model('visit',VisitSchema);