# Kinetic

## Description

## Install

## Synopsis

You can handle Amazon Kinesis like event emitter object.

```javascript

var kinetic = require('./kinetic');

var firstStream = new kinetic({
  region:'ap-northeast-1',
  streamName:'firstStream',
  local: false // If true, you can run this locally.
});

var secondStream = new kinetic({
  region:'ap-northeast-1',
  streamName:'firstStream',
  local: false // If true, you can run this locally.
});

//firstStreamというStreamにListner関数を登録
firstStream.on('message',function(data){
    console.log(data);
    emitter.emit('secondStream','key',['aaa','bbb']);
});

//secondStreamというStreamにListner関数を登録
secondStream.on('message',function(data){
    console.log(data);
})


//定期的にfirstStreamというStreamにメッセージをemitしてやる
setInterval(function() {
    var array = ['a','b','c'];
    var index = Math.floor(Math.random() * 2 + 1);
    var key = array[index];
    var value = {body: 'This is a body'};
    firstStream.emit('message',key,value);
},1000);

```

You can run on distributed EC2 fleet.

Presequence: Driver daemon and Child daemons are to be running.

```javascript

// Define streams and tasks
var driver = new distributedKinetic();
var taskArray = [
  {
    stream: {
      streamName: 'firstStream',
      region: 'ap-northeast-1'
    },
    task: function(data){
      next(data);
    }
  },
  {
    stream: {
      streamName: 'secondStream',
      region: 'ap-northeast-1'
    },
    task: function(data){
      console.log(data);
    }
  }
];

// Activate tasks
driver.run(taskArray);

// Put record to first stream
var stream = new kinetic({
  streamName: 'firstStream',
  region: 'ap-northeast-1'
});
stream.emit('message','key','value');

```

Also you can run this in promise manner.

```javascript

var firstStream = new kinetic({
  region:'ap-northeast-1',
  streamName:'firstStream',
  local: false // If true, you can run this locally.
});

var secondStream = new kinetic({
  region:'ap-northeast-1',
  streamName:'firstStream',
  local: false // If true, you can run this locally.
});

var promise = kinetic.promiseFactory(
  firstStream(),
  function(value){
    next(value.key,value.value)
  }),
  secondStream(),
  function(value){
    console.log(value);
  })
);

promise.run('key','value');
```

## Message Format

```javascript

{
  "sequenceNumber": "196800000000000000000374",
  "partitionKey": "2efdb0ea22685b46993e42a67302a001",
  "data": "SOME CUSTOM DATA 1"
}

```
