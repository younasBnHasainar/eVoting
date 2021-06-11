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
app.use(express.static('public'))
app.use('/pages',express.static(__dirname + 'public/pages'))
app.use('/js',express.static(__dirname + 'public/js'))
app.use('/css',express.static(__dirname + 'public/css'))
app.use(helmet());
app.use(limiter);
//app.use('/home', home);
app.get('/', function(req,res){
  res.sendFile(path.join(__dirname,'./public/pages/adlogin.html'));
});

//test
app.post('/responseplease', function(req,res){
res.send("hoo");
});

//admin adlogin
app.post('/adminlogin', function(req,res){
  db.serialize(()=>{
    db.get('SELECT COUNT(*) as countf FROM admin_credentials  WHERE adminID =? and adminPASS=?', [req.body.check_adname, req.body.check_adPASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
		const exist =  row.countf;
 		if(exist ==1) {
 			      //res.send("logged in successfully");
            res.render("last");
      			console.log("logged to home successfully");
      								}
      else if (exist !=1) {
      		res.send("incorrect credentials");
        		console.log("incorrect credentials");
        		}
      else if (err) {
  				res.send("error");
        return console.error(err.message);
      	}
      else {
      	res.send("unexpected result");
        return console.error(err.message);
      	}

    });
  });
});

