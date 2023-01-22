var sqlite3 = require('sqlite3').verbose();
var express = require('express');
const ejs = require("ejs");
const expressLayouts = require('express-ejs-layouts');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var app = express();
var server = http.createServer(app);
var async = require("async");
const crypto = require('crypto');
const bcrypt = require("bcrypt");

//var home = require('./routes/home');

app.set("view engine", "ejs");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

var db = new sqlite3.Database('./database/eVoting.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the evoting  database.');
});

var dbl = new sqlite3.Database('./database/localised.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the localised  database.');
});

//app.use(expressLayouts);
app.use(bodyParser.urlencoded({extended: false}));
//app.use(express.static(path.join(__dirname,'./public')));
app.use(express.static('public'))
app.use('/pages',express.static(__dirname + 'public/pages'))
app.use('/js',express.static(__dirname + 'public/js'))
app.use('/css',express.static(__dirname + 'public/css'))
app.use(helmet());
app.use(limiter);
//app.use('/home', home);
app.get('/', function(req,res,alert=""){
  //res.sendFile(path.join(__dirname,'./public/pages/adlogin.html'));
  msg=[{msg:""}];
  res.render("adlogin");
});
app.get('/home', function(req,res,alert=""){


  res.render("last");
});



//admin adlogin
app.post('/adminlogin', function(req,ress){
  console.log("\n\tadmin login REQUEST\n");
  msg=[{msg:""}];
    db.get('SELECT COUNT(*) as countf,adminPASS as admpass FROM admin_credentials  WHERE adminID =? ', [req.body.check_adname], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
		const exist =  row.countf;
 		if(exist ==1) {
                  console.log("admin id exists, checking password");
                  const plainTextPassword1 = req.body.check_adPASS;
                  const hash = row.admpass;
                  bcrypt
                    .compare(plainTextPassword1, hash)
                    .then(res => {
                                if(res==true){console.log("correct password ");
                                  ress.render("last");
          			                  console.log("logged to home successfully");
                                            }
                                else if (res==false) {
                                  console.log("incorrect password");
                                  msg[0].msg="incorrect password"; ress.render("adlogin",{msg: msg});
                                }
                                else {
                                  console.log("unexpected error");  msg[0].msg="unexpected error";
                                   ress.render("adlogin",{msg: msg});
                                }
                      console.log(res);
                    })
                    .catch(err =>{ msg[0].msg="error"; ress.render("adlogin",{msg: msg});
                                    console.log("error in bcrypt");callback(new Error('async error '));
                                  console.error(err.message)
                                  });


      						}
    else if (exist !=1) {
                  msg[0].msg="admin id do not exists"; ress.render("adlogin",{msg: msg});
      		        //ress.send("admin id do not exists");
        		      console.log("admin id do not exists");
        		}
    else if (err) {
  				      msg[0].msg="error"; ress.render("adlogin",{msg: msg});
                return console.error(err.message);
      	       }
    else       {  msg[0].msg="unexpected result"; ress.render("adlogin",{msg: msg});
      	           //ress.send("unexpected result");
                   return console.error(err.message);
      	       }

      });

});

app.post('/change_password', function(req,ress){
  console.log("REQUEST CHANGE PASSWORD");
  var hashed_npass="0";
  async.series([
      function bothsame(callback){
        if(req.body.npass==req.body.cfmpass){
              console.log("found as both passwords same ");
              callback();
              }
        else {
          console.log("passwords do not match"); ress.send("passwords do not match");
          callback(new Error('async error '));
              }

      },
      function check_password(callback){
      console.log("checking whther given cur pass is corrrect");
      db.get('select count(*) as counte,adminPASS as adminpass from admin_credentials where adminID=?', [req.body.adID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

          if(err){
              ress.send("admin id  couldnot varify");
               callback(err);
              return console.error(err.message);
            }
            else if (row.counte==1) {
              console.log("admin id  verified. admin pass(hash) obtained from db\t"+row.adminpass+"\n comparing with given current password");
              const plainTextPassword1 = req.body.cpass;
              const hash = row.adminpass;
              bcrypt
                .compare(plainTextPassword1, hash)
                .then(res => {
                            if(res==true){console.log("given current password is correct"); console.log(res);
                                        callback();

                                        }
                            else if (res==false) {
                                                console.log("incorrect current password"); console.log(res);
                                                callback(new Error('async error '));
                                                ress.send("incorrect password");
                                                }
                            else {
                                  console.log("unexpected error"); console.log(res);  ress.send("unexpected error");
                                }

                          })
                .catch(err =>{ ress.send("error "); console.log("error in becrypt");callback(new Error('async error '));
                              console.error(err.message)
                              });

            }
            else if (row.counte==0){
              console.log("incorrect Admin ID"); ress.send("incorrect Admin ID"); callback(new Error('async error '));
            }
            else { console.log(row.counte);
              console.log("unexpected result while admin ID ");
               ress.send("unexpected error"); callback(new Error('async error '));
            }
        });

      },
      function generarting_hash_for_n_pass(callback){
        const saltRounds = 10;
        const plainTextPassword1 =req.body.npass;
        console.log("npass before hash: "+req.body.npass);
        bcrypt
              .hash(plainTextPassword1, saltRounds)
              .then(hash => {
                            console.log(`Hash for n pass : ${hash}`);
                            hashed_npass=hash;
                            console.log("hashed_npass : "+hashed_npass);
                            callback();
                            })
              .catch(err =>{ console.log("errrrrror in becrypt");
                              ress.send("error");
                              callback(new Error('async error ')); console.error(err.message)
                          });


      },
      function update_password(callback){
        console.log("gonna update password");
        db.run('update admin_credentials SET  adminPASS=?', [hashed_npass], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

            if(err){
                ress.send("new admin credentials couldnot update");
                 callback(err);
                return console.error(err.message);
              }
              console.log("new admin credentials updated successfully");  ress.send("updated successfully"); callback();
        });
      }
  ], function(err) {
  if (err) {
  //Handle the error in some way. Here we simply throw it
  //Other options: pass it on to an outer callback, log it etc.
  console.log(" async disturbed in between");
   }
console.log('async for CHANGE PASSWORD form worked');
});
});



