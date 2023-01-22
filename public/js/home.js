
document.addEventListener('DOMContentLoaded', ()=>{


  //voter login
  const voter_login=document.querySelector('#voter_login');
  const errorElement = document.getElementById('error1')
  const id_vl = document.querySelector('#vl_id');
  const pass_vl = document.querySelector('#vl_pass');
  //voter verfication
  const voter_verification=document.querySelector('#voter_verification');
  const errorElement2 = document.getElementById('error2')
  const id_vf = document.querySelector('#vf_id');



  //voter login form validation
    voter_login.addEventListener('submit', (e) => {
      let messages = [];
      if(id_vl.value.length <= 5){
        messages.push('Invalid ID')
      }
      if(pass_vl.value.length <= 10){
        messages.push('Invalid Password')
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

    //voter login form validation
      voter_verification.addEventListener('submit', (e) => {
        console.log('voterverification');
        let messages2 = [];
        if(id_vf.value.length <= 5){
          messages2.push('Invalid ID')
          console.log("invalid id");
        }


        if (messages2.length > 0) {
          e.preventDefault()
          console.log("hindered");
          
          //msg.innerHTML = messages.join(', ')
          console.log("message.length=  "+messages2.length);
          errorElement2.innerHTML = messages2.join(', ')
          //setTimeout(() => errorElement.remove(), 3000);
        //errorElement.innerText = messages.join(', ')
        }
        else {
          console.log("message.length=  "+messages.length);
        }

      });


},false);   //dom close
