const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const app = express();

// const path = require("path"); 

const port = process.env.PORT || 3000;

// Set up MySQL database connection
// const connection = mysql.createConnection({
//   host: 'localhost',
//   port: '3307',
//   user: 'root',
//   password: '',
//   database: 'se'
// });
var connection=mysql.createConnection({
  host:'localhost',
  port: '3307',
  user:'root',
  password:'',
  database:'final'
});
// connection.connect();

// connection.connect(function(error){
//   if(!!error){
//     console.log(error);
//   }else{
//     console.log('Connected!:)');
//   }
// });



app.set('view engine', 'ejs')
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

// Set up session middleware
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true
}));




// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Set up static files directory
app.use(express.static('public'));

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail.com',
  auth: {
    user: 'thedarkknightsarehere@gmail.com', // Replace with your email
    pass: 'dark@123.' // Replace with your password
  }
});

app.get('/front_page.html', (req, res) => {
  res.sendFile(__dirname + '/public/front_page.html');
});

app.get('/card.html', (req, res) => {
  res.sendFile(__dirname + '/public/card.html');
});

// app.get('/dashboard', (req, res) => {

//   res.render("dashboard")
// });
app.get('/dashboard', (req, res) => {
  const user = req.session.user;

  if (req.session.user) {
    res.render('dashboard', { user: user });
  } else {
    res.redirect('/');
  }
});


// Define routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/contact_us.html');
});

app.post('/signup', (req, res) => {
    const { name,enroll, contact, gender,city, email, password } = req.body;
  
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      if (results.length > 0) {
        return res.status(409).send('Email already registered');
      }
    
    // Encrypt the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) throw err;
  
      // Store the user in the database name, enroll, contact, gender, city, email, password
      const user = { name, enroll, contact, gender,city, email, password: hash };
      connection.query('INSERT INTO users SET ?', user, (err, result) => {
        if (err) throw err;
        console.log('User registered successfully!');
        
        res.redirect('/');
      });
    });
  });
  });





app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  // Find the user with the matching email address
  connection.query('SELECT * FROM users WHERE email = ?', email, (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      console.log('User not found!');
      res.redirect('/');
    } else {
      // Compare the stored password hash with the provided password
      const user = results[0];
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) throw err;

        if (result) {
          console.log('Login successful!');
          req.session.user = user;
          res.redirect('/dashboard');
        } else {
          console.log('Incorrect password!');
          // res.send("Sucess");
          res.redirect('/');
        }
      });
    }
  });
});

// app.get('/dashboard', (req, res) => {
//   if (req.session.user) {
//     res.sendFile(__dirname + '/public/dashboard.html');
//   } else {
//     res.redirect('/');
//   }
// });

app.get('/search_user' ,function(req,res){
  // connection.connect(function(error){
  //     if(error) console.log(error);

      var sql = "select * from users";

      connection.query(sql, function(error, result){
          if(error) console.log(error);
          // console.log(result);
          res.render(__dirname+ "/search_user", {
              student:result
          });
      });
  });
// });

app.get('/searchMe', function(req,res){

  var name = req.query.name;
  var enroll = req.query.enroll;
  var email = req.query.email;
  // var nickname = req.query.nickname;


  // connection.connect(function(error){
  //     if(error) console.log(error);
      
     
      var sql = "select * from users where name like '%"+name+"%' and enroll like '%"+enroll+"%' and email like '%"+email+"%'  ";
      connection.query(sql , function(error, result){

          if(error) console.log(error);
          res.render(__dirname+ "/search_user", {
              student:result
          });

      });

  });
// Admin page

