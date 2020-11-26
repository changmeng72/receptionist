const express = require('express');
const session = require('express-session');
const Visit = require('../models/visitor');
const Employee =  require('../models/employee');
const Contact = require('../models/contact');
const GenQR = require("../utils/qrcode");
const sha  = require('../utils/sha');
const {sendemail,getIcalObjectInstance} = require('../utils/email');
const ejs= require('ejs');
const internalRouter = express.Router();



internalRouter.all('*', function (req, res, next) {
    console.log("url=>" + req.url);
    if(!req.session.sessionid){
        switch(req.url){
            case "/visitlog":
            case  '/appointment':
            case '/actvievistors':
                res.redirect('/admin/');
                return;
            break;
            default:
                break;
        }
    }

    /*
    console.log("req.url: " + req.url)
     
    if(req.url.search("signin")>-1 || req.url==="/"){
          console.log("test1");
         next('router');
      }
      else{
       console.log(req.session.sessionid);
      
      if(req && req.session && req.session.sessionid){
        
          next('router');
      }
      else{
          
          res.redirect("/admin/");
      }
    }*/
    next();

});

internalRouter.get('/', function (req, res, next) {
     
    console.log("in /");
    if(req.session.sessionid)
  //   res.render("./admin/vnbar");
       res.render("./admin/index",{data: {name: req.session.name,photo:""}});
    else{
        res.render("./admin/login",{alerttext:""});
    }
});
internalRouter.get('/logout', function (req, res, next) {
     

     req.session.sessionid="";
     req.session.name ="";
     req.session.id="";
  //   res.render("./admin/vnbar");
    res.redirect("/admin/");
    
});


internalRouter.get('/visitlog', async function (req, res, next) {
     
    console.log("path: " + "visitlog");
     try{ 
    const visitlogs = await Visit.find({contact:req.session.userid});
    console.log("visitlog: " + visitlogs.length);
    if(visitlogs){

        
        res.render("./admin/visitorlog",{visitors:visitlogs,data: {name: req.session.name,photo:""}});
    }

     }catch(err){
        res.render("sadpanda",{result:"System busy..."})
        console.error("fetch visit logs from db fail. :" + err);
     }      

});

//preregister:
internalRouter.get('/appointment', function (req, res, next) {
    /*set a session id for the user */
     
    res.render("./admin/appointment",{data: {name: req.session.name,photo:""}});
});


internalRouter.post('/appointment', async function (req, res, next) {
    
    let visitor=undefined;
    console.log("req.body: " + req.body.contactname);
    /*save contact*/
    try{
        if(req.body.contactid){
            visitor = await Contact.findById(req.body.contactid);
        }
        if(!visitor){
                visitor =new Contact({
                firstname  :req.body.contactname,
                lastname:"",
                email      :req.body.email,
                phonenum:"",
                companyname:req.body.companyname,
                creatorid  :req.session.userid,
                creatorname:req.session.username,
                 
                });     
                await visitor.save();
                console.log("create visitor: " + req.body.contactname);


                 
        }
        //create appointment
        const appointment = new Visit({
            visitorid: visitor.id,
            firstname: visitor.firstname,
            lastname:   "",
            email: visitor.email,
            phonenum: "",
            companyname: visitor.companyname,
            contact: req.session.userid, //link to the employee to be visited
            contactname:req.session.name,
            signature: "",
            checkin:"",
            checkout:"",
            preregistertime:new Date(req.body.preregistertime), //preregistered time of visit
            createdtime:Date.now(),
            precreatedcontact: req.session.userid, //link to the employee create this visitor in advance
            buttontype: "Appointment",
            emailnotified:  "",
            smsnotified: "",
            description:req.body.description,
            location:req.body.location,
            subject: req.body.subject,
            
        });
        appointment.save();
            
        const html = await ejs.renderFile(__dirname + "./../views/emailtemplate/preregister.ejs",{data:{visitorname: visitor.firstname,
                  location:appointment.location,invitor:req.session.name, datetime:appointment.preregistertime.toLocaleString(),
                  duration:appointment.duration, description:appointment.description,
                  qrcode:JSON.stringify({visitorid:appointment.visitorid,visitid:appointment.id})}});
        console.log(html);

        console.log(req.body.sendinvite);
        if(req.body.sendinvite){
           /* function getIcalObjectInstance(starttime, endtime, summary,  description, location, url , name ,email) {*/
                 
                  
           /* var icalObj = getIcalObjectInstance(appointment.preregistertime,
                appointment.preregistertime+ appointment.duration*60000 ,appointment.subject,
            appointment.description,appointment.location,'www.abc.com',req.session.name,req.session.email);
*/

            sendemail(visitor.email,"You have an invitation",html);

        }
       
        // /**create qr */GenQR("c:/meng/receptionist/qr/",visitor.id);
        res.render("./admin/addok",{result:"Preregister  OK ",data:{name:req.session.name, photo:""}});
    }
    catch(err){
        console.error(err);
        res.render("sadpanda",{result:"System busy. You will be redirect to main page",redirecturl:"/admin"});
    }

});

/**check existing active vistor --check in time valid ,without check out time */
internalRouter.get("/actvievistors",async function(req,res,next){

    const visitors = await Visit.find({checkin:{$ne:""},checkout:{$eq:""}});

    res.render("./admin/visitorlog",{visitors:visitors,data: {name: req.session.name,photo:""}});

});


internalRouter.delete('/pre-register', function (req, res, next) {
});

//
internalRouter.post('/pre-register', function (req, res, next) {
});

/************************************************************ */
/************************************************************ */
/************************************************************ */
/****sign in  */
internalRouter.post('/signin', function(req,res,next){
    /* */
     console.log("in sign" + req.body.email + "  " + req.body.pazzword);
      if( req.body.email && req.body.pazzword){
          
          let pazzw = req.body.pazzword + "magicsalt~!@";
          console.log( "pazzw"); 
          pazzw = sha(pazzw);
          console.log("hash result: " + pazzw);
          Employee.findOne({email:req.body.email,password:pazzw},(err,employee)=>{

             if(err){
                    console.error("findone error: " + err);
             }
            else if(employee){
                        /**to implement rember me  */
                        req.session.userid = employee.id;
                        req.session.name = employee.firstname +" " + employee.lastname;
                        req.session.email = req.body.email;
                        /*to be done with redis :*/
                        req.session.sessionid = employee.id+Date.now();
                        res.render("./admin/index", {data:{name:req.session.name ,photo:""}});
            } else{
                        console.error("not found user");
                        req.session.userid = "";
                        req.session.name="";
                        req.session.sessionid="";
                        req.session.email = "";
                        res.render("./admin/login",{alerttext:"Email address or password is not correct"});
            }

          });
          
        
        
       
   

    /* */
}
});

internalRouter.post('/deletevisit', async function(req,res,next){

    if(req.body.visitid){

        try{
           await  Visit.deleteOne({id:req.body.visitid});

           res.json({result:'ok'});

        }
        catch(err){
            res.json({result:'nok'});
        }

    }
});




module.exports = internalRouter;