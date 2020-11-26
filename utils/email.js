const nodemailer = require('nodemailer');
const ical = require('ical-generator');
const { getMaxListeners } = require('../models/visitor');
//const sendmail = require('sendmail')();
 /*
sendmail({
    from: 'changmeng72@gmail.com',
    to: 'cmonlinecn@163.com ',
    subject: 'test sendmail',
    html: 'Mail of test sendmail ',
  }, function(err, reply) {
    console.log(err && err.stack);
    console.dir(reply);
});

var transporter = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  auth: {
      user: 'changmeng72@gmail.com',
      pass: '111111Ab'
  },
  tls:{ rejectUnauthorized: false}
}))*/

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    
  auth: {
    user: 'changmeng72@gmail.com',
    pass: '111111Ab'
  },
  tls:{ rejectUnauthorized: false}
});
transporter.verify((err ,res)=>{
  if(err)
  console.error(err);

});

function getIcalObjectInstance(starttime, endtime, summary,  description, location, url , name ,email) {
const cal = ical({ domain: "abc.com", name: 'ABC calendar event' });
cal.domain("abc.com");
cal.createEvent({
        start: starttime,         // eg : moment()
        end: endtime,             // eg : moment(1,'days')
        summary: summary,         // 'Summary of your event'
        description: description, // 'More description'
        location: location,       // 'Delhi'
        url: url,                 // 'event url'
        organizer: {              // 'organizer details'
            name: name,
            email: email
        },
    });
return cal;
}
async function sendemail(sendto, subject, htmlbody, calendarObj = null,attachments=null) {
  mailOptions = {
      to: sendto,
      subject: subject,
      html: htmlbody,
      attachments: attachments
  }
/*if(attachments)
  mailOptions[attachments] = attachments;*/
    
if (calendarObj) {
      let alternatives = {
          "Content-Type": "text/calendar",
          "method": "REQUEST",
          "content": new Buffer(calendarObj.toString()),
          "component": "VEVENT",
          "Content-Class": "urn:content-classes:calendarmessage"
      }
mailOptions['alternatives'] = alternatives;
mailOptions['alternatives']['contentType'] = 'text/calendar'
mailOptions['alternatives']['content'] 
  = new Buffer(calendarObj.toString())
}
transporter.sendMail(mailOptions, function (error, response) {
      if (error) {
          console.log(error);
      } else {
          console.log("Message sent: " , response);
      }
  })
}
//sendemail('liuyu770103@gmail.com','test','<p>hello world!</p>',icalObj);
module.exports = {
  sendemail,getIcalObjectInstance,
};

 