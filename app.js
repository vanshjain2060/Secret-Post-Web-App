// jshint esversion : 6
require("dotenv").config();
// to use just type : process.env."variable_name" and you will get the access to the variable
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const salRound = 10;

const app = express();
app.set("view engine" , "ejs");

app.use(bodyParser.urlencoded({extended : true}));

app.use(express.static("public"));

// // Connect to MongoDB
const dbURI = "mongodb://localhost:27017/userDB";
mongoose.connect(dbURI, { useNewUrlParser: true});


const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

const User = new mongoose.model("User", userSchema);


app.get("/" , function(req, res){
    res.render("home");
});

app.get("/login" , function(req, res){
    res.render("login");
});

app.get("/register" , function(req, res){
    res.render("register");
});

// const bcrypt = require('bcryptjs'); // Ensure bcryptjs is required

app.post("/register", async function(req, res){
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, salRound);

        const newUser = new User({
            email : req.body.username,
            password : hashedPassword
        });

        await newUser.save();
        res.render("secrets");
    } catch (error) {
        console.error(error);
        res.status(500).send("Some Error Occured");
    }
});


app.post("/login", async function(req, res){
    const username = req.body.username;
    const password = req.body.password; // No need to hash the password here

    User.findOne({email : username})
       .then(async (doc) => { // Note: added async to handle bcrypt.compare
            if (!doc ||!doc._id) {
                return res.status(500).send("No User Found.");
            } else {
                // Correctly compare the plaintext password with the hashed password
                const match = await bcrypt.compare(password, doc.password);
                if(match) {
                    res.render("secrets");
                } else {
                    res.send("Invalid User Name or Password");
                }
            }
        })
});



app.listen(3000, function() {
    console.log("Server Started on port 3000");
});