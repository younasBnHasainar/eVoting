var sqlite3 = require('sqlite3').verbose();
var express = require('express');
const ejs = require("ejs");
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var generator = require('generate-password');
var app = express();
var server = http.createServer(app);
var async = require("async");
const crypto = require('crypto');
app.set("view engine", "ejs");
var nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
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


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);





app.get('/', function(req,res){
  //res.sendFile(path.join(__dirname,'./public/index.html'));
async.series([
function getting_upcoming_elections(callback){
  console.log("log: getting_upcoming_elections");
  db.each('select election_name as ename from election_directory where e_date>=date("now") and election_status!="expired"', [], function(err,rows){
    if(err){
    res.send("error while getting getting_upcoming_elections list");
    callback(err);
    return console.error(err.message);
    }
    up_elections.push({ename: rows.ename});
    console.log("pushed.. : "+rows.ename);
  });
        setTimeout(function() {
          callback();
        }, 1000);
},
function rendering_home_page(callback){
    res.render("home"); callback();
}



], function(err) {
if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
}
console.log('async for user home page worked ');
});


up_elections = [
    { ename: ""}
  ];
  msg= [{msg: ""}];
  msg2= [{msg: ""}];
});


//Login
app.post('/voterlogin', function(req,ress){

  console.log("\n\tVOTER LOG IN REQUEST \n");
      var mode="0";
      var e_id=''; var v_area=''; var vstatus=''; var ename='';
      var estatus=''; var edate=''; var est=''; var ect='';
      msg2= [{msg: ""}];
  async.series([
    function checkcredentials(callback)
    { console.log("LOG checkcredentials: verifying voterid for election");
      db.get('SELECT COUNT(*) as countcc,verification_status as veri_status   FROM voter_slist v,election_directory e  WHERE v_ID =? and election_name=? and v.election_id=e.election_id', [req.body.check_ID, req.body.ename], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
  		const exist = row.countcc;
 		   if(exist ==1) {
      			           console.log("voter id exists for "+req.body.ename);
                      if(row.veri_status!="verified"){console.log("voter has not verified .Please verify before logging in");
                                              msg2[0].msg+="voter has not verified .Please verify before logging in";
                                              ress.render("home",{msg2: msg2});   callback(new Error('error'));
                                            }
                      else {console.log("found as verified voter ");
                          callback();
                            }
      								}
      else if (exist ==0) {
                            msg2[0].msg+="voter id not foundin voter list of "; msg2[0].msg+=req.body.ename;
                            ress.render("home",{msg2: msg2});

        		                console.log("voter id not found in voter list of "+req.body.ename);
                                callback(new Error('error'));
        		              }
      else if (err) {
        msg2[0].msg+="error ";
        ress.render("home",{msg2: msg2});
        return console.error(err.message);
        callback(new Error('failed to login'));
      	}
      else {
        msg2[0].msg+="unexpected error ";
        ress.render("home",{msg2: msg2});
        return console.error(err.message);
        callback(new Error('error'));
      	}
      });
    },
    function verifying_password(callback){
      console.log("verifying password");
      db.get('select count(*) as element ,password as pass,mode_of_election mode,v.election_id as eid,v_Area as vrea,voting_status as vstatus,election_name as ename,election_status as estatus,e_date as edate,e_starting_time as est,e_closing_time as ect from voter_slist v,election_directory e where v_ID =? and election_name=? and v.election_id=e.election_id', [req.body.check_ID, req.body.ename], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
     if (err) {
  				ress.send("error");
        return console.error(err.message);
        callback(new Error('failed to login'));
      	}
     else {
           const exist = row.element;
           if (exist==0) {
                        msg2[0].msg+="voter id not found in voter list of "; msg2[0].msg+=req.body.ename;
                        ress.render("home",{msg2: msg2});   callback(new Error('error'));

                        console.log("voter id not found in voter list of "+req.body.ename);
                        callback(new Error('error'));
          }
          else if (exist==1) {
                            if(row.pass=="NULL") {
                                  console.log("password has not yet set for voter id, verify bfre login");
                                  msg2[0].msg+="voter has not verified .Please verify before logging in";
                                  ress.render("home",{msg2: msg2});   callback(new Error('error'));
                           }
                           else {
                                  const plainTextPassword1 = req.body.check_PASS;
                                  const hash = row.pass;
                                  bcrypt
                                  .compare(plainTextPassword1, hash)
                                  .then(res => {
                                            if(res==true){console.log("voter password is correct"); console.log(res);
                                                      mode=row.mode; e_id=row.eid; v_area=row.vrea; vstatus=row.vstatus; ename=row.ename;
                                                      estatus=row.estatus; edate=row.edate; est=row.est; ect=row.ect;
                                                      callback();

                                                      }
                                            else if (res==false) {
                                                      console.log("incorrect voter password"); console.log(res);

                                                      msg2[0].msg+="incorrect password";
                                                      ress.render("home",{msg2: msg2});   callback(new Error('error'));

                                                      }
                                           else {
                                                  console.log("unexpected error"); console.log(res);
                                                  msg2[0].msg+="unexpected error";
                                                  ress.render("home",{msg2: msg2});   callback(new Error('error'));
                                                }

                              })
                              .catch(err =>{
                                            msg2[0].msg+=" error";
                                            ress.render("home",{msg2: msg2});
                                            console.log("error in becrypt"); callback(new Error('async error '));
                                            console.error(err.message);
                                          });
                            }
                  }
            else {
                  msg2[0].msg+="unexpected error";
                  ress.render("home",{msg2: msg2});
                  console.log("unexpected error ");
                  callback(new Error('error'));
        	       }
        }

      });
    },
    function election_status(callback){
      console.log("\t log election status ");
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
        if(curtime>=est && curtime<ect){
          console.log("found as ON election time");
          if(estatus=='enabled'){
            console.log("found as election enabled");
                  if (vstatus!='voted') {
                    console.log("found as not voted yet");
                    user_info.push({vvid: req.body.check_ID,veid: e_id,vrea: v_area,ename: ename});
                    console.log("user_info pushed to array");
                    callback();
                  }
                  else {
                    console.log("voting status : "+vstatus);
                    msg2[0].msg+="Already Voted. THANKYOU ";
                    ress.render("home",{msg2: msg2});   callback(new Error('error'));
                  }
          }
          else {
            console.log("election has not enabled  status:"+estatus);
            msg2[0].msg+="Election has not enabled ";
            ress.render("home",{msg2: msg2});   callback(new Error('error'));
          }
        }
        else {
              if(curtime<est){
                console.log("election time yet to come ");
                msg2[0].msg+="Election has not started. Please login in between times "+est+" and "+ect;
                ress.render("home",{msg2: msg2});   callback(new Error('error'));
              }
              else if (curtime>=ect) {
                console.log("Election time surpassed");
                msg2[0].msg+="Election has expired ";
                ress.render("home",{msg2: msg2});   callback(new Error('error'));
              }
              else {
                console.log("unexpected error : time ");
                msg2[0].msg+="Error occured ";
                ress.render("home",{msg2: msg2});   callback(new Error('error'));
              }
        }
      }
      else { console.log("found as not election date");
        if(estatus=='expired'){
                                console.log("election has expired");
                                msg2[0].msg+="election has expired ";
                                ress.render("home",{msg2: msg2});   callback(new Error('error'));
                              }
        else  {
            if(curdate.getTime()<edate.getTime()){
              console.log("election date yet to come");
              msg2[0].msg+="Election "+ename+" is on "+edate+" between times "+est+" and "+ect+". Please login ON TIME";
              ress.render("home",{msg2: msg2});   callback(new Error('error'));
            }
            else if (curdate.getTime()>edate.getTime()) {
              console.log("Election date surpassed");
              msg2[0].msg+="Election has expired ";
              ress.render("home",{msg2: msg2});   callback(new Error('error'));
            }
            else {
              console.log("unexpected error: unexpected estatus and date");
              msg2[0].msg+="Error occured ";
              ress.render("home",{msg2: msg2});   callback(new Error('error'));
            }
        }

      }
    },

    function entering(callback){
      console.log(" LOG: in function entering(eid,callback)");
      console.log("voter area"+user_info[1].vrea+"voter eid "+user_info[1].veid);
      if(candidate_sc.length>1){ for(var j=candidate_sc.length;j>1;j--) {console.log("clearing so poping candidate_sc array for new input"); candidate_sc.pop();}}
              console.log("fetching candidates for v_area and veid ");
              db.each('SELECT candidate_name as cname,political_representation as p_rep,participating_position as p_pos from candidate_directory  WHERE competing_area=? and  election_id=? ORDER BY participating_position' , [user_info[1].vrea,user_info[1].veid], function(err,rows){
              if(err){
                      msg2[0].msg+="error";
                      ress.render("home",{msg2: msg2});
                      callback(err);
                      console.log("error in query");
                      return console.error(err.message);
                  }
            candidate_sc.push({ cnme: rows.cname,prep: rows.p_rep,c_pos: rows.p_pos});
            console.log(candidate_sc);
            console.log(user_info);
             //console.log(`${rows.cname} ${rows.p_rep}`);
                });
                setTimeout(function() {
                callback();
              }, candidate_sc.length*500);

},
    function construct(callback){

      console.log("LOG : construct voting page");

      if(mode=="area-based") {
        mode="1"; ress.render("votingpage1",{candidate_sc: candidate_sc,user_info: user_info});
        console.log("entering votingpage1"); callback();
      }
      else if(mode=="area-pos-based") {
        mode="2";ress.render("votingpage3",{candidate_sc: candidate_sc,user_info: user_info});
        console.log("entering votingpage3"); callback();
     }
      else if(mode=="pos-only") {
        mode="3";ress.render("votingpage3",{candidate_sc: candidate_sc,user_info: user_info});
        console.log("entering votingpage3"); callback();
      }
      else { console.log("error in mode check");
                  msg2[0].msg+="Error Occured ";
                  ress.render("home",{msg2: msg2});   callback(new Error('error'));
            }


}


  ], function(err) {
 if (err) {
     //Handle the error in some way. Here we simply throw it
     //Other options: pass it on to an outer callback, log it etc.
     console.log(" async disturbed in between");
 }
 console.log('async for login page worked ');
});

