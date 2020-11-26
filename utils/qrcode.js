const QRCode = require("qrcode");

 


const generateQR = async (path,text) => {
    try {
      console.log('text: '+text);
       await QRCode.toFile(path+text +".png",text);
    } catch (err) {
      console.error(err)
    }
  }


  module.exports=generateQR;