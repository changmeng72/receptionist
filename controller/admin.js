//const express = require('express');
//const session = require('express-session');
const Visit = require('../models/visitor');
const Employee =  require('../models/employee');
const Contact = require('../models/contact');
const GenQR = require("../utils/qrcode");
const sha  = require('../utils/sha');
const {sendemail,getIcalObjectInstance} = require('../utils/email');
const ejs= require('ejs');
//const { find } = require('../models/employee');



exports.showVisitlog = async function (req, res, next) {
     
      let activeflag = false;
      let condition = {deleteDate: null };
      
     if(req.method==="POST"){         
         if(req.body.buttonType && req.body.buttonType!=="0"){
             condition['buttontype'] = req.body.buttonType;
         }
         if(req.body.visitorName && req.body.visitorName!==""){
            condition['firstname'] =  {$regex:req.body.visitorName,$options: 'i'};
        }
        if(req.body.statusFilted && req.body.statusFilted!=="0"){
            switch(req.body.statusFilted){
                case "Checkedin":
                    condition['checkin'] = {$ne:null};
                    condition['checkout'] = null;
                break;
                case "Checkedout":
                    condition['checkout'] = {$ne:null}; 
                break;
                case "Preregistered":
                    condition['checkin'] = null; 
                break;
                default:
                break;


            }
        } 
       if(req.body.activelogflag){
            condition['checkin'] = {$ne:null};
            condition['checkout'] = null;
            activeflag = true;

        }
        else{
            condition['contact'] = req.session.userid;
        }
        
        
        if(req.body.dateRange && req.body.dateRange!==""){

            let dates = req.body.dateRange.split(' - ');
            if(dates.length===2){
                let startdate = new Date(dates[0]);
                let enddate = new Date(dates[1]);
                if(req.body.statusFilted==="Preregistered")
                    condition['preregistertime']= {$gte:startdate,$lte:enddate};
                else if(req.body.statusFilted==="Checkedout")
                    condition['checkout'] = {$gte:startdate,$lte:enddate};
                else
                    condition['checkin'] = {$gte:startdate,$lte:enddate};
                }
            }

             
        }
        else if(req.method==="GET"){
            
            if(req.query && req.query.active!==undefined){

            condition = {checkin:{ $ne: null }, checkout:null,deleteDate:null};
            activeflag = true;
            }
            else
            condition = {contact:req.session.userid,deleteDate:null}
      }
       
     
     try{ 
    const visitlogs = await Visit.find(condition).sort({createdtime:-1}).exec();
    if(visitlogs){
       
        const html = await ejs.renderFile(__dirname + './../views/admin/visitorlog.ejs',{visitors:visitlogs,title:activeflag?"Active visitlog":"My Visit Log",activelog:activeflag });
        res.status(200).send({result:'ok',html:html});;
         
    }

     }catch(err){
         console.error(err);
         const html = await ejs.renderFile(__dirname + './../views/admin/visitorlog.ejs',{visitors:[],title:"My Visit Log"});
         res.status(200).send({result:'ok',html:html});         
         
     }      

};

exports.showMainpage = function (req, res, next) {
     
    res.render("./admin/index",{data: {name: req.session.name,photo:req.session.photo,role:req.session.role}});
    
};

exports.logout =   function (req, res, next) {
     

     req.session.sessionid="";
     req.session.name ="";
     
  //   res.render("./admin/vnbar");
     //res.json({result:'nok',url:'/admin/login'});
     res.redirect('/admin/login');
    
};




 

//preregister:
exports.showAppointment =  async function (req, res, next) {
    /*set a session id for the user */
    const contactid = req.query.contactid;
    const visitid = req.query.visitid;

    let contactObj = {firstname:"",email:"",phonenum:"",companyname:"",id:null};
     
    if(contactid && contactid!==null ){
        try{
           contactObj = await Contact.findById(contactid);
         
        }catch(err){
            console.error(err);            
        }
    }
    else if(visitid && visitid!==null){
        try{
            const visit = await Visit.findById(visitid);
            contactObj.firstname = visit.firstname;
            contactObj.email = visit.email;
            contactObj.phonenum = visit.phonenum;
            contactObj.companyname = visit.companyname; 
        }
        catch(err){
            console.error(err);             
        }
    }

    try{
        const html = await ejs.renderFile(__dirname + "./../views/admin/appointment.ejs",{data:{contact:contactObj}});
        res.status(200).send({result:'ok',html:html});
     }

     catch(err){
         console.error(err);
        res.status(500).send("internal error");
     }
};