//adding new election to db
app.post('/new_election', function(req,res){
 console.log("\n\tNEW ELECTION\n");
 var hashed_pass="0";
 async.series([
  function id_or_name_exists(callback)
  {
    console.log("log :id_or_name_already_exists(callback)");

    db.get('SELECT COUNT(*) as counts  FROM election_directory  WHERE election_id =?  OR election_name=?' , [req.body.e_ID, req.body.e_name], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            res.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }
          var uvdf=row.counts;
          if(uvdf>0){
            console.log(" election id or election_name exists : try another for creating election");
            res.send("try another  election credentials ");
            return callback(new Error('async error says election credentials exists :'));

          }
          else if (uvdf==0) {

            console.log("found as unique election id and election name ");
            callback();
          }
          else  {
            res.send("unexpected result during checking whether election credentials exists");
            console.log("unexpected result during checking whether_ election credentials exists");
            return callback(new Error('async error says unexpected result in whether_ election_credentials exists'));
          }
           });
    },
//check  whether dates are valid using javascript     and refer test12 date check also . and implemnt pop up

    function hashing_pass(callback){
      const saltRounds = 10;
      const plainTextPassword1 =req.body.e_PASS;
      console.log("pass before hash: "+req.body.e_PASS);
      bcrypt
            .hash(plainTextPassword1, saltRounds)
            .then(hash => {
                          console.log(`Hash for pass : ${hash}`);
                          hashed_pass=hash;
                          console.log("hashed_pass : "+hashed_pass);
                          callback();
                          })
            .catch(err =>{ console.log("errrrrror in becrypt");
                            ress.send("error");
                            callback(new Error('async error ')); console.error(err.message)
                        });



    },
    function insertfornewelection(callback)
    { console.log("log :insertfornewelection(callback)");
       db.serialize(()=>{
      db.run('insert into election_directory(election_id,election_pass,election_name,e_date,e_starting_time,e_closing_time,verification_date,mode_of_election) values(?,?,?,?,?,?,?,?)', [req.body.e_ID, hashed_pass, req.body.e_name, req.body.e_date, req.body.e_start_time, req.body.e_close_time, req.body.v_date,req.body.e_mode], function(err,row){
        if(err){
        res.send("error in verification process");
        return console.error(err.message);
        }
      //res.send("new election recorded");
      console.log("new election recorded");
      var e_announcement="Upcoming Election: "+req.body.e_name+" ["+req.body.e_date+"] ";
      if(req.body.e_start_time!="" || req.body.e_close_time!="")
        {e_announcement=e_announcement+"\n Time: from "+req.body.e_start_time+" to "+req.body.e_close_time}
       if(req.body.v_date!="" )
        {e_announcement=e_announcement+" \n Verification Date: "+req.body.v_date}

        var time=new Date().toLocaleTimeString(); // 11:18:48 AM
        //---
        var date=new Date().toLocaleDateString(); // 11/16/2015

        db.run('insert into announcements(date,announcement,time) values(?,?,?)', [date,e_announcement,time], function(err,rowf){
          if(err){
            res.send("error while insering  announcement details ");
            callback(err);
            return console.error(err.message);
          }
          console.log("announcement entered to database");
          console.log("rendering setting phases page");

          let msg='Please enter following details',eid=req.body.e_ID,mmode=req.body.e_mode;
          if (mmode=='area-based') {
            console.log("AREA BASED");
            let areacount=parseInt(req.body.narea);
            let poscount=0;
            res.render("setting_phases",{msg: msg,eid: eid,mmode: mmode,areacount: areacount,poscount: poscount});
            callback();
          }
          else if (mmode=="area-pos-based") {
            console.log("AREA POS BASED");
            let areacount=parseInt(req.body.narea);
            let poscount=parseInt(req.body.npos);
            res.render("setting_phases",{msg: msg,eid: eid,mmode: mmode,areacount: areacount,poscount: poscount});
            callback();
          }
          else if (mmode='pos-only') {
            console.log("POS ONLY");
            let areacount=0;
            let poscount=parseInt(req.body.npos);
            res.render("setting_phases",{msg: msg,eid: eid,mmode: mmode,areacount: areacount,poscount: poscount});
            callback();
          }
          else {
            console.log("unexpected mode selection :error");
            res.send("error"); callback(new Error('async error '));
          }

        });
      });
    });
  }
], function(err) {
if (err) {
  //Handle the error in some way. Here we simply throw it
  //Other options: pass it on to an outer callback, log it etc.
  console.log(" async disturbed in between");
   }
console.log('async for new election form worked');
});
});


//setting_phases of election
app.post('/set_phases', function(req,res){
  console.log("\n\t set phases of elelction\n");
  var crea='NA';
  var ppos='NA';
async.series([
  function readingdata(callback){
  console.log("\t log reading data");
  let mmode=req.body.mmode;

  if(mmode!='pos-only'){
    var arealength=req.body.c_area.length;
    crea='';
    for(var i=0;i<arealength;i++){
      crea+='#';
      crea+=req.body.c_area[i];

    }
  }
if(mmode!='area-based'){
  var poslength=req.body.p_pos.length;
  ppos='';
  for(var i=0;i<poslength;i++){
    ppos+='#';
    ppos+=req.body.p_pos[i];

  }
}

setTimeout(function() {

  callback();
},1000);
},



   function insert_phases(callback){
     console.log("log : insert_phases");

     db.run('insert into election_phases(election_id,competing_area,participating_position) values(?,?,?)', [req.body.eid, crea, ppos], function(err,row){
       if(err){
       ress.send("error in setting  phases");
       return console.error(err.message);

       }
       console.log("added phase of competing for election");
       var msg="Election has created successfully"
       res.render("responsesadm",{msg: msg});
       callback();
     });
   }
 ], function(err) {
 if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
 console.log('async for set phases form worked');
});
 });


//update verification date of election
app.post('/update_verification_date', function(req,ress){
  console.log("\n\t REQUEST UPDATE VERIFICATION DATE \n");
  var ename="0";
  async.series([
    function verify_eid_epass(callback) {

    console.log("log :function verify_eid_epass(callback");
    db.get('SELECT COUNT(*) as counts,election_status as estatus,election_pass as epass,election_name as ename  FROM election_directory  WHERE election_id =?  ' , [req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            ress.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }
          var uvdf=row.counts;
          if(uvdf==1){
            console.log("election id is  correct ");
            const plainTextPassword1 = req.body.e_PASS;
            const hash = row.epass;
            bcrypt
              .compare(plainTextPassword1, hash)
              .then(res => {
                          if(res==true){console.log("given  password is correct"); console.log(res);

                                        if(row.estatus=='expired'){ress.send("election has expired"); console.log("found as electionexpired"); return callback(new Error('async error says election expired')); }
                                        else if(row.estatus=='enabled') {ress.send("Error : Election is going on. ");
                                                                        console.log("found as election enabled  ");
                                                                        callback(new Error('async error '));}
                                        else if((row.estatus=='disabled')){ename=row.ename; callback();}
                                        else {console.log("unexpected error while status check"); ress.send("unexpected error "); callback(new Error('async error '));}


                                      }
                          else if (res==false) {
                                              console.log("incorrect  password"); console.log(res);
                                              callback(new Error('async error '));
                                              ress.send("incorrect password");
                                              }
                          else {
                                console.log("unexpected error"); console.log(res);  ress.send("unexpected error");
                              }

                        })
              .catch(err =>{ ress.send("error "); console.log("error in becrypt");callback(new Error('async error '));
                            console.error(err.message)
                            });

          }
          else if (uvdf==0) {
            ress.send("incorrect credentials. please check election credentials");
            console.log("incorrect election credentials for update_verification_date");
            return callback(new Error('async error says incorrect credentials'));
          }
          else  {
            ress.send("unexpected result during checking election credentials");
            console.log("unexpected result during checking election credentials for  update_verification_date");
            return callback(new Error('async error '));
          }
           });
    },
    function whether_vdate_gthan_edate(callback) {
      console.log("log :checking whther given verification date is less than date today and less than or eq to e_date");
      db.get('SELECT COUNT(*) as counth  FROM election_directory  WHERE e_date>=? AND ?>=date("now")  AND election_id =?  ' , [req.body.v_date,req.body.v_date,req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

          if(err){
              ress.send("election credentials couldnot varify");
               callback(err);
              return console.error(err.message);
            }

          else if (row.counth==1) {
            console.log("valid verifiaction date"); callback();
          }
          else if (row.counth==0) {
            console.log(" verifiaction date not valid"); ress.send("INVALID Verification Date . Date should not pass election date Or not less than date today ");
            callback(new Error('async error '));
          }
          else {
              console.log("unexpected condition");
              ress.send("unexpected error");
              callback(new Error('async error '));
          }
      });
    },
    function update_verification_date(callback){
   console.log("log :function update_verification_date(callback)");

   db.run('UPDATE election_directory SET  verification_date=? WHERE election_id =? ', [req.body.v_date,req.body.e_ID], function(err){
       if(err){
             ress.send("cannot update verification date");
             console.log("verification_date not updated to database. ");
             callback(err);
             return console.error(err.message);
           }

           //ress.send("verification date updated");
           console.log("verification date updated");
           callback();
       });
 },
    function announcement(callback){
      console.log("log announcement");
   var time=new Date().toLocaleTimeString(); // 11:18:48 AM
   //---
   var date=new Date().toLocaleDateString(); // 11/16/2015
   var announcement=ename+" : Verification date updated \nDATE: "+req.body.v_date;
   db.run('insert into announcements(date,announcement,time) values(?,?,?)', [date,announcement,time], function(err,rowf){
     if(err){
       ress.send("error while insering  announcement details ");
       callback(err);
       return console.error(err.message);
     }
     console.log("announcement entered to database");
     ress.send("verification date updated");
     callback();
   });

 }
], function(err) {
if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
console.log('async for update verification_date form worked');
});


});

