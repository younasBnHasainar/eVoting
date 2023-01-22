
console.log("entered");

function openCity(evt, cityName) {
  var i, tabcontent, tablinks;
  console.log("infunction");
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}





document.addEventListener('DOMContentLoaded', ()=>{
  //for tab navigation
  let tablinks=document.querySelectorAll(".tablinks"); //fetch all tablink elements as an array
  tablinks.forEach((tablink)=>{
    tablink.addEventListener("click",(e)=>{
      if(tablink.id === "adminhome"){
        openCity(e,'Result');
        }
      /*  else if(tablink.id === "voter_reg"){
        openCity(e,'Voter Reg');
      }*/
        else if(tablink.id === "change_pass"){
        openCity(e,'Change Password');
        }
      /*  else if(tablink.id === "add_cand"){
        openCity(e,'Add Canidate');
      }*/
        else if(tablink.id === "elec_mana"){
        openCity(e,'Election management');
        }
      /*  else if(tablink.id === "result"){
        openCity(e,'Result');
      }*/
    })
  }) //for each close

//for text field hide and visible based on radio button in new election form
const emoderadio1 = document.querySelector('.emoderadio1');
const emoderadio2 = document.querySelector('.emoderadio2');
const emoderadio3 = document.querySelector('.emoderadio3');
const areabox = document.querySelector('#rreano');
const posbox = document.querySelector('#pposno');

// new election ids
const newelection_form = document.querySelector('#newelection_form');
const errorElement = document.getElementById('error1')
const eid_ne = document.querySelector('#eid_ne');
const epass_ne = document.querySelector('#epass_ne');
const ename_ne = document.querySelector('#ename_ne');
const edate_ne = document.querySelector('#edate_ne');
const estime_ne = document.querySelector('#estime_ne');
const ectime_ne = document.querySelector('#ectime_ne');

//obtain result form ids
const obtain_result_form=document.querySelector('#obtain_result_form');
const errorElement2 = document.getElementById('error2')
const eid_or=document.querySelector('#eid_or');
const epass_or=document.querySelector('#epass_or');
const ecrpass_or=document.querySelector('#ecrpass_or');
//change_password form  ids
const change_pass_form=document.querySelector('#change_pass_form');
const errorElement3 = document.getElementById('error3')
const admid_cpf=document.querySelector('#admid_cpf');
const crpass_cpf=document.querySelector('#crpass_cpf');
const npass_cpf=document.querySelector('#npass_cpf');
const cnpass_cpf=document.querySelector('#cnpass_cpf');

//gotoreg_form ids
const gotoreg_form=document.querySelector('#gotoreg_form');
const errorElement4 = document.getElementById('error4')
const eid_gtr=document.querySelector('#eid_gtr');

//enable_election form ids
const enabledisable_form=document.querySelector('#enabledisable_form');
const errorElement5 = document.getElementById('error5')
const eid_edsb=document.querySelector('#eid_edsb');
const epass_edsb=document.querySelector('#epass_edsb');
const ecpass_edsb=document.querySelector('#ecpass_edsb');

//event listener for text hide and visible as emode radio
emoderadio1.addEventListener('click', e => {
  areabox.style.visibility="visible";
  console.log("hided pos");
  posbox.style.visibility="hidden";
 console.log("iam radio one");
  console.log(emoderadio1.checked);
});
emoderadio2.addEventListener('click', e => {
  console.log("not hided");
  areabox.style.visibility="visible";
  posbox.style.visibility="visible";
 console.log("iam radio two");
});
emoderadio3.addEventListener('click', e => {
  areabox.style.visibility="hidden";
  console.log("hided area");
  posbox.style.visibility="visible";
 console.log("iam radio three");

});






//new election form validation
  newelection_form.addEventListener('submit', (e) => {
    let messages = [];


    if(eid_ne.value.length <= 5){
      messages.push('Election ID must be longer than 5 charecters')
    }
    if(epass_ne.value.length <= 5){
      messages.push('Password must be longer than 5 charecters')
    }
    if(ename_ne.value.length <= 5){
      messages.push('Election name must be longer than 5 charecters')
    }

//checking area pos nos ,required,whther integer???
    let areacount=parseInt(areabox.value);
    let poscount=parseInt(posbox.value);
    if(emoderadio1.checked){
      console.log("checked emoderadio1");

      if (areabox.value === '' || areabox.value == null || areabox.value == 0) {

        messages.push('No: of Areas required')

      }
      else if(!Number.isInteger(areacount)){
        //console.log(areabox.value);
        //console.log(Number.isInteger(8));
        messages.push('No: of Areas must be an integer value')
      }
      else if(Number.isInteger(areacount)){
        if(areacount<=8){console.log("valid no for area range");}
        else {
          messages.push('No: of Areas must be in range 8')
        }
      }
    }
    else if (emoderadio2.checked) {
      console.log("checked emoderadio2");
      if (areabox.value === '' || areabox.value == null || areabox.value == 0) {

        messages.push('No: of Areas required')

      }
      else if(!Number.isInteger(areacount)){
        messages.push('No: of Areas must be an integer value')
      }
      else if(Number.isInteger(areacount)){
        if(areacount<=8){console.log("valid no for area range");}
        else {
          messages.push('No: of Areas must be in range 8')
        }
      }

      if (posbox.value === '' || posbox.value == null || posbox.value == 0) {

        messages.push('No: of Positions required')

      }

      else if(!Number.isInteger(poscount)){
        messages.push('No: of Positions must be an integer value')
      }
      else if(Number.isInteger(poscount)){
        if(poscount<=8){console.log("valid no for position range");}
        else {
          messages.push('No: of Positions  must be in range 8')
        }
      }
    }
    else if (emoderadio3.checked) {
        console.log("checked emoderadio3");
        if (posbox.value === '' || posbox.value == null || posbox.value == 0 ) {

          messages.push('No: of Positions required')

        }
        else if(!Number.isInteger(poscount)){
          messages.push('No: of Positions must be an integer value')
        }
        else if(Number.isInteger(poscount)){
          if(poscount<=8){console.log("valid no for position range");}
          else {
            messages.push('No: of Positions  must be in range 8')
          }
        }
    }

//date check
let curdate=new Date();
let curhour =curdate.getHours();
curhour=String(curhour);
if(curhour.length==1){curhour='0'; curhour+=curdate.getHours();}
let curminute=curdate.getMinutes();
curminute=String(curminute);
if(curminute.length==1){curminute='0'; curminute+=curdate.getMinutes();}
let curtime=curhour+":"+curminute;
console.log("current time : "+curtime);

let curyear=curdate.getFullYear();
let curmonth=curdate.getMonth();
curmonth+=1; //we have to add 1 ,to get actual month value
let curday=curdate.getDate();
console.log("cur separate values: "+curyear+" "+curmonth+" "+curday);

let inputedate=new Date(edate_ne.value);

 let ieyear=inputedate.getFullYear();
 let iemonth=inputedate.getMonth();
 iemonth+=1; //we have to add 1 ,to get actual month value
 let ieday=inputedate.getDate();
 console.log("input election date  separate values: "+ieyear+" "+iemonth+" "+ieday);


//election date valid check conditions and estime check
 if(curyear==ieyear){
   console.log("");
   if(curmonth==iemonth){
      if(curday==ieday){
        if(estime_ne.value<=curtime){
          messages.push('Invalid election date') //actually ,time not valid for date
        }
        else if(estime_ne.value>curtime){
          console.log("valid time even though edate is today");
        }
        else {
          console.log("unexpected condition while checking estime for edate today");
        }
      }
      else if (curday<ieday) {
        console.log("valid election date ");
      }
      else {
       messages.push('Invalid election date')
      }
   }
   else if (curmonth<iemonth) {
     console.log("valid election date ");
   }
   else {
      messages.push('Invalid election date')
   }
 }
 else if(curyear<ieyear){
   console.log("valid election date");
 }
 else {
   messages.push('Invalid election date')
 }

//estime , ectime check
if(estime_ne.value<ectime_ne.value){
  console.log("valid election times");
}
else {
  messages.push('Invalid election time intervals')
}

//verification_date check
let inputvdate=new Date(vdate_ne.value);
let ivyear=inputvdate.getFullYear();
let ivmonth=inputvdate.getMonth();
ivmonth+=1; //we have to add 1 ,to get actual month value
let ivday=inputvdate.getDate();
//verification date check with curdate
if(curyear==ivyear){
  if(curmonth==ivmonth){
     if(curday==ivday){
       console.log("verification date is valid with curdate");
     }
     else if (curday<ivday) {
       console.log("verification date is valid with curdate ");
     }
     else {
      messages.push('Invalid verification date')
     }
  }
  else if (curmonth<ivmonth) {
    console.log("verification date is valid with curdate ");
  }
  else {
     messages.push('Invalid verification date')
  }
}
else if(curyear<ivyear){
  console.log("verification date is valid with curdate");
}
else {
  messages.push('Invalid verification date')
}

// verification date check with election date
if(inputvdate<=inputedate){

  console.log("valid verfication date for election date");
}
else {
  messages.push('Invalid verification date')
}

    if (messages.length > 0) {
      e.preventDefault()
      //msg.innerHTML = messages.join(', ')
      console.log("message.length=  "+messages.length);
      errorElement.innerHTML = messages.join(', ')
      //setTimeout(() => errorElement.remove(), 3000);
    //errorElement.innerText = messages.join(', ')
    }
    else {
      console.log("message.length=  "+messages.length);
    }



  });

  obtain_result_form.addEventListener('submit', (e) => {
    console.log("obtain result js validity check");
    let messages2 = [];
    if(eid_or.value.length <= 5){
      messages2.push('Invalid Election ID ')
    }
    if(epass_or.value.length <= 5){
      messages2.push('Invalid Password')
    }
    if(ecrpass_or.value.length <= 7){
      messages2.push('Invalid encryption password ')
    }

    if (messages2.length > 0) {
      e.preventDefault()
      //msg.innerHTML = messages.join(', ')
      console.log("message2.length=  "+messages2.length);
      errorElement2.innerHTML = messages2.join(', ')
      //setTimeout(() => errorElement.remove(), 3000);
    //errorElement.innerText = messages.join(', ')
    }
    else {
      console.log("message2.length=  "+messages2.length);
    }



  });

    change_pass_form.addEventListener('submit', (e) => {
      console.log(" js validity check");
      let messages3 = [];
      if(admid_cpf.value.length<=6){
        console.log("admin less than 6,invalid");
        messages3.push('Invalid ID')
      }
      if(crpass_cpf.value.length<=6){
        console.log("password less than 6,invalid");
        messages3.push('Invalid Password')
      }
      if(npass_cpf.value!=cnpass_cpf){

        messages3.push(' Password do not match')
      }
      if(npass_cpf.value.length<=6){
        console.log("password must be greater than 6,invalid");
        messages3.push('Invalid New Password(should be greater than 6)')
      }


      if (messages3.length > 0) {
        e.preventDefault()
        //msg.innerHTML = messages.join(', ')
        console.log("message3.length=  "+messages3.length);
        errorElement3.innerHTML = messages3.join(', ')
        //setTimeout(() => errorElement.remove(), 3000);
      //errorElement.innerText = messages.join(', ')
      }
      else {
        console.log("message3.length=  "+messages3.length);
      }

    });

    gotoreg_form.addEventListener('submit', (e) => {
      console.log("gotoreg_form js validity check");
      let messages4 = [];
      if(eid_gtr.value.length<=5){
        console.log("eid must be greater than 5,invalid");
        messages4.push('Invalid ID')
      }
      if(epass_gtr.value.length<=5){
        console.log("epass must be greater than 5,invalid");
        messages4.push('Invalid password')
      }

      if (messages4.length > 0) {
        e.preventDefault()
        //msg.innerHTML = messages.join(', ')
        console.log("message4.length=  "+messages4.length);
        errorElement4.innerHTML = messages4.join(', ')
        //setTimeout(() => errorElement.remove(), 3000);
      //errorElement.innerText = messages.join(', ')
      }
      else {
        console.log("message4.length=  "+messages4.length);
      }

    });

    enabledisable_form.addEventListener('submit', (e) => {
      console.log("enabledisable_form js validity check");
      let messages5 = [];
      if(eid_edsb.value.length <= 5){
        messages5.push('Invalid Election ID ')
      }
      if(epass_edsb.value.length <= 5){
        messages5.push('Invalid Password')
      }
      if(ecpass_edsb.value.length <= 7){
        messages5.push('Encryption must be longer than 7 ')
      }
      if (messages5.length > 0) {
        e.preventDefault()
        //msg.innerHTML = messages.join(', ')
        console.log("message5.length=  "+messages5.length);
        errorElement5.innerHTML = messages5.join(', ')
        //setTimeout(() => errorElement.remove(), 3000);
      //errorElement.innerText = messages.join(', ')
      }
      else {
        console.log("message5.length=  "+messages5.length);
      }

    });

},false);   //dom close
