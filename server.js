const express = require("express");
const cors = require('cors');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const url = require("url");
const peerServer = ExpressPeerServer(http, {
    debug: true,
});
const path = require("path");

app.use(cors());
app.options('*', cors());

app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

app.get("/join", (req, res) => {
    res.redirect(
        url.format({
            pathname: `/join/${uuidv4()}`,
            query: req.query,
        })
    );
});

app.get("/joinold", (req, res) => {
    res.redirect(
        url.format({
            pathname: req.query.meeting_id,
            query: req.query,
        })
    );
});

app.get("/join/:rooms", (req, res) => {
    res.render("room", { roomid: req.params.rooms, Myname: req.query.name });
});

io.on("connect", (socket) => {
    socket.on("sendMessage", (data) => {
        console.log(data)
        io.sockets.emit("brodcastMessage", data);
    });

    socket.on("join-room", (roomId, id, myname) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("user-connected", id, myname);

        socket.on("messagesend", (message) => {
            console.log(message);
            io.to(roomId).emit("createMessage", message);
        });

        socket.on("tellName", (myname) => {
            console.log(myname);
            socket.to(roomId).broadcast.emit("AddName", myname);
        });

        socket.on("disconnect", () => {
            socket.to(roomId).broadcast.emit("user-disconnected", id);
        });
    });
});

// io.on('connect', (socket) => {
//     socket.on('sendText', function (data) {
//       io.sockets.emit('receiveText', { text: data.text, user: data.user, time: getDateTime() });
//     })
//   });

http.listen(process.env.PORT || 3030);
console.log(`server is running on port 3030`)