app.get('/index.html', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.get('/edit-profile', (req, res) => {

  if (req.session.user) {
   
    res.render('edit-profile',{user:req.session.user});
  }
  });

  app.post('/edit-profile', (req, res) => {
    const { id, contact, city } = req.body;
  
    // Update the user's profile in the database
    connection.query('UPDATE users SET contact = ?, city = ? WHERE id = ?', [contact, city, id], (err, results) => {
      if (err) throw err;
  
      if (results.affectedRows > 0) {
        console.log('Profile updated successfully!');
        res.redirect('/dashboard');
      } else {
        console.log('Failed to update profile!');
        res.redirect('/edit-profile');
      }
    });
  });


app.get('/change_password', (req, res) => {
  if (req.session.user) {
    res.render('change_password', { user: req.session.user });
  }
});

app.post('/change_password', (req, res) => {
  const { id, password } = req.body;

  // Hash the new password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    // Update the user's password in the database
    connection.query('UPDATE users SET password = ? WHERE id = ?', [hash, id], (err, results) => {
      if (err) throw err;

      if (results.affectedRows > 0) {
        console.log('Password updated successfully!');
        res.redirect('/dashboard');
      } else {
        console.log('Failed to update password!');
        res.redirect('/change_password');
      }
    });
  });
});


  // app.get('/change_password', (req, res) => {

  //   if (req.session.user) {
     
  //     res.render('change_password',{user:req.session.user});
  //   }
  //   });
  
  //   app.post('/change_password', (req, res) => {
  //     const { id,password } = req.body;
    
  //     // Update the user's profile in the database
  //     connection.query('UPDATE users SET password = ? WHERE id = ?', [password, id], (err, results) => {
  //       if (err) throw err;
    
  //       if (results.affectedRows > 0) {
  //         console.log('Profile updated successfully!');
  //         res.redirect('/dashboard');
  //       } else {
  //         console.log('Failed to update profile!');
  //         res.redirect('/change_password');
  //       }
  //     });
  //   });



  app.get('/achievements', (req, res) => {

    if (req.session.user) {
     
      res.render('achievements',{user:req.session.user});
    }
    });
  
    app.post('/achievements', (req, res) => {
      const { id,name,description,github } = req.body;
    
     
      console.log(id);
      connection.query('UPDATE cgpa SET leetcode = ?,codechef=?,codeforces=? WHERE id = ?', [leetcode,codechef,codeforces,id], (err, results) => {
        if (err) throw err;
      });
    });

  app.get('/coding', (req, res) => {

    if (req.session.user) {
     
      res.render('coding',{user:req.session.user});
    }
    });
  
    app.post('/coding', (req, res) => {
      const { id,name,description,github } = req.body;
    
     
      console.log(id);
      connection.query('UPDATE cgpa SET leetcode = ?,codechef=?,codeforces=? WHERE id = ?', [leetcode,codechef,codeforces,id], (err, results) => {
        if (err) throw err;
      });
    });

  app.get('/cgpa', (req, res) => {

    if (req.session.user) {
     
      res.render('cgpa',{user:req.session.user});
    }
    });
  
    app.post('/cgpa', (req, res) => {
      const { id,name,description,github } = req.body;
    
     
      console.log(id);
      connection.query('UPDATE cgpa SET first = ?,second=?,third=?, fourth=? WHERE id = ?', [first,second,third,fourth,id], (err, results) => {
        if (err) throw err;
      });
    });



    app.get('/hobbies', (req, res) => {

      if (req.session.user) {
       
        res.render('hobbies',{user:req.session.user});
      }
      });
    
      app.post('/hobbies', (req, res) => {
        const { id,name,description,github } = req.body;
      
       
        console.log(id);
        connection.query('UPDATE hobbies SET first = ?,second=?,third=?, fourth=? WHERE id = ?', [first,second,third,fourth,id], (err, results) => {
          if (err) throw err;
        });
      });

      

      app.get('/sports', (req, res) => {

        if (req.session.user) {
         
          res.render('sports',{user:req.session.user});
        }
        });
      
        app.post('/sports', (req, res) => {
          const { id,name,description,github } = req.body;
        
         
          console.log(id);
          connection.query('UPDATE sports SET first = ?,second=?,third=?, fourth=? WHERE id = ?', [first,second,third,fourth,id], (err, results) => {
            if (err) throw err;
          });
        });


        app.get('/society', (req, res) => {

          if (req.session.user) {
           
            res.render('society',{user:req.session.user});
          }
          });
        
          app.post('/society', (req, res) => {
            const { id,name,description,github } = req.body;
          
           
            console.log(id);
            connection.query('UPDATE society SET first = ?,second=?,third=?, fourth=? WHERE id = ?', [first,second,third,fourth,id], (err, results) => {
              if (err) throw err;
            });
          });
  

        
    app.get('/project', (req, res) => {

      if (req.session.user) {
       
        res.render('project',{user:req.session.user});
      }
      });
    
      app.post('/project', (req, res) => {
        const { id,name,description,github } = req.body;
      
        // Update the user's profile in the database
        console.log(id);
        connection.query('UPDATE projects SET name = ?,description=?,github=? WHERE id = ?', [name ,description,github,id], (err, results) => {
          if (err) throw err;
      
        //   if (results.affectedRows > 0) {
        //     console.log('Project Details updated successfully!');
        //     res.redirect('/dashboard');
        //   } else {
        //     console.log('Failed to update data!');
        //     res.redirect('/project');
        //   }
        });
      });
  