candidate_sc = [
    { cnme: "",prep: "",cpos: ""}
  ];
  user_info = [
    { vvid: "",veid: "",vrea: "",ename: ""}
  ];

});


app.post('/cast_vote', function(req,res){
  console.log("\n\t handling request  Cast_vote_");

  console.log("voter  id : "+req.body.voter+ "election_id : "+req.body.election+" total postions of competing "+req.body.k);
  var enc_pass ='';
    console.log(req.body);
  async.series([
    //FUNCTION WHTHER ALREADYVOTED
    function whether_already_voted(callback)
    {
      console.log("LOG :whether_already_voted : ");
      db.get('SELECT voting_status as vstatus from voter_slist where v_ID=? and election_id=?',[req.body.voter,req.body.election], function(err,row){
        if(err){
            res.send("error ");
            console.log("error in query ");
            callback(err);
            return console.error(err.message);
            }
            console.log("voting status fetched");
            if(row.vstatus=="voted"){res.send("voter already voted"); callback(new Error('voter already voted'));}
            else if(row.vstatus=="disabled"){res.send("sorry voting has not enabled yet"); callback(new Error('voting not enabled'));}
            else if (row.vstatus=="enabled") { console.log("found to be an eligible voter to vote . voting has enabled for him"); callback();}
            else {console.log("unexpected error occured "); res.send("unexpected error occured"); callback(new Error("unexpected error"));}


      });
    },
    function fetching_encryption_pass(callback)
    {
      console.log("function fetching_encryption_pass");
      dbl.get('select count(*) as countp,password as pwd from evoting  where electionid=?', [req.body.election], function(err,rowp){
        if(err){
        res.send("error while updating election status of election directorys");
        callback(err);
        return console.error(err.message);
        }
        else if(rowp.countp==1)
        {
        console.log("fetched hashed enc password ");
        console.log(rowp.pwd);
        console.log("decrypting enc pass");
        const algorithm = 'aes-192-cbc';

        // Defining password
        const password = 'bncaskdbvasbvlaslslasfhj';

        // Defining key
        const key = crypto.scryptSync(password, 'GfG', 24);

        // Defininf iv
        const iv = Buffer.alloc(16, 0);
        let decipher = crypto.createDecipheriv(algorithm,key,iv);
        let decrypted =decipher.update(rowp.pwd, 'hex','utf-8');
        decrypted += decipher.final('utf-8');
        console.log("decrypted enc pass: "+decrypted);

        enc_pass=decrypted;
          setTimeout(function() {
            callback();
          }, 2000);

        }
        else{
            console.log("unexpected out in fetching_encryption_pass");
            res.render("unexpected error occured");
            callback(new Error('unexpected result in fetching_encryption_pass'));
            }

      });

    },
    function encrypting_casted_vote_level1(callback)
    {
      console.log("in function encrypting_casted_vote_level1");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
          if(tp=='1' || tp=='2' ||tp=='3' ||tp=='4' ||tp=='5' ||tp=='6' ||tp=='7' ||tp=='8'){
                    console.log("selected position1 candidate "+req.body.position1);
                if (req.body.position1==undefined || req.body.position1=='') {
                  console.log("not selected canidate for position 1");
                  callback();
                }
                else {

                console.log("candiadate selected for position1 is "+req.body.position1);
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted= cipher.update(req.body.position1, 'utf-8','hex');
                encrypted += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                        if (rowvc.xist==1) {
                        var vcount=rowvc.vcount;
                        console.log("vcount :"+vcount);
                        vcount+=1;
                        console.log("vcount updated"+vcount);
                        db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted], function(err,rowvc){
                          if(err){
                              res.send("error while updating count for position1");
                              callback(err);
                              return console.error(err.message);
                              }
                              console.log("updated vote count for position1 successfully");
                              callback();
                            });

                   }
                  else {
                    console.log("unexpected out in election with only one pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with only one pos'));
                  }
                }
                });

              }
              }
              else {
                console.log("unexpected number of pos");
                res.render("unexpected error occured");
                callback(new Error('unexpected number of pos'));
              }

    },
    function encrypting_casted_vote_level2(callback)
    {
      console.log("in function encrypting_casted_vote_level2");

      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='2' ||tp=='3' ||tp=='4' ||tp=='5' ||tp=='6' ||tp=='7' ||tp=='8'){

                console.log("candiadte selected for position2 is "+req.body.position2);

                if (req.body.position2==undefined || req.body.position2=='') {
                  console.log("not selected canidate for position 2");
                  callback();
                  }
              else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted2= cipher.update(req.body.position2, 'utf-8','hex');
                encrypted2 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted2);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted2], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted2], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position2");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position2 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 2 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 2 pos'));
                  }
                }
                });

              }
              }

    },
    function encrypting_casted_vote_level3(callback)
    {
      console.log("in function encrypting_casted_vote_level3");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1' || tp=='2'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='3' ||tp=='4' ||tp=='5' ||tp=='6' ||tp=='7' ||tp=='8'){

                console.log("candiadte selected for position3 is "+req.body.position3);

              if (req.body.position3==undefined || req.body.position3=='') {
                  console.log("not selected canidate for position 3");
                  callback();
                  }
              else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted3= cipher.update(req.body.position3, 'utf-8','hex');
                encrypted3 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted3);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted3], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted3], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position3");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position3 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 3 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 3 pos'));
                  }
                }
                });

              }
              }

    },
    function encrypting_casted_vote_level4(callback)
    {
      console.log("in function encrypting_casted_vote_level4");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1' || tp=='2' || tp=='3'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='4' ||tp=='5' ||tp=='6' ||tp=='7' ||tp=='8'){

                console.log("candiadte selected for position4 is "+req.body.position4);
            if (req.body.position4==undefined || req.body.position4=='') {
                    console.log("not selected canidate for position 4");
                    callback();
                    }
            else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted4= cipher.update(req.body.position4, 'utf-8','hex');
                encrypted4 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted4);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted4], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted4], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position4");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position4 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 4 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 4 pos'));
                  }
                }
                });

              }
              }

    },
    function encrypting_casted_vote_level5(callback)
    {
      console.log("in function encrypting_casted_vote_level5");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1' || tp=='2' ||tp=='3' ||tp=='4'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='5' ||tp=='6' ||tp=='7' ||tp=='8'){

                console.log("candiadte selected for position5 is "+req.body.position5);
              if (req.body.position5==undefined || req.body.position5=='') {
                    console.log("not selected canidate for position 5");
                    callback();
                    }
              else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted5= cipher.update(req.body.position5, 'utf-8','hex');
                encrypted5 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted5);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted5], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted5], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position5");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position5 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 5 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 5 pos'));
                  }
                }
                });

              }
              }

    },
    function encrypting_casted_vote_level6(callback)
    {
      console.log("in function encrypting_casted_vote_level6");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1' || tp=='2' ||tp=='3' ||tp=='4' ||tp=='5'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='6' ||tp=='7' ||tp=='8'){

                console.log("candiadte selected for position6 is "+req.body.position6);
            if (req.body.position6==undefined || req.body.position6=='') {
                    console.log("not selected canidate for position 6");
                    callback();
                    }
            else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted6= cipher.update(req.body.position6, 'utf-8','hex');
                encrypted6 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted6);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted6], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted6], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position6");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position6 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 6 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 6 pos'));
                  }
                }
                });

              }
              }

    },
    function encrypting_casted_vote_level7(callback)
    {
      console.log("in function encrypting_casted_vote_level7");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1' ||  tp=='2' ||tp=='3' ||tp=='4' ||tp=='5' ||tp=='6'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='7' ||tp=='8'){

                console.log("candiadte selected for position7 is "+req.body.position7);
            if (req.body.position7==undefined || req.body.position7=='') {
                    console.log("not selected canidate for position 7");
                    callback();
                    }
            else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted7= cipher.update(req.body.position7, 'utf-8','hex');
                encrypted7 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted7);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted7], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted7], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position7");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position7 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 7 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 7 pos'));
                  }
                }
                });

              }
              }

    },
    function encrypting_casted_vote_level8(callback)
    {
      console.log("in function encrypting_casted_vote_level8");
      const algorithm = 'aes-192-cbc';

      // Defining password
      const password = enc_pass;

      // Defining key
      const key = crypto.scryptSync(password, 'GfG', 24);

      // Defininf iv
      const iv = Buffer.alloc(16, 0);

        var tp=req.body.k;
        console.log("value of tp"+tp);
          if(tp=='1' || tp=='2' ||tp=='3' ||tp=='4' ||tp=='5' ||tp=='6' ||tp=='7'){console.log("level has completed so ignoring other levels"); callback();}
          else if( tp=='8'){

                console.log("candiadte selected for position8 is "+req.body.position8);
            if (req.body.position8==undefined || req.body.position8=='') {
                    console.log("not selected canidate for position 8");
                    callback();
                    }
            else {
                let cipher = crypto.createCipheriv(algorithm, key, iv);
                let encrypted8= cipher.update(req.body.position8, 'utf-8','hex');
                encrypted8 += cipher.final('hex');
                console.log('encrypted canidate name: '+encrypted8);
                db.get('select count(*) as xist,counts as vcount from votingcounts  where election_id=? and cname=?', [req.body.election,encrypted8], function(err,rowvc){
                  if(err){
                  res.send("error while checking encrypted candidate name present in db");
                  callback(err);
                  return console.error(err.message);
                  }
                  else{
                     if (rowvc.xist==1) {
                    var vcount=rowvc.vcount;
                    console.log("vcount :"+vcount);
                    vcount+=1;
                    console.log("vcount updated"+vcount);
                    db.run('update votingcounts set counts=? where election_id=? and cname=?', [vcount,req.body.election,encrypted8], function(err,rowvc){
                      if(err){
                      res.send("error while updating count for position8");
                      callback(err);
                      return console.error(err.message);
                      }
                      console.log("updated vote count for position8 successfully");
                        callback();
                    });

                  }
                  else {
                    console.log("unexpected out in election with 8 pos");
                    res.render("unexpected error occured");
                    callback(new Error('unexpected result in in election with 8 pos'));
                  }
                }
                });

              }
              }

    },
    //FUNCTION UPDATE USER VOTIN STATUS AS VOTED
    function update_voting_status(callback){
      db.run('update voter_slist set voting_status="voted" where v_ID=? and election_id=?', [req.body.voter,req.body.election], function(err,row){
        if(err){
            res.send("error ");
            console.log("error in query ");
            callback(err);
            return console.error(err.message);
            }
            console.log("voting status updated as VOTED");
            res.send("your vote has recorded  ");
            console.log("voted :completed process");
            callback();
      });
    }




  ], function(err) {
  if (err) {
     //Handle the error in some way. Here we simply throw it
     //Other options: pass it on to an outer callback, log it etc.
     console.log(" async disturbed in between");
  }
  console.log('async cast vote worked ');
  });
});

