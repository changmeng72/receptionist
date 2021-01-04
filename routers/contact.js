


const contactController = require('./../controller/contact');
const express = require('express');
const internalRouter = express.Router();
const {loginRequired,checkPermission} = require('./role');

/**
 * 
 *  router for contact management ,part of admin portal
 *  
 */
/*contact management*/
internalRouter.get('/new',        loginRequired(true), checkPermission('createOwn','contact'), contactController.showCreateContact);
internalRouter.get('/list',       loginRequired(true), checkPermission('readOwn','contact'), contactController.showContactList);
internalRouter.get('/',           loginRequired(true), checkPermission('readOwn','contact'), contactController.getContacts);
internalRouter.post('/',          loginRequired(true), checkPermission('createOwn','contact'), contactController.createContact);
internalRouter.post('/upload',    loginRequired(true), checkPermission('createOwn','contact'), contactController.uploadFile);
internalRouter.delete('/',        loginRequired(true), checkPermission('deleteOwn','contact'), contactController.deleteBatch);
internalRouter.delete('/:userid', loginRequired(true), checkPermission('deleteOwn','contact'), contactController.delete);

module.exports = internalRouter ;