exports.createAppointment = async function (req, res, next) {    
    let visitor=undefined;
     /*save contact */
    try{
         
        //create appointment
        const appointment = new Visit({
            visitorid: req.body.contactid,
            firstname: req.body.contactname,
            lastname:   "",
            email: req.body.email,
            phonenum: "",
            companyname: req.body.companyname,
            contact: req.session.userid, //link to the employee to be visited
            contactname:req.session.name,
            signature: "",
            checkin:"",
            checkout:"",
            preregistertime:new Date(req.body.preregistertime), //preregistered time of visit
            createdtime:Date.now(),
            precreatedcontact: req.session.userid, //link to the employee create this visitor in advance
            buttontype: "Here for an appointment",
            emailnotified:  "",
            smsnotified: "",
            description:req.body.description,
            location:req.body.location,
            subject: req.body.subject,
            
        });
        appointment.save();
            
        const html = await ejs.renderFile(__dirname + "./../views/emailtemplate/preregister.ejs",{data:{visitorname: appointment.firstname,
                  location:appointment.location,invitor:req.session.name, datetime:appointment.preregistertime.toLocaleString(),
                  duration:appointment.duration, description:appointment.description,
                  qrcode:JSON.stringify({visitorid:appointment.visitorid,visitid:appointment.id})}});
        //console.log(html);

        //console.log(req.body.sendinvite);
        if(req.body.sendinvite){
           /* function getIcalObjectInstance(starttime, endtime, summary,  description, location, url , name ,email) {*/
                 
                  
           /* var icalObj = getIcalObjectInstance(appointment.preregistertime,
                appointment.preregistertime+ appointment.duration*60000 ,appointment.subject,
            appointment.description,appointment.location,'www.abc.com',req.session.name,req.session.email);
*/

            sendemail(appointment.email,"You have an invitation",html);

        }
       
        // /**create qr */GenQR("c:/meng/receptionist/qr/",visitor.id);
        res.status(200).json({result:"ok",description:"Appointment is added successfully."});
       // res.render("./admin/addok",{result:"Preregister  OK ",data:{name:req.session.name, photo:req.session.photo}});
    }
    catch(err){
        console.error(err);
        res.render("sadpanda",{result:"System busy. You will be redirect to main page",redirecturl:"/admin"});
    }

};

/**check existing active vistor --check in time valid ,without check out time */


exports.showActiveVisit = async function(req,res,next){   
   
    try{
        const visitors = await Visit.find().sort({createdtime:-1}).exec();

        const html = await ejs.renderFile(__dirname +  './../views/admin/visitorlog.ejs',{visitors:visitors,title:"Active Visit Log",activelog:true});
        res.status(200).json({result:"ok",html});

    }catch(err){
        res.status(200).json({result:"ok",html:"<em>"+ err +"</em>"});

    }

};

exports.deleteAppointment = function (req, res, next) {
};

//
exports.updateAppointment = function (req, res, next) {
};

/************************************************************ */
/************************************************************ */
/************************************************************ */
/****sign in  */

exports.signin = function(req,res,next){
    /* */
    if( req.body.email && req.body.pazzword){
          
          let pazzw = req.body.pazzword + "magicsalt~!@";
          pazzw = sha(pazzw);
          Employee.findOne({email:req.body.email,password:pazzw},(err,employee)=>{

             if(err){
                    console.error("findone error: " + err);
             }
            else if(employee){
                        /**to implement rember me  */
                        req.session.userid = employee.id;
                        req.session.name = employee.firstname ;
                        req.session.email = req.body.email;
                        req.session.role = employee.role || 'common';
                        if(employee.photo!==null)
                           req.session.photo = "/staff/image/" + employee.id+"_thumbnail.png";
                        else 
                           req.session.photo = "/image/icon-man.svg";
                        /*to be done with redis :*/
                        req.session.sessionid = employee.id+Date.now();
                       // res.render("./admin/index", {data:{name:req.session.name ,photo:req.session.photo}});
                       res.redirect('/admin');
            } else{
                        clearSession(req);
                        res.render("./admin/login",{alerttext:"Email address or password is not correct"});
            }

          });
    /* */
}
};
/////////////////////////////////////
/////
/////////////////////////////////////////////

/////////////////////////////////////
/////
/////////////////////////////////////////////

exports.deleteVisit =  async function(req,res,next){

    if(req.body.visitid){

        try{
           await  Visit.findByIdAndUpdate(req.body.visitid,{deleteDate:Date.now(),deleteAdmin:req.session.userid});
           res.json({result:'ok'});
        }
        catch(err){
            res.json({result:'nok'});
        }
    }
};

function clearSession(req){
    req.session.userid = "";
    req.session.name="";
    req.session.sessionid="";
    req.session.email = "";
    req.session.role = "" ;
}