//update election e_date
app.post('/update_election_date', function(req,ress){
  console.log("handling update_election_date request");
  var ename="0";
  async.series([
 function verify_eid_epass(callback) {

 console.log("log :function verify_eid_epass(callback");
 db.get('SELECT COUNT(*) as counts,election_status as estatus,election_name as ename,election_pass as epass  FROM election_directory  WHERE election_id =?  ' , [req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

     if(err){
         ress.send("election credentials couldnot varify");
          callback(err);
         return console.error(err.message);
       }
       var uvdf=row.counts;
       if(uvdf==1){
         console.log("election id is  correct ");
         const plainTextPassword1 = req.body.e_PASS;
         const hash = row.epass;
         bcrypt
           .compare(plainTextPassword1, hash)
           .then(res => {
                       if(res==true){console.log("given  password is correct"); console.log(res);

                                      if(row.estatus=='expired'){ress.send("election has expired"); console.log("found as electionexpired"); return callback(new Error('async error says election expired')); }
                                      else if(row.estatus=='enabled') {ress.send("Election is going on. ");
                                                          console.log("found as election enabled  ");
                                                          callback(new Error('async error says election expired'));}
                                      else if((row.estatus=='disabled')){ ename=row.ename; callback();}
                                      else {console.log("unexpected error while status check"); ress.send("unexpected error "); callback(new Error('async error says election expired'));}


                                   }
                       else if (res==false) {
                                           console.log("incorrect  password"); console.log(res);
                                           callback(new Error('async error '));
                                           ress.send("incorrect password");
                                           }
                       else {
                             console.log("unexpected error"); console.log(res);  ress.send("unexpected error");
                           }

                     })
           .catch(err =>{ ress.send("error "); console.log("error in becrypt");callback(new Error('async error '));
                         console.error(err.message)
                         });

       }
       else if (uvdf==0) {
         ress.send("incorrect credentials. please check election credentials");
         console.log("incorrect election credentials for update_election_date");
         return callback(new Error('async error says incorrect credentials'));
       }
       else  {
         ress.send("unexpected result during checking election credentials");
         console.log("unexpected result during checking election credentials for  update_election_date");
         return callback(new Error('async error says unexpected result in update_election_date'));
       }
        });
 },

 function update_electiondate(callback){
   console.log("log :function update_electiondate(callback)");
   //ADD FUNCTION WHETHER GIVEN DATE IS LESS THAN DATE NOW
   db.run('UPDATE election_directory SET  e_date=?,e_starting_time=?,e_closing_time=? WHERE election_id =? ', [req.body.e_date,req.body.estime,req.body.ectime,req.body.e_ID], function(err){
       if(err){
             ress.send("cannot update verification date");
             console.log("verification_date not updated to database. ");
             callback(err);
             return console.error(err.message);
           }

           //ress.send("election date updated");
           console.log("election date updated");
           callback();
       });
  },
  function announcement(callback){
    console.log("log announcement");
    var time=new Date().toLocaleTimeString(); // 11:18:48 AM
    //---
    var date=new Date().toLocaleDateString(); // 11/16/2015
    var announcement=ename+" : Election date updated \nDATE: "+req.body.e_date+" FROM "+req.body.estime+" TO "+req.body.ectime;
    db.run('insert into announcements(date,announcement,time) values(?,?,?)', [date,announcement,time], function(err,rowf){
      if(err){
        ress.send("error while insering  announcement details ");
        callback(err);
        return console.error(err.message);
      }
      console.log("announcement entered to database");
      ress.send("election date updated");
      callback();
    });

  }
], function(err) {
if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
console.log('async for update election date form worked');
});


});


//register voter for election
app.post('/register_voter', function(req,ress){
  console.log("\n\tRequest for register_voter\n");
  async.series([
    function date_time_check(callback){
      console.log("cheking date and time");
      db.get('SELECT election_status as estatus,e_date as edate,e_starting_time as estime,e_closing_time as ectime  FROM election_directory  WHERE election_id=?' , [req.body.eid], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

      if(err){
              ress.send("couldnot check whether voter already exists for this election");
               callback(err);
              return console.error(err.message);
            }

      else {
        var edate=row.edate; var estime=row.estime; var ectime=row.ectime; var estatus=row.estatus;

      let curdate=new Date();
      //obtaining current time
      let curhour =curdate.getHours();
      curhour=String(curhour);
      if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
      let curminute=curdate.getMinutes();
      curminute=String(curminute);
      if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
      let curtime=curhour+":"+curminute;
      console.log("current time : "+curtime);
      //obtaing current date
      let curyear=curdate.getFullYear();
      curyear=String(curyear);
      let curmonth=curdate.getMonth();
      curmonth+=1; //we have to add 1 ,to get actual month value
      curmonth=String(curmonth);
      if(curmonth.length==1){let temp=curmonth; curmonth='0'; curmonth+=temp;}
      let curday=curdate.getDate();
      curday=String(curday);
      if(curday.length==1){curday='0'; curday+=curdate.getDate();}
      curdate=curyear+"-"+curmonth+'-'+curday;
      console.log("curdate "+curdate);
      curdate=new Date(curdate);
      console.log('current date : '+curdate);

      // obtaining election date
      edate=new Date(edate);
      console.log("election date : "+edate);

      //checking whether current date and times are valid for election_name
      if(curdate.getTime()==edate.getTime()){
        console.log("found as election date ");
        if(curtime>=estime ){
          console.log("found as registration time closed.");
          ress.send("Registrations Closed.");
           callback(new Error('error'));
        }
        else if(curtime<estime){
                console.log("election time not reached ");
                 callback();
              }

              else {
                console.log("unexpected error : time ");
                ress.send("Error occured ");
                callback(new Error('error'));
              }

      }
      else { console.log("found as not election date");

            if(curdate.getTime()<edate.getTime()){
              console.log("election date not reached");

              callback();
            }
            else if (curdate.getTime()>edate.getTime()) {
              console.log("Election date surpassed");
              ress.send("Election has expired ");
              callback(new Error('error'));
            }
            else {
              console.log("unexpected error: unexpected estatus and date");
              ress.send("Error occured ");
               callback(new Error('error'));
            }
        }
      }
      });
    },
    function already_exists(callback){
      console.log("log :function already_exists(callback): register voter");
      db.get('SELECT COUNT(*) as counts  FROM voter_slist  WHERE v_ID =?  AND election_id=?' , [req.body.vid,req.body.eid], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

          if(err){
              ress.send("couldnot check whether voter already exists for this election");
               callback(err);
              return console.error(err.message);
            }
            var uvdf=row.counts;
            if(uvdf==1){
              console.log(" voter already exists for this election");
              ress.send("voter already exists for this election");
                return callback(new Error('async error says candidate already exists for this election'));
            }
            else if (uvdf==0) {

              console.log("found as no same voter  already existing");
              callback();
            }
            else  {
              ress.send("unexpected result during checking whether voter already exists for this election");
              console.log("unexpected result during checking ewhether voter already exists for this election");
              return callback(new Error('async error says unexpected result in checking whether voter already exists '));
            }
             });

    },

    function register_voter(callback) {
   console.log("log : register_voter");
   let inputarea='NA'; let regareas=[];
   let mmode=req.body.mmode;
   if (mmode=='area-based' || mmode=='area-pos-based') {
      inputarea=req.body.ccarrea;
     let areas=req.body.regareas;
       regareas = areas.split(",");
       }

   db.run('insert into voter_slist(v_ID,election_id,v_Name,D_o_B,v_Mail,v_Area) values(?,?,?,?,?,?)', [req.body.vid, req.body.eid, req.body.vname, req.body.dob, req.body.vmail, inputarea], function(err,row){
     if(err){
                ress.send("error in voter registration process");
                return console.error(err.message);

              }
              let eid=req.body.eid;
              let msg='Voter added : '+req.body.vname;

              ress.render("votereg",{mmode: mmode,eid: eid,msg: msg,regareas: regareas});
              console.log("new voter recorded");
              callback();


              });





 }
 ], function(err) {
if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
console.log('async for update verification_date form worked');
});
});