// Assuming you have Express and EJS set up

// app.get('/edit-profile', function(req, res) {
//   // Retrieve user data from your data source (e.g., a database)
//   var user = {
//     id: 123,
//     contact: 'example@example.com',
//     city: 'New York'
//   };
//   // console.log

//   res.render('edit-profile', { user: user });
// });



app.get('/front_page', (req, res) => {
  res.sendFile(__dirname + '/front_page');
});

app.post('/signupadmin', (req, res) => {
    const { name, contact,  email, password } = req.body;
  
    connection.query('SELECT * FROM admin WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      if (results.length > 0) {
        return res.status(409).send('Email already registered');
      }
    
    // Encrypt the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) throw err;
  
      // Store the user in the database name, enroll, contact, gender, city, email, password
      const user = { name, contact,  email, password: hash };
      connection.query('INSERT INTO admin SET ?', user, (err, result) => {
        if (err) throw err;
        console.log('Admin registered successfully!');
        
        res.redirect('/admin.html');
      });
    });
  });
  });





app.post('/signinadmin', (req, res) => {
  const { email, password } = req.body;

  // Find the user with the matching email address
  connection.query('SELECT * FROM admin WHERE email = ?', email, (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      console.log('User not found!');
      res.redirect('/admin.html');
    } else {
      // Compare the stored password hash with the provided password
      const user = results[0];
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) throw err;

        if (result) {
          console.log('Login successful!');
          req.session.user = user;
          res.redirect('/admin_home');
        } else {
          console.log('Incorrect password!');
          // res.send("Sucess");
          res.redirect('/admin.html');
        }
      });
    }
  });
});

//contact us
// Handle form submission
app.post('/contact', (req, res) => {
  const fullName = req.body.fullName;
  const email = req.body.email;
  const message = req.body.message;

  // Insert the form data into the "contact" table
  const query = `INSERT INTO contact (fullName, email, message) VALUES (?, ?, ?)`;
  connection.query(query, [fullName, email, message], (err, result) => {
    if (err) {
      console.error('Error inserting data into the table: ', err);
      // Render an error page or redirect to an error URL
      // res.render('error');
      // return;
    }
    // Render a success page or redirect to a success URL
    // res.render('Your resp')
    res.redirect('/contact_us.html');
    // res.send('Its Done');
    // res.send('<script>alert("It\'s done");</script>');

  });
});


// admin main 


app.get('/admin_home' ,function(req,res){
  // connection.connect(function(error){
  //     if(error) console.log(error);

      var sql = "select * from users";

      connection.query(sql, function(error, result){
          if(error) console.log(error);
          // console.log(result);
          res.render(__dirname+ "/admin_home", {
              student:result
          });
      });
  });
// });


app.get('/delete-student', function(req, res){
  // connection.connect(function(error){
  //     if(error) console.log(error);

      var sql = "delete from users where id = ?";
      var id = req.query.id;
      console.log(id)
      connection.query(sql,[id], function(error, result){
          if(error) console.log(error);
          // console.log(result);
          res.redirect('/admin_home');
      });
  });
// }); 

app.get('/update-student', function(req, res){
  // connection.connect(function(error){
  //     if(error) console.log(error);

      var sql = "select * from users where id = ?";
      var id = req.query.id;
      connection.query(sql,[id], function(error, result){
          if(error) console.log(error);
          // console.log(result);
          res.render(__dirname+ "/update-student", {
              student:result
          });
      });
  });
