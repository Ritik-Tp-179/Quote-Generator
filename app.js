const express = require("express")
const app = express()
const ejs = require("ejs")
const bodyparser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const LocalStrategy = require("passport-local").Strategy

//configure the app
app.set("view engine", "ejs")
app.use(bodyparser.urlencoded({ extended: true }))
app.use(session({ 
    secret: "my-little-secret",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

//connect the mongoDB
mongoose.connect("mongodb://127.0.0.1:27017/quotedb", { useNewUrlParser: true })

const quoteSchema = new mongoose.Schema({
    id: Number,
    quote: String,
    author: String,
})
const Quote = mongoose.model("Quote", quoteSchema)

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
})
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema)

//define passport local stretegy
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.name });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

const quotetype = mongoose.Schema({
    type: String,
    description: String,
    quotess: [quoteSchema]
})
const QuoteType = mongoose.model("QuoteType", quotetype)

// Routes
// *********************************************** Main **************************************************
app.route("/")
    .get((req, res) => {
        res.render("main")
    })

// ********************************************** Register ************************************************* 
app.route("/register")
    .get((req, res) => {
        res.render("register")
    })
    .post((req, res) => {
        console.log(req.body)

        User.register({ username: req.body.username, email: req.body.email }, req.body.password).then(user => {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/quote")
            })
        }).catch(err => {
            if (err) {
                console.log(err)
                res.redirect("/register")
            }
        })
    })


// ******************************************** Login *****************************************************
app.route("/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        console.log(req.body)
        const user = new User({
            email: req.body.email,
            password: req.body.password
        })
        req.login(user, function (err) {
            if (err) { return next(err); }
            res.redirect("/quote");
        });
        console.log(req.body)
    })


app.route("/quote")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            const randomCount = Math.floor(Math.random() * 100)
            Quote.findOne({ id: randomCount }).then(quote => {
                res.render("display", { Quote: quote })
            })
        } else {
            res.redirect("/login")
        }
    })
    .post((req, res) => {
        // console.log(req.body)
        res.redirect("/quote/" + req.body.btn)
    })


app.route("/quote/:userreq")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            const randomNumber = Math.floor(Math.random() * 50) + 1;
            QuoteType.findOne({ type: req.params.userreq }).then(q => {
                // console.log(q.description)
                // console.log(q.quotess[randomNumber])
                res.render("quote", {
                    type: q.type,
                    description: q.description,
                    qquote: q.quotess[randomNumber]
                })
            }).catch(err => console.log(err))
        } else {
            res.redirect("/login")
        }

    })


app.route("/logout")
    .get((req, res) => {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    })

























app.listen(3000, () => {
    console.log("Server started at port 3000..")
})