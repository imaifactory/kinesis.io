var EventEmitter = require("events").EventEmitter
    ,AWS = require('aws-sdk')
    ,debug = require('debug')('Kinesis');

module.exports = Kinesis;

function Kinesis(config){
    this.local = config.local || false;
    if(!this.local) {
        var kineisOptions = {};
        if (config.region) {
            kineisOptions.region = config.region;
        }
        if (config.aws_access_key_id && config.aws_secret_access_key) {
            kineisOptions.accessKeyId = config.aws_access_key_id;
            kineisOptions.secretAccessKey = config.aws_secret_access_key;
        }
        this.kinesis = new AWS.Kinesis(kineisOptions);
        this.events = {};
    }
}

Kinesis.prototype.__proto__ = EventEmitter.prototype;
Kinesis.listnerPrefix = 'Kinesis_';

Kinesis.buildListnerName = function(listnerName){
  return Kinesis.listnerPrefix + listnerName;
};

var emit = Kinesis.prototype.emit;
var on = Kinesis.prototype.on;

Kinesis.prototype.emit = function(ev){
  if(this.local) {
      emit.apply(this, arguments);
  }else{
      var args = Array.prototype.slice.call(arguments);
      var params = {
          StreamName: args[0],
          PartitionKey: args[1],
          Data: JSON.stringify(args[2])
      };

      this.kinesis.putRecord(params,function(err,result){
          debug(result);
          if(err) console.log(err);
      });
  }
};

Kinesis.prototype.on = function(ev){
  if(this.local) {
      on.apply(this, arguments);
  } else {

      var self = this;
      var args = Array.prototype.slice.call(arguments);
      var streamName = args[0];
      if(!self.events[streamName]) {
          self.kinesis.describeStream({StreamName: streamName}, function (err, descResult) {
              var shards = descResult.StreamDescription.Shards;
              for (var i = 0; i < shards.length; i++) {
                  var shardId = shards[i].ShardId;
                  var getShardIteratorParams = {
                      ShardId: shardId,
                      ShardIteratorType: 'LATEST',
                      StreamName: streamName
                  };
                  self.kinesis.getShardIterator(getShardIteratorParams, function (getShardIteratorErr, getShardIteratorResult) {
                      if (getShardIteratorErr) console.error(getShardIteratorErr);
                      self.GetRecords(streamName, getShardIteratorResult.ShardIterator);
                  });
              }
          });
      }
      var listnerName = Kinesis.buildListnerName(streamName);
      var callback = args[1];
      on.call(this, listnerName, callback);
  }
};

Kinesis.prototype.GetRecords = function(streamName, shardId){
    var self = this;
    self.kinesis.getRecords({ShardIterator: shardId,Limit:10000},function(err,result){
        if(err){console.error(err);}
        else{
            if(result.Records.length){
                for(var i = 0; i < result.Records.length; i++){
                    var record = JSON.parse(result.Records[i].Data.toString());
                    record.partitionKey = result.Records[i].PartitionKey;
                    self.emitRecords(streamName,record);
                }
            }
            setTimeout(function(){
                self.GetRecords(streamName, shardId);
            },1000);
        }
    });
}

Kinesis.prototype.emitRecords = function(streamName, record){
    var listnerName = Kinesis.buildListnerName(streamName);
    emit.call(this,listnerName,record);
}