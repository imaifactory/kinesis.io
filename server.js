var app = require('express')();
var http = require('http').Server(app);

http.listen(3000, function(){
    console.log('listening on *:3000');
});

var io = require('socket.io')(http);

io.of('/workers').on('connection',function(socket){
    console.log('A new client has been connected.');

    socket.on('message',function(message){
        console.log(message);
        //TODO: ClientのIDも出す
    });
});

io.of('/client').on('connection',function(socket){
    socket.on('run',function(taskArray){
        for(var i = 0; i < taskArray.length; i++) {
            console.log(taskArray);
            io.of('/workers').sockets[i].emit('function',taskArray[i]);
        }
    });
});