//go to candidate_registration
app.post('/Registrations', function(req,ress){
  var edate=''; var estime=''; var ectime='';
  console.log("\n\t request Registrations \n");
  var mmode="";
  async.series([
    function verify_eid_epass(callback) {

    console.log("log :function verify_eid_epass(callback: add_candidate");
    db.get('SELECT COUNT(*) as counts,election_status as estatus,e_date as edate,e_starting_time as estime,e_closing_time as ectime,election_pass as epass,mode_of_election as emode  FROM election_directory  WHERE election_id =? ' , [req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            ress.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }

          else if(row.counts==1){
            console.log("election id is correct ");

            const plainTextPassword1 = req.body.e_PASS;
            const hash = row.epass;
            bcrypt
              .compare(plainTextPassword1, hash)
              .then(res => {
                          if(res==true){console.log("given  password is correct"); console.log(res);

                          if(row.estatus=='expired'){ress.send("election has expired"); console.log("found as electionexpired"); return callback(new Error('async error says election expired')); }
                          else if(row.estatus=='enabled'){ress.send(" Registrations has closed"); console.log("registration closed"); return callback(new Error('closed')); }
                          else if(row.estatus=='disabled'){mmode=row.emode; edate=row.edate; estime=row.estime; ectime=row.ectime;
                                                            callback();
                                                          }
                          else {ress.send(" Error Occured"); console.log("unexpected error"); return callback(new Error('error'));}


                                      }
                          else if (res==false) {
                                              console.log("incorrect  password"); console.log(res);
                                              callback(new Error('async error '));
                                              ress.send("incorrect password");
                                              }
                          else {
                                console.log("unexpected error"); console.log(res);  ress.send("unexpected error");
                              }

                        })
              .catch(err =>{ ress.send("error "); console.log("error in becrypt");callback(new Error('async error '));
                            console.error(err.message);
                            });


          }
          else if (row.counts==0) {
            ress.send("incorrect credentials. please check election credentials");
            console.log("incorrect election id");
            return callback(new Error('async error says incorrect credentials'));
          }
          else  {
            ress.send("unexpected result during checking election credentials");
            console.log("unexpected result during checking election credentials for  registration");
            return callback(new Error('async error says unexpected result in  registration'));
          }
           });
    },
    function date_time_check(callback){
      console.log("cheking date and time");
      let curdate=new Date();
      //obtaining current time
      let curhour =curdate.getHours();
      curhour=String(curhour);
      if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
      let curminute=curdate.getMinutes();
      curminute=String(curminute);
      if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
      let curtime=curhour+":"+curminute;
      console.log("current time : "+curtime);
      //obtaing current date
      let curyear=curdate.getFullYear();
      curyear=String(curyear);
      let curmonth=curdate.getMonth();
      curmonth+=1; //we have to add 1 ,to get actual month value
      curmonth=String(curmonth);
      if(curmonth.length==1){let temp=curmonth; curmonth='0'; curmonth+=temp;}
      let curday=curdate.getDate();
      curday=String(curday);
      if(curday.length==1){curday='0'; curday+=curdate.getDate();}
      curdate=curyear+"-"+curmonth+'-'+curday;
      console.log("curdate "+curdate);
      curdate=new Date(curdate);
      console.log('current date : '+curdate);

      // obtaining election date
      edate=new Date(edate);
      console.log("election date : "+edate);

      //checking whether current date and times are valid for election_name
      if(curdate.getTime()==edate.getTime()){
        console.log("found as election date ");
        if(curtime>=estime ){
          console.log("found as registration closed.");
          ress.send("Registrations Closed.");
           callback(new Error('error'));
        }
        else if(curtime<estime){
                console.log("election time not reached ");
                 callback();
              }

              else {
                console.log("unexpected error : time ");
                ress.send("Error occured ");
                callback(new Error('error'));
              }

      }
      else { console.log("found as not election date");

            if(curdate.getTime()<edate.getTime()){
              console.log("election date not reached");

              callback();
            }
            else if (curdate.getTime()>edate.getTime()) {
              console.log("Election date surpassed");
              ress.send("Election has expired ");
              callback(new Error('error'));
            }
            else {
              console.log("unexpected error: unexpected estatus and date");
              ress.send("Error occured ");
               callback(new Error('error'));
            }
        }

    },
    function render_registration(callback){

      console.log("\tlog render_registration");



      db.get('SELECT competing_area as cr, participating_position as pp  FROM election_phases  WHERE  election_id=?' , [ req.body.e_ID], function(err,rowb){     //db.each() is only one which is funtioning while reading data from the DB
        if(err){
              ress.send("Error occured");
               callback(err);
              return console.error(err.message);
            }
            let eid=req.body.e_ID;
            let msg='';
            var regareas=[];
            var regposs=[];
            if(mmode!='pos-only'){
                                      let crr=rowb.cr;
                                      regareas = crr.split("#");
                                    }
            if(mmode!='area-based'){
                                        let ppp=rowb.pp;
                                        regposs = ppp.split("#");
                                      }
            setTimeout(function() {
                                    console.log("areas, pos "+regareas+" \n"+regposs);
                                    if (req.body.regtype=='candidate') {
                                      ress.render("candireg",{mmode: mmode,eid: eid,msg: msg,regareas: regareas,regposs: regposs});
                                    }
                                    else if (req.body.regtype=='voter') {
                                      ress.render("votereg",{mmode: mmode,eid: eid,msg: msg,regareas: regareas});
                                    }
                                    else {
                                      ress.send(" Error Occured"); console.log("unexpected error"); return callback(new Error('error'));
                                    }

                                      },2000);


      });
    }

  ], function(err) {
  if (err) {
     //Handle the error in some way. Here we simply throw it
     //Other options: pass it on to an outer callback, log it etc.
     console.log(" async disturbed in between");
      }
  console.log('async to go to candidate_registration page  worked');
  });


  });
//add candidate for election
app.post('/add_candidate', function(req,ress){
  console.log("request for add_candidate");
  let mmode=req.body.mmode; let inputarea=''; let inputpos=''; let regposs=[]; let regareas=[];
  async.series([
    function date_time_check(callback){
      console.log("cheking date and time");
      db.get('SELECT election_status as estatus,e_date as edate,e_starting_time as estime,e_closing_time as ectime  FROM election_directory  WHERE election_id=?' , [req.body.eid], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

      if(err){
              ress.send("couldnot check whether voter already exists for this election");
               callback(err);
              return console.error(err.message);
            }

      else {
        var edate=row.edate; var estime=row.estime; var ectime=row.ectime; var estatus=row.estatus;

      let curdate=new Date();
      //obtaining current time
      let curhour =curdate.getHours();
      curhour=String(curhour);
      if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
      let curminute=curdate.getMinutes();
      curminute=String(curminute);
      if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
      let curtime=curhour+":"+curminute;
      console.log("current time : "+curtime);
      //obtaing current date
      let curyear=curdate.getFullYear();
      curyear=String(curyear);
      let curmonth=curdate.getMonth();
      curmonth+=1; //we have to add 1 ,to get actual month value
      curmonth=String(curmonth);
      if(curmonth.length==1){let temp=curmonth; curmonth='0'; curmonth+=temp;}
      let curday=curdate.getDate();
      curday=String(curday);
      if(curday.length==1){curday='0'; curday+=curdate.getDate();}
      curdate=curyear+"-"+curmonth+'-'+curday;
      console.log("curdate "+curdate);
      curdate=new Date(curdate);
      console.log('current date : '+curdate);

      // obtaining election date
      edate=new Date(edate);
      console.log("election date : "+edate);

      //checking whether current date and times are valid for election_name
      if(curdate.getTime()==edate.getTime()){
        console.log("found as election date ");
        if(curtime>=estime ){
          console.log("found as registration time closed.");
          ress.send("Registrations Closed.");
           callback(new Error('error'));
        }
        else if(curtime<estime){
                console.log("election time not reached ");
                 callback();
              }

              else {
                console.log("unexpected error : time ");
                ress.send("Error occured ");
                callback(new Error('error'));
              }

      }
      else { console.log("found as not election date");

            if(curdate.getTime()<edate.getTime()){
              console.log("election date not reached");

              callback();
            }
            else if (curdate.getTime()>edate.getTime()) {
              console.log("Election date surpassed");
              ress.send("Election has expired ");
              callback(new Error('error'));
            }
            else {
              console.log("unexpected error: unexpected estatus and date");
              ress.send("Error occured ");
               callback(new Error('error'));
            }
        }
      }
      });
    },
    function already_exists(callback){
      console.log("log :function already_exists(callback): add_candidate");
      db.get('SELECT COUNT(*) as counts  FROM candidate_directory  WHERE  candidate_name =? AND election_id=?' , [ req.body.cname,req.body.eid], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

          if(err){
              ress.send("couldnot check whether candidate already exists for this election");
               callback(err);
              return console.error(err.message);
            }
            var uvdf=row.counts;
            if(uvdf==1){
              console.log(" candidate already exists for this election");
              ress.send("candidate already exists for this election");
                return callback(new Error('async error says candidate already exists for this election'));
            }
            else if (uvdf==0) {

              console.log("found as no same candidate  already existing");
              callback();
            }
            else  {
              ress.send("unexpected result during checking whether candidate already exists for this election");
              console.log("unexpected result during checking ewhether candidate already exists for this election");
              return callback(new Error('async error says unexpected result in checking whether candidate already exists '));
            }
             });

    },
    function check_mode(callback) {
      console.log("\tlogfunction check_mode");

                if (mmode=='area-based') {
                  inputpos='NA'; inputarea=req.body.ccarrea;
                  let areas=req.body.regareas;
                    regareas = areas.split(",");
                        callback();
                    }
                else if (mmode=='area-pos-based') {
                  inputpos=req.body.ccpposs; inputarea=req.body.ccarrea;
                  let poss=req.body.regposs;
                   regposs = poss.split(",");
                  let areas=req.body.regareas;
                    regareas = areas.split(",");
                   callback();
                }
                else if (mmode=='pos-only') {
                  inputpos=req.body.ccpposs; inputarea='NA';
                  let poss=req.body.regposs;
                   regposs = poss.split(",");
                  callback();
                }
                else {
                  return callback(new Error('async error '));
                  console.log("error in add candidate");
                  res.send("Error occured");
                }





 },
    function add_candidate(callback){
          console.log("\tlog add candidate function");

            db.run('insert into candidate_directory values(?,?,?,?,?,?)', [req.body.cid, req.body.eid, req.body.cname, req.body.p_rep, inputpos,inputarea], function(err,row){
                if(err){
                          ress.send("error in candidate registration process");
                          return console.error(err.message);

                        }
                                  //ress.send("candidate added id : "+req.body.cid+" name : "+req.body.cname);
                          let eid=req.body.eid;
                          let msg='Candidate added : '+req.body.cname;

                          ress.render("candireg",{mmode: mmode,eid: eid,msg: msg,regareas: regareas,regposs: regposs});
                          console.log("candidate added");
                          callback();
            });
        }


], function(err) {
if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
console.log('async for update add_candidate form worked');
});


});


