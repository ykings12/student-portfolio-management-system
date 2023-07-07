const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

const port = process.env.PORT || 3000;

// Set up MySQL database connection
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'se'
// });

// connection.connect((err) => {
//   if (err) throw err;
//   console.log('Connected to MySQL database!');
// });
var connection=mysql.createConnection({
  host:'localhost',
  port: '3307',
  user:'root',
  password:'',
  database:'final'
});

connection.connect();
// connection.connect(function(error){
//   if(!!error){
//     console.log(error);
//   }else{
//     console.log('Connected!:)');
//   }
// });

// Set up session middleware
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs')
// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Set up static files directory
app.use(express.static('public'));

// Define routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
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
          res.redirect('/');
        }
      });
    }
  });
});

app.get('/dashboard', (req, res) => {
  if (req.session.user) {
    res.sendFile(__dirname + '/public/dashboard.html');
  } else {
    res.redirect('/');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
