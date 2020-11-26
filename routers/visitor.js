const express = require('express');
const session = require('express-session')
const visitorRouter = express.Router();

const Visit = require("./../models/visitor");
const Contact = require("./../models/contact");
const Employee = require("./../models/employee");
const mongoose = require('mongoose');
const generateQR = require('./../utils/qrcode');
const { json } = require('body-parser');
const visitor = require('./../models/visitor');
const { findById } = require('./../models/visitor');
const ejs = require('ejs');
const {sendemail,getIcalObjectInstance} = require('../utils/email');
const HTMLDocx = require('html-docx-js');
const fs = require('fs');
const { promisify } = require("util");

 
 
/****************************************** */


/******************************************** */
visitorRouter.get('/', async function (req, res, next) {
    /*const contacts = [{firstname:"Jone",lastname:"Smith",img:"/image/Jack.png",position:"CEO"},
    {firstname:"Betty",lastname:"Trump",img:"/image/Tom.png",position:"CFO"},
    {firstname:"Gosh",lastname:"Baden",img:"/image/Frank.png",position:"CTO"},
    {firstname:"Mike",lastname:"Lin",position:"Director of Sale Dept."},
    {firstname:"Julian",lastname:"Lee",position:"Software Dev."},
  ];*/
    const buttontype = req.query.buttontype;
    console.log("buttontype: "+buttontype);
    req.session.visitorInfo=null; 
    try{       
         const contacts =  await Employee.find({}).sort('firstname');

          res.render('contacts',{contacts:contacts});
       }catch(err){
           res.render("sadpanda");
          console.log("fail get employee info");
          console.log(err);
       }
     
   
});
 
/****************************************** */


/******************************************** */
visitorRouter.get('/scanvisitorinfo',function(req,res,next){
  console.log("get scanvisitorinfo");
  res.render('qr',{targeturl:"Scan visitor info"});
});
visitorRouter.get('/checkout',function(req,res,next){
  res.render('qr',{targeturl:"Check out"});
});

visitorRouter.get('/qr',function(req,res,next){
   
  req.session.test = "hello"
  res.render('qr',{targeturl:"Preregistered visit"});
  

});

/*visitor checkout with qr code*/
visitorRouter.post('/checkout',async function(req,res,next){

  let nt = Date.now();
  console.log(req.body.qr);

  try{ 
        if(req.body.qr){   
            const qrinfo = JSON.parse(req.body.qr);
            console.log(qrinfo);
            if(qrinfo && qrinfo.visitid && mongoose.Types.ObjectId.isValid (qrinfo.visitid)){         
              //it's a preregistered visit
                    let visit = await Visit.findById(qrinfo.visitid);
                    console.log("find visit:" + visit);
                    if(visit && visit.checkout===null){
                      visit.checkout = nt;
                      await visit.save();    
                      //res.render("alert",{alerttext: "Checkout successfully"}); 

                      //send a email to visitor  /
                      if(visit.email && visit.email!==null){
                        //send signed nds as attachment
                        let filepath = __dirname + "./../document/"+visit.id + ".docx";
                        if(visit.signature && visit.signature!==null && visit.signature!==""){
                          try{
                                 const html = await  ejs.renderFile(__dirname+"./../views/doctemplate/ndsWithSig.ejs",{data:{imagedata:visit.signature}});
                                 const docx = HTMLDocx.asBlob(html);

                                 await promisify(fs.writeFile)(__dirname + "./../document/"+visit.id + ".docx",docx,(err)=>{
                                      if(err){  
                                        filepath = null;                                        
                                          throw err;
                                      }
                                      });
                              }catch(err){
                                filepath = null;
                                   
                              }
                              
                        }
                        const html = await ejs.renderFile(__dirname + "./../views/emailtemplate/visitsummary.ejs",{data: { 
                            visitorname:visit.firstname,
                            invitor:visit.contactname,
                            checkin:visit.checkin.toLocaleString(),
                            checkout:visit.checkout.toLocaleString(),
                            location:visit.location,
                            description:visit.description }});
                         
                        let attachments=null;
                        if(filepath!==null){
                          console.log(filepath);
                          attachments = [{filename:"nds.docx", path: filepath}];

                        }

                        sendemail(visit.email,"Your visit summary",html,null,attachments);
                      }

                       
                    }
            }
          }
  }catch(err){
      console.error(err);
  }
                    
        req.session.visitorInfo="";
        res.json({result:"ok",url:"/",checkout:nt}); 
});
/****************************************** */


