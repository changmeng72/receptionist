/*
var nt = new Date(Date.now());
console.log(nt.toLocaleString());



async function test(){
     const html = await ejs.renderFile('x.html');
     console.log(html);
}*/
const ejs = require('ejs');
const HTMLDocx = require('html-docx-js');
const fs = require('fs');
const {sendemail}=require('./../utils/email');
async function test(){
     console.log(process.argv);
  //const input = process.argv[2];
  const output = "res.docx"
  try{

const imagedata = "data:image/png;base64,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"

          const html = await /*fs.readFile(input,'utf-8');*/ ejs.renderFile(__dirname+"./../views/doctemplate/ndsWithSig.ejs",{data:{imagedata:imagedata}});
          const docx = HTMLDocx.asBlob(html);
          fs.writeFile(output,docx,(err)=>{
               if(err){
                    throw err;
               }
          });
            
          sendemail("changmeng72@gmail.com","test",html,null,[{filename:"abc.docx",path:"./res.docx"}]);

  }catch(err){
       console.error(err);
  }
}

test();