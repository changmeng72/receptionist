
const express = require('express');
const session = require('express-session')
const Visit = require("./../models/visitor");
const Contact = require("./../models/contact");
const Employee = require("./../models/employee");
const mongoose = require('mongoose');
const { json } = require('body-parser');
const visitor = require('./../models/visitor');
const ejs = require('ejs');

const internalRouter = express.Router();

function fullpath(filename){
    return __dirname + filename;
}


internalRouter.all('*',async function(req,res,next){
    console.log("url=>" + req.url);
    if(!req.session.sessionid || !req.session.userid){
        switch(req.url){
            case "/":
            case  '/new':
            case '/list':
                res.redirect('/admin/');
                return;
            break;
            default:
                break;
        }
    }
    next();
});

/*contact management*/
internalRouter.get('/new',async function(req,res,next){
    console.log("get");
    try{
        console.log(__dirname);
        let html = await ejs.renderFile(__dirname + './../views/admin/newcontact.ejs',{pagedata:{url:"/contact"}});
        //console.log(html);
        if(html) {
            res.send(html);
        }
        else{
            res.send("<p>Hello world!</p>");
        }
    }catch(err){
        console.error(err);
        res.send("<p>Hello world!</p>");

    }
});
internalRouter.get('/list',async function(req,res,next){
    console.log("get");
    let html = await ejs.renderFile(fullpath('./../views/admin/contactlist.ejs'),{pagedata:{url:"/contact"}});
    //console.log(html);
    if(html) {
        res.send(html);
    }
    else{
        res.send("<p>Hello world!</p>");
    }
});



/** contacts  API*/
internalRouter.get('/', async function(req,res,next){
    
    const q_search = req.query.search;
    const q_sort = req.query.sort;
    const q_order = req.query.order;
    const q_limit = req.query.limit;
    const q_offset = req.query.offset; 
    const userid = req.session.userid;
try{
    if(userid){
        const contacts = await Contact.find({creatorid:userid});
        console.log(" find contacts :" + contacts.length);
        res.json({ 
            "total": contacts.length,
            "totalNotFiltered": contacts.length,
                "rows": contacts});
    }
    else{
        console.log("not find contacts");
        res.json({
            "total": 0,
            "totalNotFiltered": 0,
                "rows": []});
    }
}
catch(err){
    console.error(err);
    res.json({
        "total": 0,
        "totalNotFiltered": 0,
            "rows": []});
}
}
);

internalRouter.post('/', async function(req,res,next){
   console.log("create new one");
   const contact = JSON.parse(req.body.contact);
   let contactObj = null;
   try{
        if(contact){
            if(contact.email && req.session.userid){
               contactObj = await Contact.find({email:contact.email,creatorid: req.session.userid});
               if(contactObj && contactObj.length>0)
               { 
                   
                   res.json({result:'nok',description:'email is in use',contact:contactObj});
                   return;
               }
            }  
            
                   contactObj =  new Contact({
                    firstname :   contact.name,
                    lastname  : "",
                    email     :   contact.email,
                    companyname: contact.companyname,
                    phonenum  :"",
                    creatorid :   req.session.userid,
                    creatorname : req.session.name,
                    createdtime : Date.now()
                   });

                   await contactObj.save();
                   res.json({result:'ok',description:'ok',contact:contactObj});
               
        }
        else{           
            res.json({result:"nok",description:"data error"});
        }
    }catch(err){
        console.error(err);
        res.json({result:"nok",description:"system busy"});
        
    }
});
/*
internalRouter.update('/:userid', async function(req,res,next){
     
    const userid =  req.params['userid'];
    let contact = JSON.parse(req.body.contact);
    try{
          if(userid && Types.ObjectId.isValid(userid) && contact){
             let contactObj = await  Contact.update({id:userid},{$set:contact},{ upsert: true });
             res.json({result:"ok",description:"ok",contact:contactObj}); 
            }
            else{
             res.json({result:"nok",description:"data error"});
            }
        }catch(err){
         res.json({result:"nok",description:"system busy"});
         
     }
 });*/
 internalRouter.delete('/:userid', async function(req,res,next){
    
    const userid =  req.params.userid;
    console.log("delete contract: " + userid);
    try{
          if(userid && mongoose.Types.ObjectId.isValid(userid)){
             let contactObj = await  Contact.deleteOne({id:userid});
             res.json({result:"ok",description:"ok",contact:contactObj}); 
            }
            else{
             res.json({result:"nok",description:"Data error"});
            }
        }catch(err){
            console.error(err);
         res.json({result:"nok",description:"System busy"});
         
     }
 });


module.exports = internalRouter ;