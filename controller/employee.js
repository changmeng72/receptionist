
const Employee = require("../models/employee");
const ejs = require('ejs');
const {sendemail,getIcalObjectInstance} = require('../utils/email');
const sha = require('./../utils/sha');
//const {json} = require("body-parser");
//const { findOneAndDelete } = require("../models/employee");
const XLSX = require("xlsx");
const fs = require('fs/promises');
//const base64 = require("base-64");
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require("constants");



/**
 * hard coded department, position . more need to implement
 */
var departments=["Accounting","CEO Office","Customer service","Law issue office","Marketing I","R&D center", "Sales I","Sales II","Finance Planning"];
var positions = ['CEO','CFO','CTO','CIO','Director','Senior Sales Representive','Software developer','Sales Representive','Deputy Director','Accountant','Senior Accountant'];

exports.showCreateNewEmployee = async function(req,res,next){
    try{
        let html = await ejs.renderFile(__dirname + './../views/admin/createnewstaff.ejs',
            {data:{url:"/admin/employee",departments:departments,positions:positions,title:"Create a new employee",myinfo:null,edit:false}});
        if(html) {
            res.send({result:'ok',html});
        }
        else{
            res.send("<p>Hello world!</p>");
        }
    }catch(err){
        console.error(err);
        res.send("sadpanda",{descirption:"NOK"});

    }

};

exports.showEditEmployee = async function(req,res,next){
    const employeeid = req.query.id;    
    try{
        if(employeeid){
            employee = await Employee.findById(employeeid);
       
        let html = await ejs.renderFile(__dirname + './../views/admin/editstaff.ejs',{data:{
            url:"/admin/employee",departments:departments,positions:positions,
            employee:employee
        }});
        if(html) {
            res.send({result: 'nok',html});;
        }
        else{
            res.status(404).send({result:"nok",description:"Data does not exist."});
        } }
    }catch(err){
        console.error(err);
        res.send("sadpanda",{descirption:"NOK"});
    }

};