app.get('/results', function(req,res){
  var result_size=0;
  async.series([

  function getting_size_result_db(callback){
    db.get('select count(*) as size from published_results ', [], function(err,rowg){
      if(err){
      res.send("error ");
      console.log("error while getting size of result db");
      callback(err);
      return console.error(err.message);
      }

      console.log("size of result db obtained");
      result_size=rowg.size;
      callback();
    });

  },
  function settingup_result_page(callback){

    console.log("settingup_result_page");
    console.log("result_size  "+result_size);
    db.each('select Result_html as rhtml from published_results order by sino desc', [], function(err,rowg){
      if(err){
      res.send("error while getting  results from published results");
      callback(err);
      return console.error(err.message);
      }
      r_page.push({ rhtml: rowg.rhtml});
      console.log("pushings published_results to r_page array");

    });
    setTimeout(function() {
        console.log("published_results added to r_page array");
        console.log(r_page);
        callback();
      },result_size*300);

  },
  function result_page(callback){

    res.render("ResultPage",{r_page: r_page});
  },


  ], function(err) {
    if (err) {
   //Handle the error in some way. Here we simply throw it
   //Other options: pass it on to an outer callback, log it etc.
   console.log(" async disturbed in between");
    }
    console.log('async for obtaining result page worked');
  });


      r_page = [
                { rhtml: "" }

              ];

});
app.get('/announcements', function(req,res){
  var announce_size=0;
  async.series([

  function getting_size_result_db(callback){
    db.get('select count(*) as size from announcements', [], function(err,rowg){
      if(err){
      res.send("error ");
      console.log("error while getting size of announcement db");
      callback(err);
      return console.error(err.message);
      }

      console.log("size of announcement db obtained");
      announce_size=rowg.size;
      callback();
    });

  },
  function announcement_page(callback){
    console.log("function making announcement");
    db.each('select date as date,announcement as anc,time as time from announcements order by sino desc', [], function(err,rowj){
      if(err){
      res.send("error ");
      console.log("error while getting  announcements from db");
      callback(err);
      return console.error(err.message);
      }
      a_page.push({ date: rowj.date,announcement: rowj.anc,time: rowj.time});
      console.log("pushing announcements to a_page array");

    });
    setTimeout(function() {
        console.log("announcements added to a_page array");
        console.log(a_page);
        callback();
      },announce_size*300);

  },
  function rendering_announcement_page(callback){
    console.log("function : rendering_announcement_page");
      res.render("announcement",{a_page: a_page});

  }


], function(err) {
  if (err) {
 //Handle the error in some way. Here we simply throw it
 //Other options: pass it on to an outer callback, log it etc.
 console.log(" async disturbed in between");
  }
  console.log('async for obtaining announcement page worked');
});
        a_page = [
                  {date: "",announcement: "",time: ""}
                  ];


});