/******************************************** */
visitorRouter.post('/qr',async function(req,res,next){
   console.log("post qr " + req.body.qr);

   /** qr
    * {visitorid,
    *  visitid ,
    *  checkintime
    *   type=1 preregistered, type=2 just input user info
    */
   const type = req.query.type || 1;
   console.log("session test :" + req.query.type);
   try{ 
        if(req.body.qr){          
            const qrinfo = JSON.parse(req.body.qr);
            console.log("qrinfo: " + qrinfo);
            if(qrinfo && qrinfo.visitid && mongoose.Types.ObjectId.isValid (qrinfo.visitid)){         
               /*it's a preregistered visit*/
                    let visit = await Visit.findById(qrinfo.visitid);
                    console.log("find visit:" + visit);
                    if(visit){
                          req.session.visitorInfo={
                            visitorid:visit.visitorid, 
                            name:visit.firstname ,
                            companyname:visit.companyname,
                            preregistertime:visit.preregistertime,
                            visitid:visit.id,email :visit.email
                             
                          };  
                          if(type==1){
                            console.log("checking: ");
                            if(visit.checkin===null ){
                               if( (visit.preregistertime<(Date.now() - 60000*60*3 ))|| (visit.preregistertime >(Date.now() + 60000*60*3 ) )){     /** validate 3 hours */
                                  //not in valid time segement(+-3 hours)
                                  res.json({result:"nok",url:"/",description:"The time is not valid now, your appointment time is "+visit.preregistertime.toLocaleString()}); 
                                  return;
                               }
                               else{
                                console.log("checking2: ");
                                req.session.contactid =   visit.contact;  /*employee id */
                                req.session.contactname = visit.contactname; /*employee name */
                                req.session.visitorInfo.preregister = true;
                                res.json({result:"ok",description:"ok",url:"/visitor/agreement",
                                contact:visit.contactname, preregistertime:visit.preregistertime.toLocaleString(),
                                name:visit.firstname, companyname:visit.companyname,email:visit.email});
                                return;
                               }

                          }else {
                            /** not a scan of pre */
                               res.json({result:"nok",url:"/?contact="+visit.contactname,description:"This qr code was used ,it can not be used again."}); 
                               return;
                          }
                        }else{/*type=2*/
                          console.log("checking3: ");
                              res.json({result:"ok",description:"ok",name:visit.firstname, companyname:visit.companyname,email:visit.email,url:"/visitor/agreement"});
                              return;
                           
                        }
                      }
                      else{ /**not found visit */
                          if(type==1){
                              res.json({result:"nok",url:"/",description:"No valid preregistered appointment is founded!"});  
                              return;                        
                          }
                           
                      }
              } 
                           
            
            if(type==2 && qrinfo && qrinfo.visitorid && mongoose.Types.ObjectId.isValid (qrinfo.visitorid)){
                const visitor = await Contact.findById(qrinfo.visitorid);
                if(visitor){
                      req.session.visitorInfo={
                        visitorid:visitor.id, 
                        preregister:false,
                        name:visitor.firstname + " " + visit.lastname,
                        companyname:visitor.companyname ,
                        visitid:""                     
                      }; 
                      console.log("checking4: ");
                      res.json({result:"ok",description:"ok",name:visitor.firstname, companyname:visitor.companyname,email:visitor.email,url:"/visitor/agreement"});
                      return;  
                }  
                else{
                  res.json({result:"nok",description:"Not found visitor information",url:"/"});
                  return;
                }
            }
           
          
          }
          
            res.json({result:"nok",description:"request is not correct",url:"/"});
         
        } 
      catch(e){
        console.error(e);       
        req.session.visitorInfo=null;
        res.json({result:"nok",description:"System busy",url:"/"});
    } 
  }
);
/****************************************** */


/******************************************** */
/**input client info -self service */
visitorRouter.get('/info',function (req, res, next){

    const contactname = req.query.contactname;
    
    
    if(contactname){

    req.session.contactname = contactname;
    req.session.contactid = req.query.contactid;
    
    console.log("get info -req.session.visitorInfo:" + req.session.visitorInfo);
    if(req.session.visitorInfo)
       res.render('agreement');
    else
       res.render('clientInfo');

    }
    else {
      res.end("wrong visit-sad panda");
    }

      
  });
/****************************************** */


