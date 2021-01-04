const express = require('express');
const session = require('express-session')
const visitorRouter = express.Router();

const Visit = require("../models/visitor");
const Contact = require("../models/contact");
const Employee = require("../models/employee");
const mongoose = require('mongoose');
const generateQR = require('../utils/qrcode');
const { json } = require('body-parser');
const visitor = require('../models/visitor');
const { findById } = require('../models/visitor');
const ejs = require('ejs');
const {sendemail,getIcalObjectInstance} = require('../utils/email');
const HTMLDocx = require('html-docx-js');
const fs = require('fs/promises');
const { promisify } = require("util");

require("dotenv").config();

 
 
/****************************************** 
visitorInfo={
  visitorid:visit.visitorid, 
  visitid:visit.id,
  name:visit.firstname,
  email :visit.email,
  companyname:visit.companyname,
  preregistertime:visit.preregistertime,
  preregister:false                             
};  

/******************************************** */
exports.showEmployeeList =  async function (req, res, next) {     
    const buttontype = req.query.buttontype || 1;
    clearSession(req.session);   
    req.session.buttontype = buttontype;

    try{       
         const contacts =  await Employee.find({}).sort('firstname');
         if(buttontype==1)
            res.render('contacts',{contacts:contacts,url:"visitor/info"});
          else
            res.render('contacts',{contacts:contacts,url:"visitor/delivery"});
       }catch(err){          
          console.error(err);
          destroySession(req.session);
          res.render("sadpanda",{data:{title:"Operation NOK", description:"We will go back to main page in 3 seconds"}});
       }
     
   
};
 


exports.showScanVisitorInfo = function(req,res,next){
   res.render('qr',{targeturl:"Scan visitor info"});
};

/****************************************** */


/******************************************** */
exports.showCheckout = function(req,res,next){
  res.render('qr',{targeturl:"Check out"});
};

exports.showScanPreregistered =  function(req,res,next){
   
   res.render('qr',{targeturl:"Preregistered visit"}); 
};

/*visitor checkout with qr code*/
exports.doCheckout= async function(req,res,next){

  let nt = Date.now();
  try{ 
        if(req.body.qr){   
            const qrinfo = JSON.parse(req.body.qr);
            if(qrinfo && qrinfo.visitid){         
              //it's a preregistered visit
                    let visit = await Visit.findById(qrinfo.visitid);
                    if(visit){
                        if(visit.checkout===null){
                            visit.checkout = nt;
                            await visit.save();   
                        } 
                        //res.render("alert",{alerttext: "Checkout successfully"}); 

                        //send a email to visitor  /
                       // console.log("send a email to visitor");
                        sendVisitSummary(visit);
                    }
                    req.session.visitorInfo = null;
                    res.json({result:"ok",url:"/",checkout:visit.checkout,name:visit.firstname,contactname:visit.contactname}); 
                    return;
            }

          }
         

  }catch(err){
      console.error(err);     
  }
  req.session.visitorInfo = null;
  res.json({result:"nok",description:"System busy"});         
       
};
/****************************************** */


