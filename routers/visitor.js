const express = require('express');
const visitorRouter = express.Router();
const visitController = require("../controller/visit");
 
/****************************************** 
  user portal router

/******************************************** */

visitorRouter.get('/'               ,visitController.showEmployeeList);
visitorRouter.get('/scanvisitorinfo',visitController.showScanVisitorInfo);
visitorRouter.get('/checkout'       ,visitController.showCheckout);
visitorRouter.get('/qr'             ,visitController.showScanPreregistered);
visitorRouter.post('/qr'            ,visitController.submitQR); 
visitorRouter.post('/checkout'      ,visitController.doCheckout );    
visitorRouter.get('/info'           ,visitController.collectVisitorInfo); 
visitorRouter.post('/info'          ,visitController.postVisitorInfo);
visitorRouter.get('/delivery'       ,visitController.doDelivery);
visitorRouter.get('/agreement'      ,visitController.showAgreement); 
visitorRouter.post('/agreement'     ,visitController.postAgreement); 
/*testing,not finished*/ 
visitorRouter.post('/photo'         ,visitController.postPhoto);  
visitorRouter.post('/id'            ,visitController.postID); 

 

 
 
module.exports = visitorRouter;