const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const visitorRouter = require("./routers/visitor");
const contactRouter = require("./routers/contact");
const session = require("express-session");
const bodyParser = require("body-parser");
const internalRouter = require("./routers/admin");
const methodoverride = require('method-override');
require('dotenv').config();


 

const app = new express();


app.set('view engine','ejs');
app.set('views','./views');

/*add body parser for post body parse --MIDDLEWARES*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodoverride("_method"));

app.use(session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'reception app 124!@@3#$$%%%^(877gfewsdgksjdpiy8r3887t32vffop',
    expires:new Date(Date.now() + 60 * 60 * 1000)
  })); 
/*ROUTERS*/

app.use('/visitor',visitorRouter);
app.use('/admin',internalRouter);
app.use('/contact',contactRouter);

 

app.get('/test',(req,res)=>{
  res.render("jqtest");
});
app.get('/about',(req,res)=>{
  res.render("about");
});

app.get('/',(req,res)=>{
    res.render('index');
});

 /*STATIC RESOURCES*/
app.use(express.static('public'));
mongoose.connect(process.env.DB_URISTRING,{useNewUrlParser:true,useUnifiedTopology:true},()=>{console.log("connect db success")});

app.listen(process.env.HOSTPORT,()=>{console.log("Express is running!")});


