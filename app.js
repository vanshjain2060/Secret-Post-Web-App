// jshint esversion : 6
require("dotenv").config();
// to use just type : process.env."variable_name" and you will get the access to the variable
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.use(session({
    secret : "this is our secret", 
    resave : false,
    saveUninitialized : false 
}));
app.use(passport.initialize());
app.use(passport.session());


// // Connect to MongoDB
const dbURI = "mongodb://localhost:27017/userDB";
mongoose.connect(dbURI, { useNewUrlParser: true});
// mongoose.set("useCreateInder", true);

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/" , function(req, res){
    res.render("home");
});

app.get("/login" , function(req, res){
    res.render("login");
});

app.get("/register" , function(req, res){
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout((err) =>{
        if(err) {
            return res.status(500).send("An error occurred during logout");
        }
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