/******************************************** */
exports.submitQR = async function(req,res,next){
   
   /** qr
    * {visitorid,
    *  visitid ,
    *  checkintime
    *   type=1 preregistered, type=2 just input user info
    */
   let validQR = false;
   const type = req.query.type || 1;
   try{ 
        if(req.body.qr){          
            const qrinfo = JSON.parse(req.body.qr);
            if(qrinfo && qrinfo.visitid){         
               /*it's a preregistered visit*/
                    let visit = await Visit.findById(qrinfo.visitid);
                    if(visit){
                          validQR = true;
                          req.session.visitorInfo={                            
                            visitid:visit.id,
                            name:visit.firstname,
                            email :visit.email,
                            companyname:visit.companyname,
                            preregistertime:visit.preregistertime,
                            preregister:false                             
                          };  
                          if(type==1){
                            if(visit.checkin===null && visit.preregistertime!==null){
                              /*this is a preregistered visit*/
                               if( (visit.preregistertime<(Date.now() - 60000*60*3 ))|| (visit.preregistertime >(Date.now() + 60000*60*3 ) )){     /** validate 3 hours */
                                  //not in valid time segement(+-3 hours)
                                  res.json({result:"nok",url:"/",description:"The time is not valid now, your appointment time is "+visit.preregistertime.toLocaleString()}); 
                               }
                               else{
                                req.session.contactid =   visit.contact;  /*employee id */
                                req.session.contactname = visit.contactname; /*employee name */
                                req.session.visitorInfo.preregister = true;
                                res.json({result:"ok",description:"ok",url:"/visitor/agreement",
                                          contact:visit.contactname, preregistertime:visit.preregistertime.toLocaleString(),
                                          name:visit.firstname, companyname:visit.companyname,email:visit.email});
                               }

                          }else {
                            /** it not a valid preregister qr code*/     

                               res.json({result:"nok",url:"/",description:"This qr code was used ,it can not be used again for a preregistered visit."}); 
                          }
                        }else{/*type=2 scan with a used badge*/
                           
                          req.session.visitorInfo.visitid = null;
                          req.session.visitorInfo.preregistertime = null;
                          res.json({result:"ok",description:"ok",name:visit.firstname, companyname:visit.companyname,email:visit.email,url:"/visitor/agreement"});
                        }
                      }                      
              }          
          }                  
        } 
      catch(e){
        console.error(e);       
        req.session.visitorInfo=null;        
    } 
    if(validQR===false){
      res.json({result:"nok",description:"Invalid QR code or can not found the QR code in the system."});
                       
    }
  };
/****************************************** */


/******************************************** */
/**input client info -self service */
exports.collectVisitorInfo= function (req, res, next){

    const contactname = req.query.contactname;   
    if(contactname){
      req.session.contactname = contactname;
      req.session.contactid = req.query.contactid;    
      req.session.visitorInfo = null;
      const buttontype= req.session.buttontype || 1;
      if(buttontype==1)
        res.render('clientInfo');
      else{

         doDelivery(req,res,next);
      }
    }
    else {
       res.render("sadpanda",{data:{title:"Operation NOK", description:"We will go back to main page in 3 seconds"}});
    }

      
  };

exports.doDelivery = async function(req, res, next){
    const nt = Date.now();
    if(req.query.contactid && req.query.contactname){
        const buttontype = req.session.buttontype==2?"Delivery":"Deposit a document";
        try{
                const visit = new Visit({
                  firstname: null,
                  lastname:null,
                  signature:null,
                  checkin :nt,
                  checkout:null,
                  contact:req.query.contactid,
                  contactname:req.query.contactname,                  
                  email:null,
                  companyname:null,  
                  createdtime:nt,
                  buttontype:buttontype,
                  emailnotified:null,
                  smsnotified:null
              });
              await visit.save();
              let result =  await sendDelieryNotify(visit);
              const title = req.session.buttontype==3?"Delivery Registered" : "Document Registered";
              const description = result ?"Notification by email is sent to " + req.query.contactname +" successfully" : "No email notificatioin was sent to " + req.query.contactname + ", please make a call to him!";
              res.render("resultNotify",{data:{title:title,description:description,description2:"Please call the recipient if signature required."}});
    }catch(err){
      console.error(err);  
      res.render("sadpanda",{data:{title:"The Delivery/Document is not Registered", description:"We will go back to main page in 3 seconds"}});
    }
  }
  else{
    res.render("sadpanda",{data:{title:"The Delivery/Document is not Registered", description:"We will go back to main page in 3 seconds"}});
  }


}

/****************************************** */