app.post('/enable_election', function(req,ress){
console.log("\n\t request enable_election");
 var ename="0";
 var edate=''; var estime=''; var ectime=''; var estatus='';
// election_credentialsc check
//time date check

//update  Encryption password to password directory database
//update election status of election_directory as enabled - check whether already enabled
//update election_status of voter_slist as enabled
//update encryption password to db
//create a table for eid and insert all values for encrypted candiadte names with count as anotherfield

  async.series([
  //check election election_credentials
      function verify_eid_epass(callback) {

  console.log("log :function verify_eid_epass(callback: enable election");
  db.get('SELECT COUNT(*) as counts,election_status as estatus,election_pass as epass,election_name as ename,e_date as edate,e_starting_time as estime,e_closing_time as ectime  FROM election_directory  WHERE election_id =?  ' , [req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
    if(err){
           ress.send("election credentials couldnot varify");
           callback(err);
          return console.error(err.message);
        }
     else{
        var uvdf=row.counts;
        if(uvdf==1){
          console.log("election id is correct ");
          const plainTextPassword1 = req.body.e_PASS;
          const hash = row.epass;
          bcrypt
            .compare(plainTextPassword1, hash)
            .then(res => {
                        if(res==true){
                                        console.log("given  password is correct"); console.log(res);
                                        estatus=row.estatus; edate=row.edate; estime=row.estime; ectime=row.ectime; ename=row.ename;
                                        callback();

                                    }
                        else if (res==false) {
                                            console.log("incorrect  password"); console.log(res);
                                            ress.send("incorrect password");
                                            callback(new Error('async error '));

                                            }
                        else {
                              console.log("unexpected error"); console.log(res);  ress.send("unexpected error"); callback(new Error('async error '));
                            }

                      })
            .catch(err =>{ ress.send("error "); console.log("error in becrypt");
                          console.error(err.message); callback(new Error('async error '));
                          });


        }
        else if (uvdf==0) {
          ress.send("incorrect credentials. please check election credentials");
          console.log("incorrect election credentials for enable election");
          return callback(new Error('async error says incorrect credentials'));
        }
        else  {
          ress.send("unexpected result during checking election credentials");
          console.log("unexpected result during checking election credentials for  enable election");
          return callback(new Error('async error says unexpected result in enable election'));
        }
      }
         });
  },
 //time date check
      function time_and_date_check(callback){
        console.log("time and date check function");
        let curdate=new Date();
        //obtaining current time
        let curhour =curdate.getHours();
        curhour=String(curhour);
        if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
        let curminute=curdate.getMinutes();
        curminute=String(curminute);
        if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
        let curtime=curhour+":"+curminute;
        console.log("current time : "+curtime);
        //obtaing current date
        let curyear=curdate.getFullYear();
        curyear=String(curyear);
        let curmonth=curdate.getMonth();
        curmonth+=1; //we have to add 1 ,to get actual month value
        curmonth=String(curmonth);
        if(curmonth.length==1){let temp=curmonth; curmonth='0'; curmonth+=temp;}
        let curday=curdate.getDate();
        curday=String(curday);
        if(curday.length==1){curday='0'; curday+=curdate.getDate();}
        curdate=curyear+"-"+curmonth+'-'+curday;
        console.log("curdate "+curdate);
        curdate=new Date(curdate);
        console.log('current date : '+curdate);

        // obtaining election date
        edate=new Date(edate);
        console.log("election date : "+edate);

        //checking whether current date and times are valid for election_name
        if(curdate.getTime()==edate.getTime()){
          console.log("found as election date ");
          if(curtime>=estime && curtime<ectime){
            console.log("found as ON election time");
            if(estatus=='enabled'){
              console.log("found as election enabled");
              ress.send("election has already enabled");
              callback(new Error('async error '));
            }
            // for security
            else if(estatus=='expired'){
                console.log("found as election expired ");
                ress.send("election has expired");
                callback(new Error('async error '));
              }
              else if(estatus=='disabled'){
                  console.log("election status: disabled ");
                  callback()
                }
            else {
              console.log("unexpected error ");
              ress.send("unexpected error");
              callback(new Error('async error '));
            }
          }
          else {
                if(curtime<estime){
                  console.log("election time yet to come ");
                  ress.send("Election time has not reached. Election time : "+estime+" to "+ectime);
                   callback(new Error('error'));
                }
                else if (curtime>=ectime) {
                  console.log("Election time surpassed");
                  ress.send("Election has expired ");
                  callback(new Error('error'));
                }
                else {
                  console.log("unexpected error : time ");
                  ress.send("Error occured ");
                  callback(new Error('error'));
                }
          }
        }
        else { console.log("found as not election date");
          if(estatus=='expired'){
                                  console.log("election has expired");
                                  ress.send("election has expired ");
                                  callback(new Error('error'));
                                }
          else  {
              if(curdate.getTime()<edate.getTime()){
                console.log("election date yet to come");
                ress.send("Not Election date. Election "+ename+" is on "+edate+" between times "+estime+" and "+ectime);
                callback(new Error('error'));
              }
              else if (curdate.getTime()>edate.getTime()) {
                console.log("Election date surpassed");
                ress.send("Election has expired ");
                callback(new Error('error'));
              }
              else {
                console.log("unexpected error: unexpected estatus and date");
                ress.send("Error occured ");
                 callback(new Error('error'));
              }
          }
        }
      },


 //update election status of election_directory as enabled
 //update election_status of voter_slist a enabled
      function estatus(callback)
      { console.log("status update function to update statud in election_directory and voter_slist");
      db.run('update election_directory set election_status="enabled" where election_id=?', [req.body.e_ID], function(err,rows){
        if(err){
        ress.send("error while updating election status of election directorys");
        callback(err);
        return console.error(err.message);
        }
        console.log("updated election status of election directorys");
        db.run('update voter_slist set voting_status="enabled" where election_id=?', [req.body.e_ID], function(err,rows){
          if(err){
          ress.send("error while updating election status of election directorys");
          callback(err);
          return console.error(err.message);
          }
          console.log("updated voting status of election directorys");
          callback();
        });
      });
    },
      //update passsword of Encryption
      function inserting_encryption_pass(callback)
      { console.log(" function inserting_encryption_pass ");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = 'bncaskdbvasbvlaslslasfhj';

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

      let cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted= cipher.update(req.body.enc_pass, 'utf-8','hex');
      encrypted += cipher.final('hex');

      console.log("encrypted encryption pass "+encrypted);

      dbl.get('select count(*) as encount from evoting  where electionid=?', [req.body.e_ID], function(err,rows){
        if(err){
        ress.send("error while updating election status of election directorys");
        callback(err);
        return console.error(err.message);
        }
        else {

               if(rows.encount==1)
                {
                  ress.send("Error Occured");
                  console.log("Error: election id already_exists in dbl");
                  callback(new Error('error'));
                }
                else if(rows.encount==0)
                {
                  console.log("updating encryption PASSWORD");
                  dbl.run('insert into evoting values(?,?) ', [req.body.e_ID,encrypted], function(err,rows){
                    if(err){
                    ress.send("error while updating election status of election directorys");
                    callback(err);
                    return console.error(err.message);
                  }
                  else {
                        console.log("updated encryption password successfully");
                        //clearing clist elist array for inputs
                        if(clist.length>1){
                                      for(var j=clist.length;j>1;j--) {console.log("clearing so poping clist array for new input"); clist.pop(); }
                                    }
                        if(elist.length>1){
                                      for(var j=elist.length;j>1;j--) {console.log("clearing so poping elist array for new input"); elist.pop();}
                                    }
                                    callback();
                        }
                        //callback();
                      });
        }
        else {console.log("unexpected error while updating encryption password");  callback(new Error('unexpected result in election_status check')); ress.send("error");}
      }
      });
    },

      function candidatesarray(callback)
      {
      console.log("function candidates array");

        db.each('select candidate_name as cname from candidate_directory  where election_id=?', [req.body.e_ID], function(err,rowc){
          if(err){
          ress.send("error while getting candidate name of eid for encrypting");
          callback(err);
          return console.error(err.message);
          }
          clist.push({ name: rowc.cname});
          console.log("pushing candidates into clist array");

        });
        setTimeout(function() {
        callback();
        }, 2000);

    },
      //encrypting candidate names of electionid
      function encrypting_candiadetes(callback){

        console.log("function encrypting_candiadetes");

            console.log("array clist");
            console.log(clist);




            const algorithm = 'aes-192-cbc';

            // Defining password
            const password = req.body.enc_pass;

            // Defining key
            const key = crypto.scryptSync(password, 'GfG', 24);

            // Defininf iv
            const iv = Buffer.alloc(16, 0);


            // Creating cipher
            for(var i=1;i<clist.length;i++){
            let cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted= cipher.update(clist[i].name, 'utf-8','hex');
            encrypted += cipher.final('hex');
            elist.push({ etdname: encrypted});
            console.log('encrypted: '+encrypted);
            }
            console.log(clist);
            console.log(elist);


          setTimeout(function() {
          callback();
        },2000);

      },
      function inserting_ecrptd_cnames_to_vote_counts(callback)
      {
        console.log("function : inserting_ecrptd_cnames_to_vote_counts");

         console.log(" inserting_ecrptd_cnames_to_vote_counts");
              for(var i=1;i<elist.length;i++)
              {
            db.run('insert into votingcounts(election_id,cname) values(?,?)', [req.body.e_ID,elist[i].etdname], function(err,rows){
              if(err){
              ress.send("error while inserting erptd cnames to db");
              callback(err);
              return console.error(err.message);
              }
              console.log("added one candidate to db");

            });
          }
          setTimeout(function() {
              console.log("election enabling done");
            //ress.send("election has enabled");
            callback();
          },elist.length*500);


      },
      function announcement(callback){
        console.log("log announcement");
        var time=new Date().toLocaleTimeString(); // 11:18:48 AM
        //---
        var date=new Date().toLocaleDateString(); // 11/16/2015
        var announcement=ename+" : Election has started  ";
        db.run('insert into announcements(date,announcement,time) values(?,?,?)', [date,announcement,time], function(err,rowf){
          if(err){
            ress.send("error while insering  announcement details ");
            callback(err);
            return console.error(err.message);
          }
          console.log("announcement entered to database");
          ress.send("election has enabled");
          callback();
        });

      }



  ], function(err) {
  if (err) {
     //Handle the error in some way. Here we simply throw it
     //Other options: pass it on to an outer callback, log it etc.
     console.log(" async disturbed in between");
      }
  console.log('async for enable election date form worked');
  });


  clist = [
    { name: ""}
  ];
  elist = [
    { etdname: ""}
  ];

});
app.post('/disable_election', function(req,ress){
console.log("\n\t Request disable_election\n");
  var ename="0";//for announcement
  var estatus=''; var ectime=''; var edate=''; var estime='';
async.series([
//check election election_credentials
  function verify_eid_epass(callback) {

console.log("log :function verify_eid_epass(callback: enable election");
db.get('SELECT COUNT(*) as counts,election_status as estatus,election_pass as epass,election_name as ename,e_date as edate,e_starting_time as estime,e_closing_time as ectime  FROM election_directory  WHERE election_id =?  ' , [req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

    if(err){
        ress.send("election credentials couldnot varify");
         callback(err);
        return console.error(err.message);
      }
      var uvdf=row.counts;
      if(uvdf==1){
        console.log("election id is  correct ");
        const plainTextPassword1 = req.body.e_PASS;
        const hash = row.epass;
        bcrypt
          .compare(plainTextPassword1, hash)
          .then(res => {
                      if(res==true){console.log("given  password is correct"); console.log(res);

                                     ename=row.ename;
                                     edate=row.edate; estime=row.estime; ectime=row.ectime; estatus=row.estatus;
                                     callback();

                                  }
                      else if (res==false) {
                                          console.log("incorrect  password"); console.log(res);
                                          callback(new Error('async error '));
                                          ress.send("incorrect password");
                                          }
                      else {
                            console.log("unexpected error"); console.log(res);  ress.send("unexpected error");
                          }

                    })
          .catch(err =>{ ress.send("error "); console.log("error in becrypt");callback(new Error('async error '));
                        console.error(err.message)
                        });


      }
      else if (uvdf==0) {
        ress.send("incorrect credentials. please check election credentials");
        console.log("incorrect election credentials for enable election");
        return callback(new Error('async error says incorrect credentials'));
      }
      else  {
        ress.send("unexpected result during checking election credentials");
        console.log("unexpected result during checking election credentials for  enable election");
        return callback(new Error('async error says unexpected result in enable election'));
      }
       });
    },
  function verifying_encryption_pass(callback){
    console.log("log :function verify_encryption pass: disable election");
    const algorithm = 'aes-192-cbc';

    // Defining password
    const password = 'bncaskdbvasbvlaslslasfhj';

    // Defining key
    const key = crypto.scryptSync(password, 'GfG', 24);

    // Defininf iv
    const iv = Buffer.alloc(16, 0);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted= cipher.update(req.body.enc_pass, 'utf-8','hex');
    encrypted += cipher.final('hex');

    console.log("encrypted inputed enc pass "+encrypted);

    dbl.get('SELECT COUNT(*) as countd  FROM evoting  WHERE electionid =? AND password=? ' , [req.body.e_ID,encrypted], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            ress.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }
        else if (row.countd==1) {
          console.log("Encryption password verified"); callback();
        }
        else if (row.countd==0) {
          console.log("incorrect encryption password");
          ress.send("incorrect encryption password");
          callback(new Error('async error'));
        }
        else {
          console.log("unexpected out while verifying encryption password");
          ress.send("unexpected error while verifying encryption password");
          callback(new Error('async error'));
        }
    });

  },
  function time_date_status_check_and_upadte(callback){
    console.log("time_date_status_check_and_upadte function")
    let curdate=new Date();
    //obtaining current time
    let curhour =curdate.getHours();
    curhour=String(curhour);
    if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
    let curminute=curdate.getMinutes();
    curminute=String(curminute);
    if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
    let curtime=curhour+":"+curminute;
    console.log("current time : "+curtime);
    //obtaing current date
    let curyear=curdate.getFullYear();
    curyear=String(curyear);
    let curmonth=curdate.getMonth();
    curmonth+=1; //we have to add 1 ,to get actual month value
    curmonth=String(curmonth);
    if(curmonth.length==1){let temp=curmonth; curmonth='0'; curmonth+=temp;}
    let curday=curdate.getDate();
    curday=String(curday);
    if(curday.length==1){curday='0'; curday+=curdate.getDate();}
    curdate=curyear+"-"+curmonth+'-'+curday;
    console.log("curdate "+curdate);
    curdate=new Date(curdate);
    console.log('current date : '+curdate);

    // obtaining election date
    edate=new Date(edate);
    console.log("election date : "+edate);

    //checking whether current date and times are valid for election_name
    if(curdate.getTime()==edate.getTime()){
      console.log("found as election date ");
      if(curtime>=ectime){
        console.log("found as election time ended");
        if(estatus=='disabled'){
          console.log("found as election already disabled");
          ress.send("election  already disabled state.Not enabled yet");
          callback(new Error('async error '));
        }
        // for security
        else if(estatus=='expired'){
            console.log("found as election expired ");
            ress.send("election has expired");
            callback(new Error('async error '));
          }
          else if(estatus=='enabled'){
              console.log("election status found as : enabled ");
              callback()
            }
        else {
          console.log("unexpected error :unexpected status");
          ress.send("unexpected error");
          callback(new Error('async error '));
        }
      }
      else {
            if(curtime<ectime){
              console.log("Election has not finished yet ");
              ress.send("Election has not finished yet. Election time : "+estime+" to "+ectime);
               callback(new Error('error'));
            }

            else {
              console.log("unexpected error : time ");
              ress.send("Error occured ");
              callback(new Error('error'));
            }
      }
    }
    else { console.log("found as not election date");
      if(estatus=='expired'){
                              console.log("election has expired");
                              ress.send("election has expired ");
                              callback(new Error('error'));
                            }
      else  {
          if(curdate.getTime()>edate.getTime()){
            console.log("current date greater than election date");

            callback();
          }
          else if (curdate.getTime()<edate.getTime()) {
            console.log("Current date less than Election date ");
            ress.send("Election Date Yet To Come : "+edate);
            callback(new Error('error'));
          }
          else {
            console.log("unexpected error: unexpected estatus and date");
            ress.send("Error occured ");
             callback(new Error('error'));
          }
      }
    }
  },
  function upadate_election_status(callback){
               console.log("\t log upadate_election_status ");


                    console.log("updating status as expired");
                    db.run('update election_directory SET election_status="expired" where election_id=? ', [req.body.e_ID], function(err,rows){
                      if(err){
                      ress.send("error while updating election status");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated elelction status as expired .so you can obtain result now");
                      //ress.send("updated election status as expired .You can obtain result now");
                      callback();
                    });


    },
  function announcement(callback){
      console.log("log announcement");
      var time=new Date().toLocaleTimeString(); // 11:18:48 AM
      //---
      var date=new Date().toLocaleDateString(); // 11/16/2015
      var announcement=ename+" : Election expired ";
      db.run('insert into announcements(date,announcement,time) values(?,?,?)', [date,announcement,time], function(err,rowf){
        if(err){
          ress.send("error while inserting  announcement details ");
          callback(err);
          return console.error(err.message);
        }
        console.log("announcement entered to database");
        ress.send("updated election status as expired .You can obtain result now");
        callback();
      });

    }


  ], function(err) {
  if (err) {
     //Handle the error in some way. Here we simply throw it
     //Other options: pass it on to an outer callback, log it etc.
     console.log(" async disturbed in between");
      }
  console.log('async for enable election date form worked');
  });


});


