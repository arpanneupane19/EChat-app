const { User, Message } = require('./Models.js')
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

function getHome(req, res) {
    res.render("home.html", { title: "Home" });
}

function getRegister(req, res) {
    res.render("register.html", { title: "Register", messages: req.flash("registerMessage") });
}

function getLogin(req, res) {
    res.render("login.html", { title: "Login", messages: req.flash("loginMessage") });
}

async function postRegister(req, res) {
    let email = req.body.email;
    let password = req.body.password

    const userExists = await User.findOne({ where: { email: email } });

    if (!userExists) {
        bcrypt.hash(password, 12, (err, hash) => {
            if (err) {
                console.log(err)
            }
            let newUser = User.create({ email: email, password: hash }).catch((err) => { console.log("Error occurred when trying to create user ", err) })
            req.flash("loginMessage", `Account has been created for ${email}.`)
            res.redirect("/login")
        })
    }

    if (userExists) {
        req.flash("registerMessage", "That email is already in use. Please choose a different email.")
        res.redirect("/register")
    }
}

async function postLogin(req, res) {
    let email = req.body.email;
    let password = req.body.password;

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        req.flash("loginMessage", "The email you entered in does not belong to an account.")
        res.redirect("/login")
    }

    if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) {
            req.flash("loginMessage", "Password is invalid.")
        }
        if (passwordMatch) {
            req.session.user = user
            res.redirect("/inbox")

        }
    }
}

async function getInbox(req, res) {
    const sentMessages = await Message.findAll({ where: { sender: req.session.user.email } })

    const receivedMessages = await Message.findAll({ where: { receiver: req.session.user.email } })


    let messages = new Set()

    for (message of sentMessages) {
        receiver = message.receiver
        messages.add(receiver)
    }

    for (message of receivedMessages) {
        sender = message.sender
        messages.add(sender)
    }

    res.render("inbox.html", { title: "My Inbox", messages: req.flash("inboxMessage"), inboxMessages: messages })
}

async function searchForUser(req, res) {
    const email = req.body.email

    const user = await User.findOne({ where: { email: email } })

    if (user) {
        res.redirect(`/message-user/${user.email}`)
    }
    if (!user) {
        req.flash("inboxMessage", "The email you entered in does not belong to a user. Please enter in a different email.")
        res.redirect("/inbox")
    }

}

async function getMessage(req, res) {
    if (req.params.email === req.session.user.email) {
        req.flash("inboxMessage", "You cannot message yourself.")
        res.redirect("/inbox")
    }
    else {
        let senderReceiver = [req.session.user.email, req.params.email];
        senderReceiver.sort()
        let roomCode = senderReceiver.join(",");

        const messages = await Message.findAll({ where: { roomCode: roomCode } })
        res.render("message.html", { title: `Messaging with ${req.params.email}`, receiver: req.params.email, sender: req.session.user.email, textMessages: messages })
    }
}

module.exports = {
    getHome: getHome,
    getRegister: getRegister,
    getLogin: getLogin,
    postRegister: postRegister,
    postLogin: postLogin,
    getInbox: getInbox,
    searchForUser: searchForUser,
    getMessage: getMessage

}