/******************************************** */
exports.postVisitorInfo= function (req, res, next){
  req.session.visitorInfo =  {
          name: req.body['visitorname'],
          email:req.body['email'],
          companyname:req.body['companyname'] ,
          phonenum:req.body['phonenum'],
          preregister:false,
          preregistertime:null,
          visitid:null
        }; 
  if(process.env.TAKEPHOTO==1)
    res.render("frame");
  else
    res.render("agreement"); 
};

 
/****************************************** */


/******************************************** */
/**sign agreement, after that create a new visitor and checked him in at same time
 * email/sms should be sent to contact notifying the arrival of visitor
 */
exports.showAgreement = function (req, res, next){
   res.render('agreement');  
};
/****************************************** */


/******************************************** */
/**agreement is signed , in this function , all data(contact and visit) will be created or updated*/
exports.postAgreement = async function (req, res, next){
     
  /**start to save data, and notify the contacts */
  const nt = Date.now();
  if(!req.session.visitorInfo){
      console.error("No user info when receiving agreement");
      res.redirect("/");
      return;
  }
  let visitor,firstname ,visit;
  firstname =   req.session.visitorInfo.name; 
  try{
/**CHECK VISIT */
        if(req.session.visitorInfo.visitid){
          /**PREREGISTORED contact info is OK */
              visit = await Visit.findById(req.session.visitorInfo.visitid);
              if(visit && visit.preregistertime   && visit.checkin===null){
                visit.signature = req.body['signature'];
                visit.checkin = nt;
                
                await visit.save();
              }
        }
        if(!visit){   
               visit = new Visit({
                  firstname: firstname,
                  lastname:"",
                  signature: req.body['signature'],
                  checkin :nt,
                  checkout:"",
                  phonenum:req.session.visitorInfo.phonenum,
                  contact:req.session.contactid,
                  contactname:req.session.contactname,                  
                  email:req.session.visitorInfo.email,
                  companyname:req.session.visitorInfo.companyname,  
                  createdtime:Date.now(),
                  buttontype:"Here for an appointment",
                  emailnotified:"",
                  smsnotified:"" ,
                  photo: req.session.photofile?true:false,
                  idphoto:req.session.idfile?true:false
              });
              
              await visit.save(); 
             
        }
         
/*EVERY THING IS OK , SEND EMAIL/SMS PRINT A BADGE*/

     /*
      req.session.visitorinfo = ""; 
      req.session.contactid="";
      req.session.contactname=""; */
      const ts = new Date(nt);
       /*photo and ID*/
       if(req.session.photofile){
         await fs.rename(req.session.photofile,"./public/visitor/image/p_"+visit.id + ".jpg");
       }
       if(req.session.idfile){
        await fs.rename(req.session.idfile,"./public/visitor/image/i_"+visit.id + ".jpg");
      }
       /**send email */
      sendArrivalNotify(visit);
      destroySession(req.session);
      res.render("notifying",{data:{
        visitorname: visit.firstname,
        contactname: visit.contactname,
        checkin:ts.toLocaleString(),
        qrcode: JSON.stringify({visitid:visit.id, 
                 checkintime:visit.checkin})
                }});    
      
  }catch(err) {
      console.error(err);
      
      res.redirect('/');
  }
    
  };

  exports.postPhoto = async function(req,res,next){
    req.session.photofile =  "./public/visitor/image/photo_" + req.session.id + ".jpg"
    
    try{
        await fs.writeFile(req.session.photofile,req.body);
        res.json({result:"ok"});
        }
    catch(err){ 
     
        res.json({result:"nok",error:err});
        req.session.photofile = null;
     } 
  }
  exports.postID = async function(req,res,next){
    

    req.session.idfile =  "./public/visitor/image/id_" + req.session.id + ".jpg"
    
    try{
      await fs.writeFile(req.session.idfile,req.body);
      res.json({result:"ok"});
      }
  catch(err){ 
   
      res.json({result:"nok",error:err});
      req.session.idfile = null;
   } 

 }
/************************************** */
/****************************************** */


