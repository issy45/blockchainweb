const io = require('socket.io')(3000)

io.on('connection', function(socket){
  socket.on('message', function(msg){
    io.emit('message', msg);
  });
});