//obtain_result
app.post('/obtain_result', function(req,ress){
//check whther election credentials are correct and verifying election status
//election expired status comes after election finishes
// if expired obtain Result
//obtain encryption pass
console.log("/n\t REQUEST OBTAIN RESULT\n");
var result_html;
async.series([

  //check election election_credentials
  function verify_eid_epass(callback) {

  console.log("log :function verify_eid_epass");
  db.get('SELECT COUNT(*) as counts,election_status as e_status,election_pass as epass,election_name as ename  FROM election_directory  WHERE election_id =?  ' , [req.body.e_ID], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

      if(err){
          ress.send("election credentials couldnot varify");
           callback(err);
          return console.error(err.message);
        }
        var uvdf=row.counts;
        if(uvdf==1){
          console.log("election id is  correct ");
          const plainTextPassword1 = req.body.e_PASS;
          const hash = row.epass;
          bcrypt
            .compare(plainTextPassword1, hash)
            .then(res => {
                        if(res==true){console.log("given  password is correct"); console.log(res);
                                      if(row.e_status=='enabled') {ress.send("election seem to be not finished "); callback(new Error('election has not expired for obtaining result-found as enabled'));}
                                      else if(row.e_status=='expired') { console.log("election has expired so verifying encryption pass");  callback();}
                                      else if(row.e_status=='disabled') {ress.send("election seem to be not expired "); console.log("election has not expired for obtaining result-found as disabled"); callback(new Error('election has not expired for obtaining result'));}
                                      else {res.send("unexpected result "); ress.send("error "); console.log("unexpected result in obtaining status for obtaining result");callback(new Error('unexpected result in obtaining result'));}

                                    }
                        else if (res==false) {
                                            console.log("incorrect  password"); console.log(res);
                                            callback(new Error('async error '));
                                            ress.send("incorrect password");
                                            }
                        else {
                              console.log("unexpected error"); console.log(res);  ress.send("unexpected error");
                            }

                      })
            .catch(err =>{ ress.send("error "); console.log("error in becrypt");callback(new Error('async error '));
                          console.error(err.message)
                          });

        }
        else if (uvdf==0) {
          ress.send("incorrect credentials. please check election credentials");
          console.log("incorrect election credentials for obtain_result");
          return callback(new Error('async error says incorrect credentials'));
        }
        else  {
          ress.send("unexpected result during checking election credentials");
          console.log("unexpected result during checking election credentials for  obtain_result");
          return callback(new Error('async error says unexpected result in obtain_result'));
        }
         });
  },
  function verifying_encryption_pass(callback){
    console.log("checking whether encryption pass entered is right ");

    const algorithm = 'aes-192-cbc';

    // Defining password
    const password = 'bncaskdbvasbvlaslslasfhj';

    // Defining key
    const key = crypto.scryptSync(password, 'GfG', 24);

    // Defininf iv
    const iv = Buffer.alloc(16, 0);

    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted= cipher.update(req.body.enc_pass, 'utf-8','hex');
    encrypted += cipher.final('hex');

    console.log("encrypted inputed enc pass "+encrypted);

    dbl.get('select count(*) as count from evoting where electionid=? and password=?', [req.body.e_ID,encrypted], function(err,rows){
      if(err){
      ress.send("error while verifying encrytion password");
      callback(err);
      return console.error(err.message);
      }
      else {
        if(rows.count==0){console.log("incorrect encryption password");
          ress.send("incorrect encryption password");
          callback(new Error('incorrect encryption password'));}

        else if(rows.count==1) {console.log("encryption pass varified");
                            if(vcounts.length>1){
                              for(var j=vcounts.length;j>1;j--) {console.log("clearing so poping clist array for new input"); vcounts.pop(); }
                              callback();     }
                            else {callback();}
                            }
        else {console.log("unexpected error while verifying encryption pass"); ress.send("couldnot verify encryption password");
              callback(new Error('unexpected error while verifying encryption pass'));}
      }

    });
  },
  function whether_already_obtained_result(callback){
    console.log("function whether_already_obtained_result??");
    db.get('select count(*) as counti from published_results where election_id=?', [req.body.e_ID], function(err,rows){
      if(err){
      ress.send("error while checking whether_already_obtained_result");
      callback(err);
      return console.error(err.message);
      }
      else {
              if(rows.counti>0) { console.log("result already obtained for same election_id");
                                  ress.send("results already in result page. Please check");
                                  callback(new Error('already obtained result'));
                                }
             else if(rows.counti==0) {
               console.log("not already obtained result . so moving on");
               callback();
             }
             else {
                    console.log("unexpected error has occured while checking whether already obtained result ");
                     ress.send("unexpected error ");
                      callback(new Error('unexpected error'));
                    }
          }
      });
  },
  function voting_counts_getting_into_array(callback){
    console.log("voting_counts_getting_into_array");
    db.each('select cname as cname,counts as count from votingcounts where election_id=?', [req.body.e_ID], function(err,rowd){
      if(err){
      ress.send("error while obtaining encrypted  voting counts");
      callback(err);
      return console.error(err.message);
      }
      vcounts.push({ name: rowd.cname,counts: rowd.count});
      console.log(rowd.cname);
      console.log("pushing encrypted candidates into vcounts array");



    });      setTimeout(function() {
          callback();
        }, 4000);
  },
  function decrypting_voting_counts(callback){
  console.log("function decrypting_voting_counts");
  console.log(vcounts);
  const algorithm = 'aes-192-cbc';

  // Defining password
  const password = req.body.enc_pass;

  // Defining key
  const key = crypto.scryptSync(password, 'GfG', 24);

  // Defininf iv
  const iv = Buffer.alloc(16, 0);

  for(var i=1;i<vcounts.length;i++)
  {
   let decipher = crypto.createDecipheriv(algorithm,key,iv);
  let decrypted =decipher.update(vcounts[i].name, 'hex','utf-8');
  decrypted += decipher.final('utf-8');
  console.log("decrypted : "+decrypted);
  vcounts[i].name=decrypted;
    }



      setTimeout(function() {
        console.log("decrypted  array");

         console.log(vcounts);
        callback();
      },vcounts.length*500);
  },
  function getting_prep_crea_and_ppos_for_candidates(callback){
    console.log("getting candidates details to insert into result db");


        db.each('select candidate_name as cname,political_representation as prep,participating_position as ppos,competing_area as crea from candidate_directory where election_id=? order by competing_area ,participating_position', [req.body.e_ID], function(err,rowe){
          if(err){
            ress.send("error while obtaining candidate details to prepare result db");
            callback(err);
            return console.error(err.message);
          }
          result.push({ name: rowe.cname,prep: rowe.prep,crea: rowe.crea,ppos: rowe.ppos});
          console.log("pushing details to result array");
        });

      setTimeout(function() {
        console.log("result array : ");
        console.log(result);
        callback();
      },vcounts.length*500);
  },
  function making_result_array(callback){
    //assumes vcount length  is equal to result length
    for(var n=1;n<vcounts.length;n++)
      {
        for (p=1;p<result.length;p++)
          {
            if(vcounts[n].name==result[p].name){
              result[p].counts=vcounts[n].counts;
            }
          }
      }

      setTimeout(function() {
        console.log("result array : ");
        console.log(result);
        callback();
      },1000);

  },
  function e_info_array(callback){
    console.log("getting elelctionid , name , date into array");
    db.get('select election_name as ename,e_date as edate,mode_of_election as emode from election_directory where election_id=?', [req.body.e_ID], function(err,rowf){
      if(err){
        ress.send("error while obtaining candidate details to prepare result db");
        callback(err);
        return console.error(err.message);
      }

      e_info.push({ eid: req.body.e_ID,ename: rowf.ename,edate: rowf.edate,emode: rowf.emode});
      console.log("pushing details to e_info array");
      console.log(e_info);
      callback();
    });

  },
  function making_html_view_for_result(callback){
    console.log("\t log: making_html_view_for_result");
    var resulthtml="<h1 class='electioname'>"+e_info[1].ename+" ["+e_info[1].edate+"]</h1>";
    var ppos=result[1].ppos;
    var crea=result[1].crea;
    console.log("result length"+result.length);
    console.log("resulthtml "+resulthtml);
    var i=1;
    var timerIdhtml = setInterval(function(){
       if(i==result.length){
          console.log("\t clear interval ");
           clearInterval(timerIdhtml);
           }
           else {
             if(i==1){
                     if(crea!='NA'){
                             resulthtml+="<h2 class='area'>"+result[i].crea+"<h2>";
                               }
                     if(ppos!='NA'){
                           resulthtml+="<h2 class='position'>"+result[i].ppos+"<h2>";
                         }
                     }

             if(crea!=result[i].crea && crea!='NA'){
                       crea=result[i].crea;
                       resulthtml+="<h2 class='area'>"+result[i].crea+"</h2>";
                     }


             if(ppos!=result[i].ppos && ppos!='NA'){
                       ppos=result[i].ppos;
                       resulthtml+="<h2 class='position'>"+result[i].ppos+"</h2>";
                     }

             resulthtml+="<h3 class=candidate>"+result[i].name+" ["+result[i].prep+"]    Votes: "+result[i].counts;
             resulthtml+="</h3>";
             i+=1;
           }
    },1000);



  setTimeout(function() {
    console.log("resulthtml : "+resulthtml);
    result_html=resulthtml;
    callback();
  },result.length*1000);
},
  function entering_resulthtml_to_db(callback){
    console.log("function entering_resulthtml_to_db");
    db.run('insert into published_results(election_id,Result_html,e_date) values(?,?,?)', [req.body.e_ID,result_html,e_info[1].edate], function(err,rows){
      if(err){
      ress.send("error while inserting results into published results");
      callback(err);
      return console.error(err.message);
      }
      console.log("added result html  to published_results db");
      callback();

    });
  },
  /*
  function entering_result_to_db(callback){
    console.log("function entering_result_to_db");

    console.log(" inserting result to result db");
     var i=1;
     var timerId = setInterval(function(){
        if(i==result.length){
            clearInterval(timerId);
            }
          else{

        db.run('insert into published_results(election_id,election_name,e_date,mode_of_election,candidate_name,counts,political_representation,participating_position,competing_area) values(?,?,?,?,?,?,?,?,?)', [req.body.e_ID,e_info[1].ename,e_info[1].edate,e_info[1].emode,result[i].name,result[i].counts,result[i].prep,result[i].ppos,result[i].crea,], function(err,rows){
          if(err){
          ress.send("error while inserting results into published results");
          callback(err);
          return console.error(err.message);
          }
          console.log("added one result to published_results db");
          console.log(i);
          i+=1;

        });
      }

    },1000); //dont change this time
     setTimeout(function() {
         console.log("result added to published results db");
       callback();
     },result.length*1000);
  },*/

  function announcement(callback) {
    console.log("function : making announcement");

    var announcement="Election "+e_info[1].ename+" ["+e_info[1].edate+"] result has published";

    let time=new Date().toLocaleTimeString(); // 11:18:48 AM
    //---
    let ddate=new Date().toLocaleDateString(); // 11/16/2015

    db.run('insert into announcements(date,announcement,time) values(?,?,?)', [ddate,announcement,time], function(err,rowf){
      if(err){
        ress.send("error while inserting  announcement details ");
        callback(err);
        return console.error(err.message);
      }
      console.log("announcement entered to database");
      callback();
    });

  },

  function done(callback){

    console.log("all the operations has completed successfully");
    ress.send("result has uploaded to result. And announcement has made");
    callback();
  }
], function(err) {
if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
console.log('async for obtaining result form worked');
});

  vcounts = [
    { name: "", counts: ""}
    ];
    result = [
      { name: "", counts: "",prep: "",crea: "", ppos: ""}
      ];
      e_info =[
        { eid: "",ename: "",edate: "",emode: ""}
      ];



});


//closing database connection
app.get('/close', function(req,res){
  db.close((err) => {
    if (err) {
      res.send('There is some error in closing the database');
      return console.error(err.message);
    }
    console.log('Closing the database connection.');
    res.send('Database connection successfully closed');
  });

});



server.listen(2500,function(){
    console.log("Server listening on port: 2500");
 });
