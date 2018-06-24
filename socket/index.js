const io = require('socket.io')(3000)

io.on('connection', function (socket) {
  socket.on('broadcast', function (msg) {
    socket.broadcast.emit('customEmit', msg)
  })
})
