const mongoose = require("mongoose");





const signatureSchema = mongoose.Schema({
     visitid:{type:mongoose.Types.ObjectId, required:ture},
     signature:{type:String, required:ture}

});

module.exports  =   mongoose.model('signature',signatureSchema);