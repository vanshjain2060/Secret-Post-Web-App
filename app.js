// jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
// mongoose.set("useCreateIndex" , true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// passport.deserializeUser(async (id, done) => {
//   try {
//       const user = await User.findById(id);
//       done(null, user);
//   } catch (err) {
//       done(err, null);
//   }
// });
passport.deserializeUser(function(id, done) {
  User.find({ _id: id })
    .then(user => {
      done(null, user[0]);
    })
    .catch(err => {
      done(err);
    });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({googleId:profile.id}, function(err, user){
      return cb(err, user);
    });
  }
));
// passport.use(new GoogleStrategy({
//   clientID: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: "http://localhost:3000/auth/google/secrets",
//   userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
// },
// async (accessToken, refreshToken, profile, cb) => {
//   try {
//     const user = await User.findOne({ googleId: profile.id });
//     if (!user) {
//       // If the user isn't found in the database, create a new user
//       const newUser = await User.create({ googleId: profile.id });
//       return cb(null, newUser);
//     }
//     // If the user is found, return the user
//     return cb(null, user);
//   } catch (err) {
//     return cb(err);
//   }
// }
// ));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });
  
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  User.find({ "secret": { $ne: null } }).then(foundUsers => {
    if (foundUsers) {
      res.render("secrets", { usersWithSecrets: foundUsers });
    }
  }).catch(err => console.error(err));
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  User.findById(req.user.id).then(foundUser => {
    if (foundUser) {
      foundUser.secret = submittedSecret;
      foundUser.save().then(() => {
        res.redirect("/secrets");
      }).catch(err => console.error(err));
    }
  }).catch(err => console.error(err));
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

app.post("/register", async function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.register({username : username}, password, function(err, user) {
      if(err) {
          console.log(err);
          res.redirect("/register"); // Redirect back to the registration page if there's an error
      } else {
          // Upon successful registration, log the user in and redirect to the secret page
          passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets");
          });
      }
  });
});



app.post("/login", async function(req, res){
  const username = req.body.username;
  const password = req.body.password; 

  const user = new User ({
      username : username, 
      password : password
  })

  req.login(user, function(err) {
      if(err) console.log(err);
      else {
          passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets");
          });
      }
  }) 
});



app.listen(process.env.PORT || 3000, function() {
  console.log("Server Started on port 3000");
});