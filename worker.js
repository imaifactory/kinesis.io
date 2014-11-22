var engine = require('./kinetic');
var parser = function(k,v){return v.toString().indexOf('function') === 0 ? eval('('+v+')') : v};

var io = require('socket.io-client')('http://localhost:3000/workers');
io.on('function',function(fnJson){
   var task = JSON.parse(fnJson,parser);
   var here = new engine(task.here);
   if(task.next){
       var nextStream = new engine(task.next);
       here.next = function(k,v){
           nextStream.emit('message',{key:k,value:v});
       }
   }
   here.on('message',task.func);
});

// TODO: multi_clusterを使ってマルチプロセス化

// TODO: Stopの実装
