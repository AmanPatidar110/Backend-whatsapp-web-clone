const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const compression = require("compression");

const LoginMiddleware = require("./middlewares/LoginMiddleware");
const authRoutes = require("./routes/auth");
const statusRoutes = require("./routes/status");
const chatRoutes = require("./routes/chat");
const User = require("./models/user");
const Message = require("./models/messages");

const app = express();
const port = process.env.PORT || 5000;

const MongoURI = process.env.MONGO_URI;
mongoose
  .connect(MongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to DB!");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(compression());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  next();
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/auth", LoginMiddleware, authRoutes);
app.use("/chat", LoginMiddleware, chatRoutes);
app.use("/status", LoginMiddleware, statusRoutes);

app.use("/images", express.static(path.join("images")));
app.use("/chataudio", express.static(path.join("chataudio")));

app.use((error, req, res, next) => {
  if (!error.statusCode) error.statusCode = 500;
  if (!error.message) error.message = "Server side error";
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;

  res.status(status).json({ message: message, data: data });
});

const server = app.listen(port, () => {
  console.log(`Listening on PORT: ${port}...`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

//________________________________

let users = [];

const addUser = (userId, socketId, online) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId, online });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  const u = users.find((user) => user.userId == userId);
  return u;
};

const getSocketUserId = (socketId) => {
  console.log("sockId" + socketId);
  console.log(users);
  const u = users.find((user) => user.socketId == socketId);
  return u?.userId;
};
//________________________________

io.on("connection", (socket) => {
  //when connect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", async (userId) => {
    addUser(userId, socket.id, true);
    console.log("adding" + users.length);

    let id = getSocketUserId(socket.id);
    socket.broadcast.emit("userActivity", {
      userId: id,
      online: true,
      lastSeen: "",
    });
  });

  socket.on("getStatus", async ({ userId }) => {
    const socketuser = getUser(userId);
    let online = false;
    let lastSeen = "";

    if (socketuser?.online) online = true;
    else {
      const dbuser = await User.findOne({ _id: userId });
      lastSeen = dbuser?.lastSeen;
    }
    io.emit("updateActivity", {
      userId: userId,
      online: online,
      lastSeen: lastSeen,
    });
  });

  //send and get message
  socket.on(
    "sendMessage",
    ({
      uuid,
      by,
      receiverId,
      text,
      conversationId,
      type,
      imgPath,
      createdAt,
      messageStatus,
    }) => {
      const receiver = getUser(receiverId);
      console.log("recId" + conversationId);
      if (receiver) {
        io.to(receiver.socketId).emit("getMessage", {
          uuid,
          by,
          receiverId,
          text,
          conversationId,
          type,
          imgPath,
          createdAt,
          messageStatus,
        });
      }
    }
  );

  socket.on("sendSeenMessages", ({ msgSender, msgReceiver, convoId }) => {
    const sender = getUser(msgSender);
    console.log("MSG SENDER: ", sender?.socketId);
    if (sender) {
      io.to(sender.socketId).emit("getSeenMessages", {
        msgSender,
        msgReceiver,
        convoId,
      });
    }
  });

  //
  socket.on("deleteChat", ({ convoId, receiverId }) => {
    const receiver = getUser(receiverId);
    console.log("recId" + convoId);

    if (receiver) {
      io.to(receiver.socketId).emit("getDeleteChat", {});
    }
  });

  //
  socket.on("deleteMessage", ({ convoId, receiverId }) => {
    const receiver = getUser(receiverId);
    console.log("recId" + convoId);

    if (receiver) {
      io.to(receiver.socketId).emit("getDeleteMessage", {
        convoId,
        receiverId,
      });
    }
  });

  //when disconnect
  socket.on("disconnect", async () => {
    console.log("a user disconnected!");
    let id = getSocketUserId(socket.id);
    let d = new Date();
    socket.local.emit("userActivity", {
      userId: id,
      online: false,
      lastSeen: d.toISOString(),
    });

    removeUser(socket.id);

    let u = await User.updateOne({ _id: id }, { lastSeen: d });
  });
});
