// Define streams and tasks
var distributedKinetic = require('./lib/distributedKinetic');
var driver = new distributedKinetic('http://localhost:3000/client');
var taskArray = [
    {
        stream: {
            streamName: 'firstStream',
            region: 'ap-northeast-1',
            local: false
        },
        func: function(data){
            this.next(data.partitionKey,data.data);
        }
    },
    {
        stream: {
            streamName: 'secondStream',
            region: 'ap-northeast-1',
            local: false
        },
        func: function(data){
            console.log(data);
        }
    }
];

// Activate tasks
driver.run(taskArray);

// Put record to first stream
var kinetic = require('./kinetic');
var stream = new kinetic({
    streamName: 'firstStream',
    region: 'ap-northeast-1'
});

setInterval(function() {
    var array = ['a','b','c'];
    var index = Math.floor(Math.random() * 2 + 1);
    var key = array[index];
    var value = {body: 'This is a body'};
    stream.emit('message',{key:key,value:value});
},1000);