//adding new election to db
app.post('/new_election', function(req,res){
 console.log("NEW ELECTION");
 async.series([
  function id_or_pass_exists(callback)
  {
    console.log("log :id_or_pass_exists(callback)");
    db.get('SELECT COUNT(*) as counts  FROM election_directory  WHERE election_id =?   OR election_pass =? ' , [req.body.e_ID,req.body.e_PASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            res.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }
          var uvdf=row.counts;
          if(uvdf==1 || uvdf==2){
            console.log(" election id or election_pass exists : try another for creating election");
            res.send("try another  election credentials ");
            return callback(new Error('async error says election credentials exists :'));

          }
          else if (uvdf==0) {

            console.log("found as unique election id ");
            callback();
          }
          else  {
            res.send("unexpected result during checking whether election credentials exists");
            console.log("unexpected result during checking whether_ election credentials exists");
            return callback(new Error('async error says unexpected result in whether_ election_credentials exists'));
          }
           });
    },
    function insertfornewelection(callback)
    { console.log("log :insertfornewelection(callback)");
      db.run('insert into election_directory(election_id,election_pass,election_name,e_date,e_starting_time,e_closing_time,verification_date,mode_of_election) values(?,?,?,?,?,?,?,?)', [req.body.e_ID, req.body.e_PASS, req.body.e_name, req.body.e_date, req.body.e_start_time, req.body.e_close_time, req.body.v_date,req.body.e_mode], function(err,row){
        if(err){
        res.send("error in verification process");
        return console.error(err.message);
        }
      res.send("new election recorded");
      console.log("new election recorded");
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

//update verification date of election
app.post('/update_verification_date', function(req,res){
  async.series([
 function verify_eid_epass(callback) {

 console.log("log :function verify_eid_epass(callback");
 db.get('SELECT COUNT(*) as counts,election_status as estatus  FROM election_directory  WHERE election_id =? AND election_pass =? ' , [req.body.e_ID, req.body.e_PASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

     if(err){
         res.send("election credentials couldnot varify");
          callback(err);
         return console.error(err.message);
       }
       var uvdf=row.counts;
       if(uvdf==1){
         console.log("election credentials are correct ");
          if(row.estatus=='expired'){res.send("election has expired"); console.log("found as electionexpired"); return callback(new Error('async error says election expired')); }
          else {callback();}
       }
       else if (uvdf==0) {
         res.send("incorrect credentials. please check election credentials");
         console.log("incorrect election credentials for update_verification_date");
         return callback(new Error('async error says incorrect credentials'));
       }
       else  {
         res.send("unexpected result during checking election credentials");
         console.log("unexpected result during checking election credentials for  update_verification_date");
         return callback(new Error('async error says unexpected result in update_verification_date'));
       }
        });
 },
 function update_verification_date(callback){
   console.log("log :function update_verification_date(callback)");

   db.run('UPDATE election_directory SET  verification_date=? WHERE election_id =? AND election_pass=?', [req.body.v_date,req.body.e_ID, req.body.e_PASS], function(err){
       if(err){
             res.send("cannot update verification date");
             console.log("verification_date not updated to database. ");
             callback(err);
             return console.error(err.message);
           }

           res.send("verification date updated");
           console.log("verification date updated");
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
app.post('/update_election_date', function(req,res){
  console.log("handling update_election_date request");
  async.series([
 function verify_eid_epass(callback) {

 console.log("log :function verify_eid_epass(callback");
 db.get('SELECT COUNT(*) as counts,election_status as estatus  FROM election_directory  WHERE election_id =? AND election_pass =? ' , [req.body.e_ID, req.body.e_PASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

     if(err){
         res.send("election credentials couldnot varify");
          callback(err);
         return console.error(err.message);
       }
       var uvdf=row.counts;
       if(uvdf==1){
         console.log("election credentials are correct ");
         if(row.estatus=='expired'){res.send("election has expired"); console.log("found as electionexpired"); return callback(new Error('async error says election expired')); }
         else {callback();}
       }
       else if (uvdf==0) {
         res.send("incorrect credentials. please check election credentials");
         console.log("incorrect election credentials for update_election_date");
         return callback(new Error('async error says incorrect credentials'));
       }
       else  {
         res.send("unexpected result during checking election credentials");
         console.log("unexpected result during checking election credentials for  update_election_date");
         return callback(new Error('async error says unexpected result in update_election_date'));
       }
        });
 },
 function update_electiondate(callback){
   console.log("log :function update_electiondate(callback)");

   db.run('UPDATE election_directory SET  e_date=?,e_starting_time=?,e_closing_time=? WHERE election_id =? AND election_pass=?', [req.body.e_date,req.body.estime,req.body.ectime,req.body.e_ID, req.body.e_PASS], function(err){
       if(err){
             res.send("cannot update verification date");
             console.log("verification_date not updated to database. ");
             callback(err);
             return console.error(err.message);
           }

           res.send("election date updated");
           console.log("election date updated");
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
app.post('/register_voter', function(req,res){
  console.log("request for register_voter");
  async.series([
    function verify_eid_epass(callback) {

    console.log("log :function verify_eid_epass(callback: register_voter");
    db.get('SELECT COUNT(*) as counts  FROM election_directory  WHERE election_id =? AND election_pass =? ' , [req.body.e_ID, req.body.e_PASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            res.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }
          var uvdf=row.counts;
          if(uvdf==1){
            console.log("election credentials are correct ");
            callback();
          }
          else if (uvdf==0) {
            res.send("incorrect credentials. please check election credentials");
            console.log("incorrect election credentials for register_voter");
            return callback(new Error('async error says incorrect credentials'));
          }
          else  {
            res.send("unexpected result during checking election credentials");
            console.log("unexpected result during checking election credentials for  register_voter");
            return callback(new Error('async error says unexpected result in register_voter'));
          }
           });
    },
    function register_voter(callback) {
   console.log("log : register_voter");
   db.run('insert into voterlist(v_ID,election_id,v_Name,D_o_B,v_Mail,v_Area) values(?,?,?,?,?,?)', [req.body.vid, req.body.eid, req.body.vname, req.body.dob, req.body.vmail, req.body.varea], function(err,row){
     if(err){
         res.send("error in voter registration process");
         return console.error(err.message);

       }
       res.send("voter added name : "+req.body.vname);
       console.log("new election recorded");
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

//add candidate for election
app.post('/add_candidate', function(req,res){
  console.log("request for add_candidate");
  async.series([
    function verify_eid_epass(callback) {

    console.log("log :function verify_eid_epass(callback: add_candidate");
    db.get('SELECT COUNT(*) as counts,election_status as estatus  FROM election_directory  WHERE election_id =? AND election_pass =? ' , [req.body.eid, req.body.e_PASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

        if(err){
            res.send("election credentials couldnot varify");
             callback(err);
            return console.error(err.message);
          }
          var uvdf=row.counts;
          if(uvdf==1){
            console.log("election credentials are correct ");
            if(row.estatus=='expired'){res.send("election has expired"); console.log("found as electionexpired"); return callback(new Error('async error says election expired')); }
            else {callback();}
          }
          else if (uvdf==0) {
            res.send("incorrect credentials. please check election credentials");
            console.log("incorrect election credentials for add_candidate");
            return callback(new Error('async error says incorrect credentials'));
          }
          else  {
            res.send("unexpected result during checking election credentials");
            console.log("unexpected result during checking election credentials for  add_candidate");
            return callback(new Error('async error says unexpected result in add_candidate'));
          }
           });
    },
    function already_exists(callback){
      console.log("log :function already_exists(callback): add_candidate");
      db.get('SELECT COUNT(*) as counts  FROM candidate_directory  WHERE candidate_id =? AND candidate_name =? AND election_id=?' , [req.body.cid, req.body.cname,req.body.eid], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

          if(err){
              res.send("couldnot check whether candidate already exists for this election");
               callback(err);
              return console.error(err.message);
            }
            var uvdf=row.counts;
            if(uvdf==1){
              console.log(" candidate already exists for this election");
              res.send("candidate already exists for this election");
                return callback(new Error('async error says candidate already exists for this election'));
            }
            else if (uvdf==0) {

              console.log("found as no same candidate  already existing");
              callback();
            }
            else  {
              res.send("unexpected result during checking whether candidate already exists for this election");
              console.log("unexpected result during checking ewhether candidate already exists for this election");
              return callback(new Error('async error says unexpected result in checking whether candidate already exists '));
            }
             });

    },
    function add_candidate(callback) {
     console.log("log : add_candidate(callback)");
     db.run('insert into candidate_directory values(?,?,?,?,?,?)', [req.body.cid, req.body.eid, req.body.cname, req.body.p_rep, req.body.p_pos, req.body.c_area], function(err,row){
      if(err){
         res.send("error in candidate registration process");
         return console.error(err.message);

       }
       res.send("candidate added id : "+req.body.cid+" name : "+req.body.cname);
       console.log("candidate added");
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


app.post('/enable_election', function(req,res){
console.log("handling request enable_election");

// election_credentialsc check
//time date check

//update  Encryption password to password directory database
//update election status of election_directory as enabled - check whether already enabled
//update election_status of voter_slist as enabled
//update encryption password to db
//create a table for eid and insert all values for encrypted candiadte names with count as anotherfield

async.series([
  //check election admin_credentials
  function verify_eid_epass(callback) {

  console.log("log :function verify_eid_epass(callback: enable election");
  db.get('SELECT COUNT(*) as counts  FROM election_directory  WHERE election_id =? AND election_pass =? ' , [req.body.e_ID, req.body.e_PASS], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

      if(err){
          res.send("election credentials couldnot varify");
           callback(err);
          return console.error(err.message);
        }
        var uvdf=row.counts;
        if(uvdf==1){
          console.log("election credentials are correct ");
          callback();
        }
        else if (uvdf==0) {
          res.send("incorrect credentials. please check election credentials");
          console.log("incorrect election credentials for enable election");
          return callback(new Error('async error says incorrect credentials'));
        }
        else  {
          res.send("unexpected result during checking election credentials");
          console.log("unexpected result during checking election credentials for  enable election");
          return callback(new Error('async error says unexpected result in enable election'));
        }
         });
  },
 //time date check
 function timeanddatecheck(callback){
            console.log("time and date check function");

         //CHECK FOR ELECTIONDATE ALSO COMPARE WITH CUR DATE
         db.get('select count(*) as countcd,election_name as ename,election_status as e_status,e_date as edate,e_starting_time as est,e_closing_time as ect from election_directory where election_id=? AND e_date=date("now") AND time("now") >= e_starting_time and time("now") <= e_closing_time ' , [req.body.e_ID], function(err,rows){
           if(err){
           res.send("error while getting election status");
           callback(err);
           return console.error(err.message);
           }
           else{
               var estatus=rows.e_status;
               console.log("count :"+rows.countcd);
               var countcrd=rows.countcd;
               if(countcrd==1)
               { //alreday enabled??
                  if(rows.e_status=='enabled') {res.send("election has already enabled "); callback(new Error('election has expired'));}
                   else {console.log("varified electiondate and time");
                   callback();}

               }
               else if(countcrd==0) {
                 db.get('select election_status as e_status,e_date as edate,e_starting_time as est,e_closing_time as ect from election_directory where election_id=?  ' , [req.body.e_ID], function(err,rowc){
                   if(err){
                   res.send("error while getting election status");
                   callback(err);
                   return console.error(err.message);
                   }
                   console.log("date do not match");
                   if(rowc.e_status=='expired') {res.send("election has expired"); callback(new Error('election has expired'));}

                   else {console.log("unexpected result in election_status check : countcrd 0");  callback(new Error('unexpected result in election_status check'));}
                 });
               }
               else {
                 console.log("unexpected out");
                 res.render("unexpected error occured");
                 callback(new Error('unexpected result in election_status check'));
               }
               //DONT REMOVE EXPIRED CONDITIONN FOR SECURITY

             }
           });

 },

 //update election status of election_directory as whether_enabled
 //update election_status of voter_slist as whether_enabled
    function estatus(callback)
    { console.log("status update function to update election_directory and voter_slist");
      db.run('update election_directory set election_status="enabled" where election_id=?', [req.body.e_ID], function(err,rows){
        if(err){
        res.send("error while updating election status of election directorys");
        callback(err);
        return console.error(err.message);
        }
        console.log("updated election status of election directorys");
        db.run('update voter_slist set voting_status="enabled" where election_id=?', [req.body.e_ID], function(err,rows){
          if(err){
          res.send("error while updating election status of election directorys");
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
      console.log("whether there is already encryption pass?");
      dbl.get('select count(*) as encount from evoting  where electionid=?', [req.body.e_ID], function(err,rows){
        if(err){
        res.send("error while updating election status of election directorys");
        callback(err);
        return console.error(err.message);
        }
        else if(rows.encount==1)
        { console.log("yes");
          for(var j=enable.length;j>=1;j--) {console.log("clearing so poping enable array  for reminding that  and ignore for other operation"); enable.pop();}
          enable.push({ status: '1'}); console.log("enable arrray : "+enable);
          console.log("encryption pass already exists , so just enabling election has need to done");
            callback();
        }
        else if(rows.encount==0)
        { console.log("no encryption pass setted so far");
          console.log("updating encryption PASSWORD");
          dbl.run('insert into evoting values(?,?) ', [req.body.e_ID,req.body.enc_pass], function(err,rows){
            if(err){
            res.send("error while updating election status of election directorys");
            callback(err);
            return console.error(err.message);
            }
            else {
              console.log("updated encryption passord successfully");
              //clearing clist elist array for inputs
                    if(clist.length>1){
                                      for(var j=clist.length;j>1;j--) {console.log("clearing so poping clist array for new input"); clist.pop();}
                                    }
                    if(elist.length>1){
                      for(var j=elist.length;j>1;j--) {console.log("clearing so poping elist array for new input"); elist.pop();}
                    }



            }
            callback();
          });
        }
        else {console.log("unexpected error while updating encryption password");  callback(new Error('unexpected result in election_status check')); res.send("error");}
      });
    },

    function candidatesarray(callback)
    {
      console.log("function candidates array");

      //checking whether only enabling fn needed not inserting password
      if(enable[0].status=='1')
      {

        console.log("encryption pass already exists , so just enabling election has need to done");
          callback();
      }
      else{
        db.each('select candidate_name as cname from candidate_directory  where election_id=?', [req.body.e_ID], function(err,rowc){
          if(err){
          res.send("error while getting candidate name of eid for encrypting");
          callback(err);
          return console.error(err.message);
          }
          clist.push({ name: rowc.cname});
          console.log("pushing candidates into clist array");

        });
        setTimeout(function() {
        callback();
        }, 1000);
      }



    },
      //encrypting candidate names of electionid
      function encrypting_candiadetes(callback){

        console.log("function encrypting_candiadetes");
        console.log("whether there is already encryption pass?");
        if(enable[0].status=='1')
        {

          console.log("encryption pass already exists , so just enabling election has need to done");
            callback();
        }
        else {
          dbl.get('select password as pwd from evoting  where electionid=?', [req.body.e_ID], function(err,rows){
            if(err){
            res.send("error while updating election status of election directorys");
            callback(err);
            return console.error(err.message);
            }

            console.log("fetched password for encrypting");
            console.log("array clist");
            console.log(clist);




            const algorithm = 'aes-192-cbc';

            // Defining password
            const password = rows.pwd;

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





          });
          setTimeout(function() {
          callback();
        },2000);
        }



      },
      function inserting_ecrptd_cnames_to_vote_counts(callback)
      {
        console.log("function : inserting_ecrptd_cnames_to_vote_counts");
        console.log("whether there is already encryption pass?");
        if(enable[0].status=='1')
        {

          console.log("yes \n encryption pass already exists , so just enabling election has need to done");
          console.log("election enabling done");
          res.send("election has enabled");
            callback();
        }
        else { console.log("no \n inserting_ecrptd_cnames_to_vote_counts");
              for(var i=1;i<elist.length;i++)
              {
            db.run('insert into votingcounts(election_id,cname) values(?,?)', [req.body.e_ID,elist[i].etdname], function(err,rows){
              if(err){
              //res.send("error while inserting erptd cnames to db");
              //callback(err);
              return console.error(err.message);
              }
              console.log("added one candidate to db");

            });
          }
          setTimeout(function() {
              console.log("election enabling done");
            res.send("election has enabled");
            callback();
            },4000);
         }

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
app.post('/disable_election', function(req,res){
console.log("handling request disable_election");


});


enable = [
{status: ""}
];

clist = [
  { name: ""}
];
elist = [
  { etdname: ""}
];
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
