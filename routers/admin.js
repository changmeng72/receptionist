const express = require('express');
const session = require('express-session');
const ejs= require('ejs');
const internalRouter = express.Router();
const employeeController = require('./../controller/employee');
const adminController = require('./../controller/admin');
const {loginRequired,checkPermission} = require('./role');

 
internalRouter.get('/login',     (req,res,next)=> res.render("./admin/login",{alerttext:""}));

internalRouter.get('/'  ,              loginRequired(false),  adminController.showMainpage);
internalRouter.get('/visitlog',        loginRequired(true), checkPermission('readOwn','visit'), adminController.showVisitlog);
internalRouter.post('/visitlog',       loginRequired(true), checkPermission('readOwn','visit'),adminController.showVisitlog);
internalRouter.get('/myinfo',          loginRequired(true), checkPermission('updateOwn','profile'), employeeController.showMyInfo);
internalRouter.get('/myphoto',         loginRequired(true), checkPermission('updateOwn','profile'), employeeController.showMyPhoto);
internalRouter.put('/myphoto',         loginRequired(true), checkPermission('updateOwn','profile'), employeeController.editMyPhoto);
internalRouter.post('/myphoto',        loginRequired(true), checkPermission('updateOwn','profile'), employeeController.uploadMyPhoto);
//
internalRouter.get('/logout',          adminController.logout);
internalRouter.get('/appointment',     loginRequired(true), checkPermission('readOwn','appointment'),adminController.showAppointment);
internalRouter.post('/appointment',    loginRequired(true), checkPermission('createOwn','appointment'),adminController.createAppointment);
internalRouter.get("/actvievistors",   loginRequired(true), checkPermission('readAny','visit'),adminController.showVisitlog);
internalRouter.delete('/pre-register', loginRequired(true), checkPermission('deleteOwn','visit'),adminController.deleteAppointment);
internalRouter.post('/pre-register',   loginRequired(true), checkPermission('updateOwn','appointment'), adminController.updateAppointment);
internalRouter.post('/signin',          adminController.signin);
internalRouter.post('/deletevisit',    loginRequired(true), checkPermission('deleteAny','visit'), adminController.deleteVisit);

internalRouter.get('/employee/list'           ,loginRequired(true), checkPermission('readAny','profile'), employeeController.showEmployeeList);
internalRouter.get('/employee'                ,loginRequired(true), checkPermission('readAny','profile'), employeeController.getEmployeeList);
internalRouter.get('/employee/new'            ,loginRequired(true), checkPermission('createAny','profile'), employeeController.showCreateNewEmployee);
internalRouter.post('/employee'               ,loginRequired(true), checkPermission('createAny','profile'), employeeController.createNewEmployee);
internalRouter.post('/employee/upload'        ,loginRequired(true), checkPermission('createAny','profile'), employeeController.uploadFileEmployee);
internalRouter.delete('/employee/:employee_id',loginRequired(true), checkPermission('deleteAny','profile'), employeeController.deleteEmployee);
internalRouter.delete('/employee/'            ,loginRequired(true), checkPermission('deleteAny','profile'), employeeController.deleteEmployees);

internalRouter.get('/employee/edit'            ,loginRequired(true), checkPermission('updateAny','profile'), employeeController.showEditEmployee);
internalRouter.put('/employee/:employee_id'    ,loginRequired(true), checkPermission('updateAny','profile'), employeeController.editEmployee);

 

 


module.exports = internalRouter;