var io = require('socket.io-client');

Function.prototype.toJSON = Function.prototype.toString;
module.exports = distributedKinetic;

function distributedKinetic(server){
    this.io = io(server);
}

distributedKinetic.prototype.run = function(taskArray){
    var newTaskArray = distributedKinetic.interpretTasks(taskArray);
    console.log(newTaskArray);
    this.io.emit('run',newTaskArray);
}

distributedKinetic.interpretTasks = function(taskArray){

    var newTaskArray = [];
    for(var i = 0; i < taskArray.length; i++){
        var task = {
          here: taskArray[i].stream,
          func: taskArray[i].func
        };

        if(taskArray[i+1]){
            task.next = taskArray[i+1].stream;
        }
        newTaskArray.push(JSON.stringify(task));
    }
    return newTaskArray;
}