// }); 

app.post('/update-student', function(req,res){
  // console.log(req.body);
  var name = req.body.name;
  var enroll = req.body.enroll;
  var email = req.body.email;
  var contact = req.body.contact;
  var gender = req.body.gender;
  var city = req.body.city;
  var id = req.body.id;

  // connection.connect(function(error){
  //     if(error) console.log(error);
      
     
      var sql = "UPDATE users set name = ?, enroll = ?, contact = ?, gender = ?, city = ?, email = ?  where id = ? ";
      connection.query(sql , [ name, enroll,contact, gender, city, email, id], function(error, result){

          if(error) console.log(error);
          res.redirect('/admin_home');

      });

  });
// }); 

app.get('/search-students' ,function(req,res){
  // connection.connect(function(error){
  //     if(error) console.log(error);

      var sql = "select * from users";

      connection.query(sql, function(error, result){
          if(error) console.log(error);
          // console.log(result);
          res.render(__dirname+ "/admin_home", {
              student:result
          });
      });
  });
// });

app.get('/search', function(req,res){

  var name = req.query.name;
  var enroll = req.query.enroll;
  var email = req.query.email;
  // var nickname = req.query.nickname;


  // connection.connect(function(error){
  //     if(error) console.log(error);
      
     
      var sql = "select * from users where name like '%"+name+"%' and enroll like '%"+enroll+"%' and email like '%"+email+"%'  ";
      connection.query(sql , function(error, result){

          if(error) console.log(error);
          res.render(__dirname+ "/admin_home", {
              student:result
          });

      });

  });

//  admin end


// API endpoint for retrieving profile data
app.get('/view_profile', (req, res) => {
  // Simulating the retrieval of profile data from a database or API
  const profileData = {
    name: 'Shivam',
    email: 'shivu@gmail.com',
    bio: 'I am a web developer.',
    image: 'profile.jpg'
  };
  
  res.json(profileData);
});



app.get('/dashboard', (req, res) => {
    if (req.session.user) {
      ejs.renderFile(__dirname + '/public/dashboard.ejs', (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(data);
        }
      });
    } else {
      res.redirect('/');
    }
  });



  app.post('/dashboard_admin', (req, res) => {
    var student_id=req.body.student_id;
    var details=connection.query('SELECT * FROM users WHERE id = ?', [student_id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      
    })
      console.log(details[0]);
      console.log(student_id);
      res.render('dashboard',{user:details[0]})
    
  });



app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
    });


    

// app.post('/forgot-password', (req, res) => {
//     const { email } = req.body;
//     function generatePassword() {
//         const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//         let password = "";
//         for (let i = 0; i < 10; i++) {
//           password += charset[Math.floor(Math.random() * charset.length)];
//         }
//         return password;
//       }
  
//     // Find the user with the matching email address
//     connection.query('SELECT * FROM users WHERE email = ?', email, (err, results) => {
//       if (err) throw err;
  
//       if (results.length === 0) {
//         console.log('User not found!');
//         res.redirect('/forgot-password');
//       } else {
//         // Generate a new password
//         const newPassword = generatePassword();
  
//         // Encrypt the new password
//         bcrypt.hash(newPassword, 10, (err, hash) => {
//           if (err) throw err;
  
//           // Update the user's password in the database
//           connection.query('UPDATE users SET password = ? WHERE email = ?', [hash, email], (err, result) => {
//             if (err) throw err;
//             console.log('Password reset successful!');
            
//             // Send the new password to the user's email address
//             const mailOptions = {
//               from: 'thedarkknightsarehere@gmail.com',
//               to: email,
//               subject: 'Password Reset',
//               text: `Your new password is ${newPassword}. Please log in with this password and change it as soon as possible.`
//             };
            
//             transporter.sendMail(mailOptions, (error, info) => {
//               if (error) {
//                 console.log(error);
//               } else {
//                 console.log('Email sent: ' + info.response);
//               }
//             });
  
//             res.redirect('/');
//           });
//         });
//       }
//     });
//   });
//   app.get('/reset-password', (req, res) => {
//     res.render('reset-password');
//     });
    
