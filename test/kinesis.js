var kinetic = require('./kinetic');

var firstStream = new kinetic({
    region: 'ap-northeast-1',
    streamName: 'firstStream'
});

var secondStream = new kinetic({
    region: 'ap-northeast-1',
    streamName: 'secondStream'
});

//firstStreamというStreamにListner関数を登録
firstStream.on('message',function(data){
    secondStream.emit(
        'message',
        {key:data.partitionKey,value:data.data}
    );
});

secondStream.on('message',function(data){
   console.log(data);
});

//定期的にfirstStreamというStreamにメッセージをemitしてやる
setInterval(function() {
    var array = ['a','b','c'];
    var index = Math.floor(Math.random() * 2 + 1);
    var key = array[index];
    var value = {body: 'This is a body'};
    firstStream.emit('message',{key:key,value:value});
},1000);