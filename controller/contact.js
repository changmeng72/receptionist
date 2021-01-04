
//const express = require('express');
//const session = require('express-session')
const Visit = require("./../models/visitor");
const Contact = require("./../models/contact");
//const { json } = require('body-parser');
const ejs = require('ejs');


function fullpath(filename){
    return __dirname + filename;
}

exports.showCreateContact = async function(req,res,next){
    const visitid = req.query.visitid;      
   try{
       let visit = {firstname:"",email:"",phonenum:"",companyname:""};
       if(visitid){
           visit = await Visit.findById(visitid);
       }
       let html = await ejs.renderFile(__dirname + './../views/admin/newcontact.ejs',{pagedata:{url:"/contact",visit:visit}});
       //console.log(html);
       if(html) {
           res.send({result:'ok',html:html});;
       }
       else{
           res.send({result: 'nok',description:"<p>Hello world!</p>"});
       }
   }catch(err){
       console.error(err);
       res.send({result: 'nok',description:"<p>Hello world!</p>"});

   }
};

exports.showContactList = async function(req,res,next){
     
    let html = await ejs.renderFile(fullpath('./../views/admin/contactlist.ejs'),{pagedata:{url:"/contact"}});
    //console.log(html);
    if(html) {
        res.send({result:'ok',html:html});;
    }
    else{
        res.send({result: 'nok',description:"<p>Hello world!</p>"});
    }
};


/** contacts  API*/
exports.getContacts =  async function(req,res,next){    
    const q_search = req.query.search;
    const q_sort = req.query.sort;
    const q_order = req.query.order;
    const q_limit = req.query.limit || 10;
    const q_offset = req.query.offset || 0; 
    const userid = req.session.userid;
    let condition = {creatorid:userid};
    let sortorder = {};
    let numContacts = 0;
try{
    if(userid){
        if(q_search){
            condition = {firstname:{$regex:q_search,$options: 'i'},creatorid:userid};
            numContacts = await Contact.count(condition);
            
        }
        else{
            numContacts = await Contact.count(condition);//estimatedDocumentCount(condition); 
        }
        if(q_sort){
            if(q_order==='asc')
                 sortorder = [[q_sort,1]];
             else
                 sortorder = [[q_sort,-1]];  
    
                 
        }
        const contacts = await Contact.find(condition).sort(sortorder).skip(parseInt(q_offset)).limit(parseInt(q_limit)).exec();
        

         
        res.json({ 
            "total": numContacts,
            "totalNotFiltered": contacts.length,
                "rows": contacts});
    }
    else{
        
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
};


exports.createContact =  async function(req,res,next){
   
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
                    phonenum  :   contact.phonenum,
                    creatorid :   req.session.userid,
                    creatorname : req.session.name,
                    createdtime : Date.now()
                   });

                   await contactObj.save(); 
                   res.json({result:'ok',description:'The client ' + contact.name +" is created successfully." ,contact:contactObj});
               
        }
        else{           
            res.json({result:"nok",description:"data error"});
        }
    }catch(err){
        console.error(err);
        res.json({result:"nok",description:"system busy"});
        
    }
};

 
/**
 * 
 *  unfinished 
 */
exports.uploadFile = async function(req,res,next){
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      }
    
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let sampleFile = req.files.uploadfile;
    
      // Use the mv() method to place the file somewhere on your server
      sampleFile.mv(__dirname + './../1.dat', function(err) {
        if (err)
          return res.status(500).send(err);
          res.send('File uploaded!');
        });
      };
    



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
/**
 * delete batch
 */

 exports.deleteBatch = async function(req,res,next){

     let ids = null;
     if(req.body.ids) 
        ids = JSON.parse(req.body.ids);
    if(ids!==null && ids.length>0){
         try{
                await Contact.deleteMany({_id:{$in:ids}});
                res.json({result:"ok",description:"Delete contacts successfully."});
         }catch(err){
             console.error(err);
             res.json({result:"nok",description:"Delete failed"});
         }
     }
     else{
        res.json({result:"nok",description:"Request data error!"});
     }
};
 



 exports.delete = async function(req,res,next){
    
    const userid =  req.params.userid;
     
    try{
          if(userid){
             let contactObj = await  Contact.findByIdAndDelete(userid);
              
             if(contactObj)
                 res.json({result:"ok",description:"The client "+ contactObj.firstname + "is removed from your contact list."}); 
             else
                 res.json({result:"ok",description:"The client is removed from your contact list."}); 
             
                  
            }
            else{
             res.json({result:"nok",description:"Data error"});
            }
        }catch(err){
            console.error(err);
         res.json({result:"nok",description:"System busy"});
         
     }
 };

