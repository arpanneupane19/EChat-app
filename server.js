// Application setup
const express = require('express');
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io")
const io = new Server(server)
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require("dotenv");
dotenv.config();
const nunjucks = require('nunjucks')


// Templating Engine
nunjucks.configure("views", {
    autoescape: true,
    express: app
})


// Middlewares & Other Files
app.use(express.static(__dirname + "/public"))
app.use(session({
    secret: "asdfghjkl",
    cookie: { maxAge: 2629800000 },
    resave: false,
    saveUninitialized: false
}))
app.use(flash())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
const { loginRequired, logoutRequired } = require("./middlewares/middlewares.js")
const routes = require('./routes.js');
const { Message } = require('./Models.js');

// Routes
app.get("/", logoutRequired, routes.getHome);

app.get("/login", logoutRequired, routes.getLogin);

app.get("/register", logoutRequired, routes.getRegister);

app.post("/register", routes.postRegister);

app.post("/login", routes.postLogin)

app.get("/inbox", loginRequired, routes.getInbox)

app.post('/inbox', routes.searchForUser)

app.get("/message-user/:email", loginRequired, routes.getMessage)

app.get("/logout", (req, res) => {
    req.session.user = null;
    req.flash("loginMessage", "You have been logged out.")
    res.redirect("/login")
})



// Socket IO for Messaging
const userToRoom = new Map();
const roomToUsers = new Map();
const idToUser = new Map();

io.on('connection', (socket) => {
    console.log("Made a connection.")

    socket.on('connectUser', (data) => {
        userToRoom.set(data.user, data.room)
        console.log('User to room connection', userToRoom)

        if (roomToUsers.get(data.room) === undefined) {
            roomToUsers.set(data.room, [data.user]);
        }
        else {
            let usersInRoom = roomToUsers.get(data.room);
            usersInRoom.push(data.user)
            roomToUsers.set(data.room, usersInRoom);
        }
        console.log('Room to user connection', roomToUsers)

        idToUser.set(socket.id, data.user)
        console.log('SocketID to user', idToUser)

        socket.join(data.room)
    })

    socket.on("chat", (data) => {
        Message.create({ message: data.message, sender: data.sender, receiver: data.receiver, roomCode: data.roomCode }).catch(err => { console.log(err) })
        io.in(data.roomCode).emit("message", {
            message: data.message,
            sender: data.sender
        })
    })

    socket.on('disconnect', (reason) => {
        if (idToUser.has(socket.id)) {
            const username = idToUser.get(socket.id)
            const room = userToRoom.get(username)
            const usersInRoom = roomToUsers.get(room)

            userToRoom.delete(username)
            console.log('Username to Room', userToRoom)

            if (usersInRoom.includes(username)) {
                let index = usersInRoom.indexOf(username)
                usersInRoom.splice(index, 1)
            }
            if (usersInRoom.length === 0) {
                roomToUsers.delete(room)
            }

            idToUser.delete(socket.id)
            console.log('Room to user', roomToUsers)
            console.log('Id to User', idToUser)
        }

    })

})

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`Server started on port ${PORT}`) })