/******************************************** */
visitorRouter.post('/info',function (req, res, next){
  console.log(req.session.contactname);

  const visitorInfo =   {
          name: req.body['visitorname'],
          email:req.body['email'],
          companyname:req.body['companyname'],
          visitorid:""
        };

  
  console.log(visitorInfo.email);
  req.session.visitorInfo = visitorInfo;
  res.render("agreement");
   
     
});
/****************************************** */


/******************************************** */
/**sign agreement, after that create a new visitor and checked him in at same time
 * email/sms should be sent to contact notifying the arrival of visitor
 */
visitorRouter.get('/agreement',function (req, res, next){
  console.log("d");
  res.render('agreement');

  
});
/****************************************** */


/******************************************** */
/**agreement is signed , in this function , all data(contact and visit) will be created or updated*/
visitorRouter.post('/agreement', async function (req, res, next){
    console.log("agreement is submitted" + req.body['signature']);
  /**start to save data, and notify the contacts */
   console.log(req.session.visitorInfo);
   const nt = Date.now();
  if(!req.session.visitorInfo){
      res.redirect("/");
      return;
  }
  let visitor,firstname,lastname,visit;
  firstname="";
  lastname = "";
  if(req.session.visitorInfo.name){
          let name,names;     
          name = req.session.visitorInfo.name.trim();
          names = name.split(' ').filter((e)=>e!="");
          firstname = names.shift();
          lastname = names.join(' ');      
  }

  try{
    /**CHECK VISITOR */

        if(req.session.visitorInfo.visitorid){
          visitor = await Contact.findById(req.session.visitorInfo.visitorid);            
        }
        if(!visitor && req.session.visitorInfo.email){ /*email should be unqiue*/
          visitor = await Contact.findOne({email:req.session.visitorInfo.email});  
        }
        if(!visitor) {  
          console.log("create new visitor: " + firstname +" " + lastname );   
          visitor = new Contact({
            firstname: firstname,
            lastname:  lastname,
            email: req.session.visitorInfo.email,
            companyname: req.session.visitorInfo.companyname
          });
          await visitor.save();
          
        }
        req.session.visitorInfo.visitorid = visitor.id;

/**CHECK VISIT */
        if(req.session.visitorInfo && req.session.visitorInfo.visitid){
          /**PREREGISTORED contact info is OK */
              visit = await Visit.findById(req.session.visitorInfo.visitid);
              if(visit && visit.preregistertime   && visit.preregistertime.checkin){
                visit.signature = req.body['signature'];
                visit.checkin =Date.now();
                console.log("reregister visitor checkin");
                await visit.save();
              }
        }
        if(!visit){   
              console.log("create new visit:" + firstname+" " + lastname + "=>"+ req.session.contactname);        
              visit = new Visit({
                  firstname: firstname,
                  lastname:lastname,
                  signature: req.body['signature'],
                  checkin :nt,
                  checkout:"",
                  contact:req.session.contactid,
                  contactname:req.session.contactname,
                  visitorid:visitor.id  ,
                  email:visitor.email,
                  companyname:visitor.companyname,  
                  createdtime:Date.now(),
                  buttontype:req.session.buttontype,
                  emailnotified:"",
                  smsnotified:"" 
              });
              
              await visit.save(); 
              console.log("create new visit: " + visit);
        }
         
/*EVERY THING IS OK , SEND EMAIL/SMS PRINT A BADGE*/

     /*
      req.session.visitorinfo = ""; 
      req.session.contactid="";
      req.session.contactname=""; */
      const ts = new Date(nt);
       
      req.session.visitid = visit.id;
      req.session.visitorid = visitor.id;
      req.session.checkintime = ts.toLocaleString();
      console.log(req.session.checkintime);
       /**send email */
       
       if(req.session.contactid){
          const employee =await Employee.findById(req.session.contactid);
          if(employee && employee.email!=="" && employee.email!==null){
          const html = await ejs.renderFile(__dirname + "./../views/emailtemplate/noti_arrival.ejs",{data:{
            visitorname:visitor.firstname,
            companyname:visitor.companyname,
            buttontype:req.session.buttontype
          }});
          sendemail(employee.email,"You have a visitor now",html);
       }
      }

      res.render("notifying",{qrstring:JSON.stringify({visitid:visit.id,visitorid:visitor.id,checkintime:nt})});
        
     
  }catch(err) {
      console.log(err);
      res.redirect('/');
  }

  });


/************************************** */
/****************************************** */


/******************************************** */

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
/****************************************** */


/******************************************** */
visitorRouter.post('/checkstatus',function (req, res, next){

  res.json({result:"ok"});
});

 
 
 
module.exports = visitorRouter;