//verification
app.post('/voterverification', function(req,res){
  console.log("\n\tREQUEST: VOTER VERIFICATION\n");
  var vdate="0",edate="0",ectime="0",usermail="0",eid='0';
  msg= [{msg: ""}];
  var newpass="0";
  var hashed_vpass="";
     async.series([

		function verifywithdb(callback) {
			console.log("log :function verifywithdb(callback)");
    		db.get('select count(*) as count,v.election_id as eid,e_starting_time as estime,v_Mail as vmail,election_status as estatus,verification_status as vstatus,verification_date as vdate,e_date as edate, e_closing_time as ectime from voter_slist v, election_directory e where v_ID=? AND  election_name=? AND v.election_id=e.election_id' , [req.body.verify_id,req.body.ename], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB

     				if(err){
        				res.send("error in verification process");
        				 callback(err);
        				return console.error(err.message);

     					}
              else {
                if(row.count==1){ eid=row.eid; usermail=row.vmail; vdate=row.vdate; edate=row.edate; estime=row.estime; ectime=row.ectime; console.log("election_id "+eid+" verification time limit : "+vdate+" to "+edate+" ,"+ectime);
                  console.log("vid found in election list");


                    // not neccessary as only un expired elections only shows in user page?? needed
                            if (row.estatus=='expired') {
                                        console.log("Election has expired");
                                        msg[0].msg+="election  ";
                                        msg[0].msg+=req.body.ename;
                                        msg[0].msg+="has expired  ";
                                        res.render("home",{msg: msg})
                                        callback(new Error('error'));
                          }
                          else if (row.estatus=='disabled'){
                                    console.log("election status :disabled");
                                    if(row.vstatus=='verified') {
                                //res.send("already verified");
                                        console.log("found as already verified");
                                        msg[0].msg+="found as already verified for ";
                                        msg[0].msg+=req.body.ename+' election';
                                        res.render("home",{msg: msg});
                                        callback(new Error('error'));

                                  }
                                  else {
                                        console.log("found as not verified");callback();
                                      }
                        }
                        else if (row.estatus=='enabled') {
                          console.log("election status enabled. gonna check election date and time"); callback();
                        }
                        else {console.log("unexpected out"); res.send("unexpected error "); 	callback(new Error('error'));}
                  }
                else if(row.count==0){
                    console.log("voter not found in voter list of "+req.body.ename);
                    msg[0].msg+="You are not listed in the voter list of ";
                    msg[0].msg+=req.body.ename;
                    res.render("home",{msg: msg})
                    //res.send("You are not listed in the voter list of "+req.body.ename);
                    	callback(new Error('error'));
                }
                else {
                  console.log("unexpected out"); res.send("unexpected error "); 	callback(new Error('error'));
                }
              }
     	 });
	 },
    function datecheck(callback){
      let curdate=new Date();
      let curhour =curdate.getHours();
      curhour=String(curhour);
      if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
      let curminute=curdate.getMinutes();
      curminute=String(curminute);
      if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
      let curtime=curhour+":"+curminute;
      console.log("curtime : "+curtime);
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
      console.log('curdate : '+curdate);
      console.log("vdate "+vdate);
      vdate=new Date(vdate);
      console.log("vdate "+vdate);
      edate=new Date(edate);

      if(curdate.getTime()>=vdate.getTime() && curdate.getTime()<=edate.getTime()){
                  if (curdate.getTime()==edate.getTime()) {
                            if(curtime>=ectime){
                                              msg[0].msg+="Election has expired";
                                              console.log("Election has expired");
                                              res.render("home",{msg: msg});
                                              callback(new Error('error'));
                                              }
                            else if (curtime<ectime) { console.log("curdate is electiondate");
                                            console.log("found as up to the time for verification,process continues ...");
                                            callback();
                                            }
                            else {
                                  console.log("unexpected error");
                                  msg[0].msg+="Error Occured";

                                  res.render("home",{msg: msg});
                                  callback(new Error('error'));
                                }
                }
                else if(curdate.getTime()<edate.getTime()){ console.log("not same day "+edate+" "+curdate);
                      console.log("found as up to the time for verification,process continues ...");
                      callback();
                }
                else {
                  msg[0].msg+="Error Occured";
                  console.log("Unexpected Error");
                  res.render("home",{msg: msg});
                  callback(new Error('error'));
                }
      }
      else if(curdate.getTime()<vdate.getTime()){

        msg[0].msg+="Verification has not opened ";
        console.log("verification has closed");
        res.render("home",{msg: msg});
        callback(new Error('error'));
      }
      else if (curdate.getTime()>edate.getTime()) {
        console.log("curdate > edate");
        console.log(curdate+"   "+edate);
        msg[0].msg+="Election has expired";
        console.log("Election has expired");
        res.render("home",{msg: msg});
        callback(new Error('error'));
      }

      else {
        console.log("unexpected error");
        msg[0].msg+="Error Occured";

        res.render("home",{msg: msg});
        callback(new Error('error'));
      }
    },

    function generatingandmailing(callback) {
     	 	console.log("log :generatingandmailing(callback)");
     	 	//generarting password for logginedvoter
      	var gpassword = generator.generate({
			length: 12, // defaults to 10
			numbers: true,
			symbols: '!@#$%&*',
			uppercase: true,
			strict: true
			});//ends generation .password is in variable password
			console.log(gpassword);


      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'webappprojectevoting@gmail.com',
          pass: 'DghhFf_-7rfD(6'
        }
      });

      var mailOptions = {
        from: 'webappprojectevoting@gmail.com',
        to: '',
        subject: 'voting credentials',
        text: ``
      };
      str='voter ID: ';

      str+=req.body.verify_id;
        str+='\nYour password for ';
       str+=req.body.ename;  str+=' election is '; str+=gpassword;
      str+=' \n Combo of your voter id and password can be used to log in for casting vote on '; str+=edate;
      str+=" from: "; str+=estime; str+=' to :'; str+=ectime; str+='.\n\n\t THANKYOU';
      mailOptions.text=str;
      var mail=usermail;
      mailOptions.to=mail;
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          res.send("error. cannot send mail");
          console.log("error!... cannot send mail");
          callback(new Error('error'));
        } else {
          newpass=gpassword;
          console.log('Email sent: ' + info.response);
          callback();
        }
      });

    },
    function hashing_pass(callback){
      console.log("log: hashing_pass");
      const saltRounds = 10;
      const plainTextPassword1 =newpass;
      console.log("npass before hash: "+newpass);
      bcrypt
            .hash(plainTextPassword1, saltRounds)
            .then(hash => {
                          console.log(`Hash for new pass : ${hash}`);
                          hashed_vpass=hash;
                          console.log("hashed_npass : "+hashed_vpass);
                          callback();
                          })
            .catch(err =>{ console.log("errrrrror in becrypt");
                            res.send("error");
                            callback(new Error('async error ')); console.error(err.message)
                        });
     },
    function update_password_on_db(callback) {
            console.log("log update_password_on_db");
            console.log(newpass+" eid : "+eid);
          //need to check whether password is already generated,for security reason,if not a man can obtain possible password
    			db.run('UPDATE voter_slist SET password=?, verification_status="verified" WHERE v_ID = ? AND election_id=?', [hashed_vpass,req.body.verify_id,eid], function(err){
          		if(err){
            				res.send("FAILED TO OBTAIN PASSWORD");
            				console.log("password not updated to database. tryout after sometime");
            				callback(err);
            				return console.error(err.message);
          				}
                  console.log("password updated to db");
                  msg[0].msg+="Password will be  send to your mail";
                  res.render("home",{msg: msg});

          				callback();
       	 		});
      	}
     ], function(err) {
    if (err) {
        //Handle the error in some way. Here we simply throw it
        //Other options: pass it on to an outer callback, log it etc.
        console.log(" async disturbed in between");
    }
    console.log('async for verification page worked ');
});

new_credentials=[{vid: '',vpass: ''}];

});


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



server.listen(4000,function(){
    console.log("Server listening on port: 4000");
 });