//     app.post('/reset-password', (req, res) => {
//     const { password } = req.body;
//     const { resetToken } = req.session;
    
//     // Check if a reset token has been set
//     if (!resetToken) {
//     console.log('No reset token found!');
//     return res.redirect('/forgot-password');
//     }
    
//     // Verify the reset token
//     jwt.verify(resetToken, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//     console.log('Invalid reset token!');
//     return res.redirect('/forgot-password');
//     }
//     // Update the password for the user with the matching email address
// const { email } = decoded;
// bcrypt.hash(password, 10, (err, hash) => {
//   if (err) throw err;

//   connection.query('UPDATE users SET password = ? WHERE email = ?', [hash, email], (err, result) => {
//     if (err) throw err;
//     console.log('Password reset successfully!');
//     res.redirect('/');
//   });
// });

// });
// });





//Forgot Password
// const router=express.Router();
const jwt = require("jsonwebtoken");
// const transport = require("../mailer/mailsend");
const JWT_SECRET = "yash";
var password_from_database;
var email_from_database;
var enrollment;

var transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "iit2021113@iiita.ac.in",
    pass: "parwez321@",
  },
});

//route 1
//forget password authentication

// app.get("/forgot-password", async (req, res, next)=>{
//       res.render("forgot-password");
// });
app.post("/forgot-password", async (req, res, next) => {
  const email = req.body.email;

  //  res.send(email);

  console.log(email);

  var sql = `select  enroll,  email ,password from users where email='${email}';`;
  connection.query(sql, function (err, result) {
    if (err) {
      console.log(err);

      console.log("user not registered");
      req.flash("message", "user not registered");
      res.redirect("login");
    } else {
      console.log(result);
      email_from_database = result[0].email;
      password_from_database = result[0].password;
      enrollment = result[0].enroll;
      console.log(enrollment);
      // console.log(password_from_database);

      // console.log(email_from_database);
      if (email != email_from_database) {
        res.send("user not exist");
        return;
      }
      //since the user exist so we will generate ontime time link which will be valid for 15 minutes
      const secret = JWT_SECRET + password_from_database;
      const payload = {
        id: enrollment,
        email: email_from_database,
      };
      const token = jwt.sign(payload, secret, { expiresIn: "15m" });
      const link = `http://localhost:5000/reset-password/${enrollment}/${token}`;
      console.log(email);
      var mailOptions = {
        from: "iit2021113@iiita.ac.in",
        to: `"${email}"`,
        // to:"iit2021165@iiita.ac.in",
        subject: "forgot password",
        text: `reset password link ===>${link}`,
      };
      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log("invalid email error");
          // console.log(error);
          res.render("forgot-password");
        } else {
          console.log("email has been sent", info.response);
          res.render("forgot-password");
        }
      });
    }
  });
});

// setting the new password

//route 2

app.get("/reset-password/:id/:token", async (req, res, next) => {
  const { id, token } = req.params;
  // console.log(token);

  //  console.log(id);
  if (id != enrollment) {
    res.send("invalid");
    return;
  }

  const secret = JWT_SECRET + password_from_database;

  try {
    const payload = jwt.verify(token, secret);
    res.render("reset-password", { id: id, token: token });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
});

app.post("/reset-password/:id/:token", async (req, res, next) => {
  const id = req.params.id;
  const token = req.params.token;

  const password = req.body.password;
  const confirm_password = req.body.confirm_password;
  console.log(confirm_password);
  console.log(enrollment);
  //  console.log('h');
  console.log(id);
  // console.log(enrollment);

  if (id != enrollment) {
    res.send("invalid");
    return;
  }
  // console.log("h");

  if (password != confirm_password) {
    res.send("enter correct password");
    return;
  }

  const secret = JWT_SECRET + password_from_database;
  try {
    //passwrod and confirm password should match
    // here we can simply find the user with the payload and finally update the passwrod
    //always hash the password;
    const payload = jwt.verify(token, secret);

    console.log("hello");

    var sql = `update student set password='${confirm_password}' where enroll='${enrollment}'`;

    connection.query(sql, function (err, result) {
      if (err) {
        res.send(err.message);
      } else {
        res.send("password changed successfully");
      }
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
});

  // Start the server
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  