exports.editEmployee = async function(req,res,next){
    try{  
     const employid = req.params.employee_id;
     const employee = JSON.parse(req.body.contact);    
     if(employid){
         await Employee.findByIdAndUpdate(employid,{//firstname:req.body.name,
        phonenum:employee.phonenum,
       // position:req.body.position,
        //department:req.body.department
        });
        res.status(200).json({result:"ok"});
     }else{    
         console.error("no employeeid found");
     res.status(404).send("employee not found ");
     }
    }catch(err){
        console.error(err);
        res.status(404).send("employee not found ");
    }


};
////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////
exports.createNewEmployee = async function(req,res,next){
    try{
        if(req.body && req.body.contact){
            const employee = JSON.parse(req.body.contact);            
            if(employee.email!==null && isValidEmail(employee.email)){
                let employeeObj = await Employee.findOne({email:employee.email.toLowerCase()});
               // console.log("employee found: " + employee);
                if(employeeObj){
                res.json({result:"nok",description:"The email has been registered in the system, please check up ."});
                    return;
                }
                let password = generatePassword();             
                employeeObj = new Employee({
                    firstname: employee.name,
                    lastname:  null,
                    email: employee.email,  //contact infor
                    phonenum: employee.phonenum,
                    department: employee.department,
                    photo:  null ,
                    position:employee.position,
                    password:sha(password+"magicsalt~!@"),
                    createdtime: Date.now() ,
                    role:employee.role                
                });
                await employeeObj.save();

                let result = await sendemail(employee.email,"Your accournt has been created",
                [   "<p><h2>Please login Receptionist and chang your password.</h2></p>",
                    "<p><h4> Your initial password is <em>" + password +"</em></h4></p>"
                ].join('')
                );

                res.status(200).json({result:"ok",description: (result?"New staff is created,and the password is sent to him by email.":
                "New staff is created,but the password sending falied.")});
                return;
            }
        }
            
            res.status(200).json({result:"nok",description:"the request is not valid"});
            
    }catch(err){
        console.error(err);
        res.status(200).send("sadpanda",{descirption:"NOK"});

    }

};
////////////////////////////////////////////////////////////////
//
//todo: to implement with contidions
/////////////////////////////////////////////////////////////////
exports.getEmployeeList = async function(req,res,next){
   try{
       
       const q_search = req.query.search;
       const q_sort = req.query.sort;
       const q_order = req.query.order;
       const q_limit = req.query.limit ||10
       const q_offset = req.query.offset || 0; 
       let numEmployees = 0;

       
      
       let condition = {}
       let sortorder = {}
       if(q_search){
           condition = {firstname:{$regex:q_search,$options: 'i'}};
           numEmployees = await Employee.count(condition);
           
       }
       else{
              numEmployees = await Employee.countDocuments(condition); 
       }
        
       if(q_sort){
           if(q_order==='asc')
                sortorder = [[q_sort,1]];
            else
                sortorder = [[q_sort,-1]];                  
       }
       const employees = await Employee.find(condition).sort(sortorder).skip(parseInt(q_offset)).limit(parseInt(q_limit)).exec();
       
       if(employees.length!==0)
          res.status(200).json({ 
               "total"           : numEmployees,
               "totalNotFiltered": employees.length,
                "rows"           : employees});
       
   }
   catch(err){
       console.error(err);
       res.status(200).json({ 
        "total"           : 0,
        "totalNotFiltered": 0,
         "rows"           : []});
   }
}
////////////////////////////////////////////////////////////////
//
//todo: to implement with contidions
/////////////////////////////////////////////////////////////////
exports.showEmployeeList = async function(req,res,next){
    try{
        let html = await ejs.renderFile(__dirname + './../views/admin/employeelist.ejs',{pagedata:{url:"/admin/employee"}});
        //console.log(html);
        if(html) {
            res.status(200).send({result: 'ok',html});;
        }
        else{
             
            res.status(404).send({result:'nok',description:"Resource is lost."});
        }
    }catch(err){
        console.error(err);
        res.status(404).send({result:'nok',description:"Resource is lost."});
    }

};
////////////////////////////////////////////////////////////////
//
// delete a employee
/////////////////////////////////////////////////////////////////
exports.deleteEmployee = async function(req,res,next){
    try{
         const employeeid = req.params.employee_id;
         if(employeeid){
             const employee = await Employee.findByIdAndDelete(employeeid);
             res.status(200).json({result:"ok",description:"Remove operation is successful."});
             return;
         }
         else{
            res.status(500).json({result:"nok",description:"Invalid request"});
         }
    }
    catch(err){
        console.error(err);
        res.status(500).json({result:"nok",description:"Operation failed"});

    }
}
////////////////////////////////////////////////////////////////
//
// delete  employees in batch
/////////////////////////////////////////////////////////////////
exports.deleteEmployees = async function(req,res,next){
    let ids = null;
     if(req.body.ids) ids = JSON.parse(req.body.ids);
    if(ids!==null && ids.length>0){
         try{
                await Employee.deleteMany({_id:{$in:ids}});
                res.json({result:"ok",description:"Delete contacts successfully."});
         }catch(err){
             console.error(err);
             res.json({result:"nok",description:"Delete failed"});
         }
     }
     else{
        res.json({result:"nok",description:"Request data error!"});
     }
}
function isValidEmail(email){
   return true;
}
/**
 * need implement
 */
function generatePassword(){
    return "999999" ;
}

////////////////////////////////////////////////////////////////
//
// delete a employee
/////////////////////////////////////////////////////////////////
exports.uploadFileEmployee = async function(req,res,next){
    try{
        //express-fileupload req.files
        if(req.files && req.files.staffUploadfile){
            const workbook = XLSX.readFile(req.files.staffUploadfile.tempFilePath);
            var sheet_name_list = workbook.SheetNames;
            var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
            const num = xlData.length;
            let password = sha("999999"+"magicsalt~!@");
            for(let employee of  xlData){
                
                let employeeObj = new Employee({
                    firstname:employee.firstname,
                    department:employee.department,
                    position:employee.position,
                    email:employee.email,
                    phonenum:employee.phonenum,                 
                    password:password
                });
                await employeeObj.save()
            }
            
            res.status(200).send(['<script language="javascript" type="text/javascript">',
            'window.top.window.stopUpload(1);',
         '</script> '].join(''));
        }

    }catch(err){
        console.error(err);
        res.status(500).json({result:'nok'});
    }
}
////////////////////////////////////////////////////////////////
//
// edit a employee
/////////////////////////////////////////////////////////////////

