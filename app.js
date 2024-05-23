// jshint esversion : 6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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

// code which is responsible for the encryption of the data feilds
const secret = "this is my secret which is goint to be used for the encryption process";
userSchema.plugin(encrypt, {secret:secret , encryptedFields:["password"] });

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

app.post("/register", function(req, res){
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    newUser.save()
       .then((doc) => { // Assuming doc represents the saved document
            if (!doc ||!doc._id) {
                return res.status(500).send("Error saving user.");
            }
            res.render("secrets");
        })
       .catch((err) => {
            console.error(err); // Log the error for debugging purposes
            res.status(500).send("Some Error Occured");
        });
});

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email : username})
        .then((doc) => {
            if (!doc ||!doc._id) {
                return res.status(500).send("No User Found.");
            } else {
                if(doc.password === password) {
                    res.render("secrets");
                }else if(doc.password !== password) {
                    res.send("Invalid User Name or Password");
                }
            }
        })
        .catch((err) =>{
            res.status(500).send("No User Found.")
        })
});


app.listen(3000, function() {
    console.log("Server Started on port 3000");
});