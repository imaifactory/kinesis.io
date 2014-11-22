var EventEmitter = require("events").EventEmitter
    ,AWS = require('aws-sdk')
    ,debug = require('debug')('Kinesis');

module.exports = Kinesis;

// TODO: イベント名を使ってないのを何とかする

function Kinesis(config){

    // TODO: Validation

    this.local = config.local || false;

    if(!this.local) {

        // TODO: Steramの存在確認をしたほうがいい気がする

        this.streamName = config.streamName;

        var kineisOptions = {};
        if (config.region) {
            kineisOptions.region = config.region;
        }
        if (config.aws_access_key_id && config.aws_secret_access_key) {
            kineisOptions.accessKeyId = config.aws_access_key_id;
            kineisOptions.secretAccessKey = config.aws_secret_access_key;
        }
        this.kinesis = new AWS.Kinesis(kineisOptions);

    }
}

Kinesis.prototype.__proto__ = EventEmitter.prototype;
Kinesis.listnerPrefix = 'Kinesis_';

Kinesis.buildListnerName = function(listnerName,shardId){
  return Kinesis.listnerPrefix + listnerName + '_' + shardId;
};

Kinesis.buildDataforKinesis = function(record){
    if(typeof record === 'object'){
        return JSON.stringify(record);
    }else{
        return record;
    }
}


Kinesis.parseRecord = function(record){
    var result = {
        partitionKey: record.PartitionKey,
        sequenceNumber: record.SequenceNumber
    };
    var data = record.Data.toString();
    try{
        var parsedData = JSON.parse(data);
        result.data = parsedData;
    }catch(e){
        result.data = data;
    }
    return result;
}

var emit = Kinesis.prototype.emit;

Kinesis.buildLocalRecord = function(arguments){
    var src = arguments['1'];
    var dst = {
        partitionKey: src.key,
        sequenceNumber: '000000000000000000000000', // TODO: あとで実装
        data: src.value
    }
    arguments['1'] = dst;
    return arguments;
}

Kinesis.prototype.emit = function(ev){
  if(this.local) {
      emit.apply(this,Kinesis.buildLocalRecord(arguments));
  }else{
      var args = Array.prototype.slice.call(arguments);
      var params = {
          StreamName: this.streamName,
          PartitionKey: args[1].key,
          Data: Kinesis.buildDataforKinesis(args[1].value)
      };

      this.kinesis.putRecord(params,function(err,result){
          debug(result);
          if(err) console.log(err);
      });
  }
};

var on = Kinesis.prototype.on;
Kinesis.prototype.on = function(ev){
  if(this.local) {
      on.apply(this, arguments);

  } else {
      var self = this;
      var args = Array.prototype.slice.call(arguments);
      self.kinesis.describeStream({StreamName: self.streamName}, function (err, descResult) {
          self.shards = descResult.StreamDescription.Shards;
          for (var i = 0; i < self.shards.length; i++) {

              var shardId = self.shards[i].ShardId;

              // TODO: keyごとのListner登録に切り替える
              var listenerName = Kinesis.buildListnerName(self.streamName,shardId);
              var callback = args[1];
              on.call(self, listenerName, callback);

              var getShardIteratorParams = {
                  ShardId: shardId,
                  ShardIteratorType: 'LATEST',
                  StreamName: self.streamName
              };
              self.kinesis.getShardIterator(getShardIteratorParams, function (getShardIteratorErr, getShardIteratorResult) {
                  if (getShardIteratorErr) console.error(getShardIteratorErr);
                  self.GetRecords(getShardIteratorResult.ShardIterator);
              });
          }
      });
  }
};

Kinesis.prototype.GetRecords = function(shardId){
    var self = this;

    self.kinesis.getRecords({ShardIterator: shardId,Limit:10000},function(err,result){
        if(err){console.error(err);}
        else{
            if(result.Records.length){
                for(var i = 0; i < result.Records.length; i++){
                    var record = result.Records[i];
                    self.emitRecords(Kinesis.parseRecord(record));
                }
            }
            setTimeout(function(){
                self.GetRecords(shardId);
            },1000);
        }
    });
}

Kinesis.prototype.emitRecords = function(record){
    for(var i = 0; i < this.shards.length; i++) {
        var shard = this.shards[i];
        var listenerName = Kinesis.buildListnerName(this.streamName,shard.ShardId);
        emit.call(this, listenerName, record);
    }
}

