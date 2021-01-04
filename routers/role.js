const accesscontrol = require("accesscontrol");
const ac = new accesscontrol();
/*simple role control(hard coded)
  we have 3 roles:
 
  common: manage self
  receptionist: manage active visit
  admin: create employee

  now one person one role

  resources:
   profile 
   visit
   conntact
   appointment


*/
roles = (function(){
    ac.grant("common").readOwn("profile").updateOwn("profile").
    readOwn("visit").updateOwn("visit").deleteOwn("visit").createOwn("visit").
    readOwn("contact").updateOwn("contact").deleteOwn("contact").createOwn("contact").
    readOwn("appointment").updateOwn("appointment").deleteOwn("appointment").createOwn("appointment");;

    ac.grant("receptionist").extend('common').readAny("visit").updateAny("visit").deleteAny('visit');

    ac.grant("admin").extend("receptionist").readAny("profile").updateAny("profile").deleteAny("profile").createAny('profile');

    return ac;
})();

exports.loginRequired =  (jsonreq=true) =>{
    
    return (req,res,next)=>{
    
    if(req.session.sessionid) 
        next();
    else{
        
        if(jsonreq)
            res.json({result:"nok",description:"login pleasse",url:"/admin/login"});
        else
            res.redirect("/admin/login");
    }
};
};

exports.checkPermission = (action, resource) => {
   
    return  async (req,res,next)=> {
     try{
         const permission = roles.can(req.session.role)[action](resource);
         if(!permission.granted){
             
             return res.status(401).end("You don't have enough permission to perform this action");
         }
         next();
     }catch(err){
         console.error("permission error: " + err);
         next(err)
     }
    }
}