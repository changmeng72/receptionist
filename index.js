const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const visitorRouter = require("./routers/visitor");
const contactRouter = require("./routers/contact");
const session = require("express-session");
const bodyParser = require("body-parser");
const internalRouter = require("./routers/admin");
const testRouter = require("./routers/test");
const methodoverride = require('method-override');
const expressFileupload = require("express-fileupload")
const fs = require("fs");
const http = require("http");
const https = require("https");
const logger = require("morgan"); 
const path = require("path");

/*https cerificates*/
const privateKey = fs.readFileSync("./selfsigned.key","utf-8");
const privateCertificate = fs.readFileSync("./selfsigned.crt","utf-8");
const credentials = {key:privateKey,cert:privateCertificate};


require('dotenv').config();


 

const app = new express();


app.set('view engine','ejs');
app.set('views','./views');

/*add body parser for post body parse --MIDDLEWARES*/
app.use(bodyParser.json({limit : "10mb"}));
app.use(bodyParser.urlencoded({extended: false,limit : "10mb"}));
app.use(methodoverride("_method"));
app.use(expressFileupload({useTempFiles:true,
                           tempFileDir:"./document",
                           preserveExtension:true,
                           abortOnLimit:true,
                           limits: { fileSize: 10 * 1024 *1024 }}));

app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'reception app 124!@@3#$$%%%^(877gfewsdgksjdpiy8r3887t32vffop',
    expires:new Date(Date.now() + 60 * 60 * 1000)
  })); 
app.use(bodyParser.raw({ inflate: true, limit: '5mb', type: 'image/*' }));
/*ROUTERS*/

/*logger*/
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
const skipFile = (req,res)=>{
  if(req.url ==='/') return false;
  if(req.url.search('/visitor')===0) return false;
  if(req.url.search('/admin')===0) return false;
  if(req.url.search('/contact')===0) return false;
  return true;
}
app.use(logger('combined',{stream:accessLogStream,skip: skipFile}));
/*admin router's*/
app.use('/visitor',visitorRouter);
app.use('/admin',internalRouter);
app.use('/contact',contactRouter);
app.use('/test',testRouter);




app.get('/about',(req,res)=>{
  res.render("about");
});

app.get('/',(req,res)=>{
    req.session.regenerate((err)=>{
      if(err){
         res.status(500).send("System busy");
      }else
         res.render('index');
    });
   
});

 /*STATIC RESOURCES*/
app.use(express.static('public'));

/*connect to database*/
const connectDB = async ()=> {
  try{
         const db = await mongoose.connect(process.env.DB_URISTRING,{useNewUrlParser:true,useUnifiedTopology:true},()=>{});
         console.log("connect db success");
         
  }catch(err){
    console.error(err);
     
  }
};
connectDB();
/*http server and https server*/
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials,app);

//app.
httpServer.listen(process.env.HOSTPORT,()=>{console.log("Express HTTP server is running!")});
httpsServer.listen(process.env.HOSTSPORT,()=>{console.log("Express HTTPS server is running!")});


/*exit handler*/ 
const exitHandler=async ()=>{
   
   await mongoose.connection.close(function () {
      console.log('Mongoose disconnected on app termination');
    });   
   
    process.exit(0);
}

process.on('exit',exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);