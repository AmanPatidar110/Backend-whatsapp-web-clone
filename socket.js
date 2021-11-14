const User = require('./models/user');
const { server } = require('./server');

const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
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
  
   getUser = (userId) => {
    const u = users.find((user) => user.userId == userId);
    return u;
  };
  
  const getSocketUserId = (socketId) => {
    console.log("sockId" +socketId);
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
   
      let id = getSocketUserId(socket.id)
      socket.broadcast.emit("userActivity", {
        userId: id,
        online: true,
        lastSeen: "",
      });
    });
  
  
    socket.on('getStatus', async ({userId}) => {
      const socketuser = getUser(userId);
      let online=false;
      let lastSeen = "";
  
  
      if(socketuser?.online)  online = true;
      else {
        const dbuser = await User.findOne({_id: userId});
        lastSeen = dbuser?.lastSeen;
      } 
      io.emit("updateActivity", {
        userId: userId,
        online: online,
        lastSeen: lastSeen,
      });
    });
  
  
    //send and get message
    socket.on("sendMessage", ({ uuid, by, receiverId, text, conversationId, type, imgPath, createdAt, messageStatus }) => {
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
          messageStatus
        });
      }
    });
   
    socket.on("sendSeenMessages", ({ msgSender, msgReceiver, convoId }) => {
      const sender = getUser(msgSender);
      console.log("MSG SENDER: " , sender?.socketId)
      if (sender) {
        io.to(sender.socketId).emit("getSeenMessages", {
          msgSender,
          msgReceiver,
          convoId
        });
      }
    });
  
    //
    socket.on("deleteChat", ({ convoId, receiverId}) => {
      const receiver = getUser(receiverId);
      console.log("recId" + convoId);
  
      if (receiver) {
        io.to(receiver.socketId).emit("getDeleteChat", { });
      }
    });
    
    //
    socket.on("deleteMessage", ({ convoId, receiverId}) => {
      const receiver = getUser(receiverId);
      console.log("recId" + convoId);
  
      if (receiver) {
        io.to(receiver.socketId).emit("getDeleteMessage", {convoId, receiverId });
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
  
      let u = await User.updateOne({_id: id}, {lastSeen: d});
    });
  });