exports.showMyInfo =  async function(req,res,next){
    
    try{
        const myinfo = await Employee.findById(req.session.userid);
        if(myinfo){
            myinfo.password=null;
            const html = await ejs.renderFile(__dirname + "./../views/admin/createnewstaff.ejs",
                    {data:{url:"/admin/employee/"+req.session.userid+"?_method=put",departments:departments,positions:positions,
                    title:"My Information",myinfo:myinfo,edit:true}});
            res.status(200).json({result:'ok',html});
        }
    }
    catch(err){
          console.error(err);
          res.json({result:'nok',description:"System error",url:'/admin'});
    }

}

exports.showMyPhoto =  async function(req,res,next){
    
    try{
        let tempfile = 1;
        const myinfo = await Employee.findById(req.session.userid);
        if(myinfo){
            let photourl = null;
            req.session.photoFileName = null;
            if(myinfo.photo!==null){
                req.session.photoFileName =  myinfo.photo ;   
                tempfile = 0;             
            }
            else{
                req.session.photoFileName = null;
                tempfile = 1;
            }
            const html = await ejs.renderFile(__dirname + "./../views/admin/myphoto.ejs",
                    {data:{photo: req.session.photoFileName,title:"Edit or Upload your photo",tempPhoto:tempfile}});
            res.status(200).send(html);
        }
    }
    catch(err){
          console.error(err);
          res.json({result:'nok',description:"System error",url:'/admin'});
    }

}

exports.uploadMyPhoto=  async function(req,res,next){
    
    try{
        //console.log("filename:" + req.files.tempPhoto.name);
        if(req.files && req.files.tempPhoto){
            const fileNameParts = req.files.tempPhoto.name.split('.');
            let fileExt = 'jpg';
            if(fileNameParts && fileNameParts.length>1){                
                req.session.fileExt = fileNameParts[fileNameParts.length-1];  
                await fs.rename(req.files.tempPhoto.tempFilePath,'./public/staff/image/' + req.session.userid+"_tmp." + req.session.fileExt);                
                req.session.tempFileName =  '/staff/image/' +  req.session.userid+"_tmp." + req.session.fileExt;
                const photourl = req.session.tempFileName;
                res.render('admin/myphoto.ejs',{data:{photo:photourl,title:"Edit or Upload your photo",tempPhoto:1}});
                return;
            }            
        }
    }catch(err){
        console.error(err);

    }
    res.render('admin/myphoto.ejs',{data:{photo:req.session.photo,title:"Upload failed",tempPhoto:0}});

}

exports.editMyPhoto=  async function(req,res,next){

    if(req.body.image){
        try{
       // console.log(req.body);   
       const filename  =  "./public/staff/image/" + req.session.userid + "_thumbnail.png" ;         
       const bytes = Buffer.from(req.body.image.substring(req.body.image.search(',')+1), 'base64');
       //console.log("image: " + bytes);       
       await fs.writeFile(filename,bytes);
       if(req.body.tempPhoto==1){
         if(req.session.photoFileName){ 
           await fs.unlink('./public'+ req.session.photoFileName); 
         }
         req.session.photoFileName ='/staff/image/'  + req.session.userid+'.'+  req.session.fileExt;  
         req.session.photo =  "/staff/image/" + req.session.userid + "_thumbnail.png" ; 
         await fs.rename('./public'+req.session.tempFileName,'./public' + req.session.photoFileName);           
         await Employee.findByIdAndUpdate(req.session.userid,{photo:req.session.photoFileName});       
         res.json({result:"ok",description:"ok"});
        }
    }
         
        catch(err){
            console.error(err);
            res.json({result:"nok",description:"system error"})
        }
    }
    else{
        console.error("client submit data error");
        res.json({result:"nok",description:"data error"})
    }

}