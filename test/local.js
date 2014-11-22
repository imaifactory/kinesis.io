var assert = require("assert");
var kinesis = require('../lib/kinesis');

describe('kinesis',function(){
   describe('#local message format',function(){
       it('Should receive formatted message',function(done){

           var firstStream = new kinesis({
               local: true
           });

           var secondStream = new kinesis({
               local: true
           });

           assert.equal('a','a','test');

           firstStream.on('message',function(data){
               assert.deepEqual(
                   data,
                   {
                       partitionKey:'a',
                       sequenceNumber:'000000000000000000000000',
                       data:{body:'This is a body'}
                   }
               );
               secondStream.emit('message',{key:data.partitionKey,value:data.data});
           });

           secondStream.on('message',function(data){
               assert.deepEqual(
                   data,
                   {
                       partitionKey:'a',
                       sequenceNumber:'000000000000000000000000',
                       data:{body:'This is a body'}
                   }
               );
               done();
           });

           setTimeout(function() {
               var key = 'a';
               var value = {body: 'This is a body'};
               firstStream.emit('message',{key:key,value:value});
           },0);
       })
   })
});