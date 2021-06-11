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





server.listen(2500,function(){
    console.log("Server listening on port: 2500");
 });
