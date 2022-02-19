const path = require('path');
const express = require('express');
const http = require('http')
const socketio = require('socket.io');
const formatMessage = require('./util/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./util/users');

const app = express();
const server = http.createServer(app)
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Admin'

io.on('connection', socket => {
  socket.on('joinRoom', ({username, room}) => {
    const user = userJoin(socket.id, username, room); 

    socket.join(user.room);

    socket.emit('message', formatMessage(botName,'Welcome to ChatCord'))

    // Broadcasr when user connects
    // broadcast to everyone except user
    socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`))
  
    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    })
  });

  // listen for chatMessage
  socket.on('chatMessage', message => {
    const user = getCurrentUser(socket.id);

    // emit to everyone
    io.to(user.room).emit('message', formatMessage(user.username,message))
  })

   // when client disconnects
   socket.on('disconnect', () => {
     const user = userLeave(socket.id);

     if (user){
      io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));

      // send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      })
     }
  })
})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})