/******************************************** 

  visitorRouter.get('/notify',(req,res)=>{
    res.render('notifying');
  });
//todo check email,sms sending result,now it's a fake function 
visitorRouter.get('/checkstatus',function (req, res, next){
  console.log("checkstatus" );
  console.log(req.session.check);
  if(req.session.check){
    req.session.check ++;
    if(req.session.check==4){
      req.session.check = 0;
      

      let visitorInfo = req.session.visitorInfo;
      req.session.visitorInfo = "";

      res.json({result:"OK",
               visitorname: visitorInfo.name,
               contactname: req.session.contactname,
               qrcode: {visitid:req.session.visitid, 
                        visitorid:req.session.visitorid,
                        checkintime:req.session.checkintime}
              });
       
      return;
    }
  }
  else
  {
    req.session.check=1;
  }
  
  res.json({result:"Processing"});
  
});
visitorRouter.post('/checkstatus',function (req, res, next){

  res.json({result:"ok"});
});
*/
 
async function sendVisitSummary(visit){
  if(visit.email && visit.email!==null){
    //send signed nds as attachment
    let filepath = __dirname + "./../document/"+visit.id + ".docx";
    if(visit.signature && visit.signature!==null && visit.signature!==""){
      try{
             const html = await  ejs.renderFile(__dirname+"./../views/doctemplate/ndsWithSig.ejs",{data:{imagedata:visit.signature}});
             const docx = HTMLDocx.asBlob(html);
             await  fs.writeFile(__dirname + "./../document/"+visit.id + ".docx",docx );
          }catch(err){
            console.error(err);
            filepath = null;               
          }         
    }
    try{
        const html = await ejs.renderFile(__dirname + "./../views/emailtemplate/visitsummary.ejs",{data: { 
        visitorname:visit.firstname,
        invitor:visit.contactname,
        checkin:visit.checkin.toLocaleString(),
        checkout:visit.checkout.toLocaleString(),
        location:visit.location,
        description:visit.description }});     
      let attachments=null;
      if(filepath!==null){
        attachments = [{filename:"nds.docx", path: filepath}];
      }
      return await sendemail(visit.email,"Your visit summary",html,null,attachments);
    }catch(err){
      console.error(err);
    }
  }
  
  return false;

 }

 async function sendArrivalNotify(visit){
  if(visit){
    try{
    const employee =await Employee.findById(visit.contact);
    if(employee && employee.email!=="" && employee.email!==null){
      const html = await ejs.renderFile(__dirname + "./../views/emailtemplate/noti_arrival.ejs",{data:{
      visitorname:visit.firstname,
      companyname:visit.companyname,
      buttontype:visit.buttontype,
      datetime: visit.checkin.toLocaleString()

    }});
    return await sendemail(employee.email,"You have a visitor now",html);
    } 
  }catch(err){
    console.error(err);
  }
 }
 return false;
}
 
async function sendDelieryNotify(visit){
  if(visit){  
     try{        
          const employee =await Employee.findById(visit.contact);
          if(employee && employee.email!=="" && employee.email!==null){
            let html =  null;
            if(visit.buttontype==="Delivery"){
              html = await ejs.renderFile(__dirname + "./../views/emailtemplate/delivery.ejs",{data:{
            datetime: visit.checkin.toLocaleString()
          }});
        }
          else{
             html = await ejs.renderFile(__dirname + "./../views/emailtemplate/deposit.ejs",{data:{
              datetime: visit.checkin.toLocaleString()
            }});
          }
         try{
             let title = visit.buttontype==="Delivery"? " Your have a delivery ":"You have a document deposit";
             return await sendemail(employee.email,title,html);
            
         }catch(err){
           console.error(err);
         }
         
      }
    }catch(err){
       console.error(err);
    }
 }
 return false;
}


function clearSession(session){
 
     session.visitorInfo = null;
     session.contactname = null;
     session.contactid = null;
     
}

function destroySession(session){
  session.destroy();
}