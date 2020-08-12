var mqtttemp = require('mqtt')
const mqtttempBroker = "mqtt://127.0.0.1"
const options = {qos: 2};
var mqtttempClient = mqtttemp.connect(mqtttempBroker, options);
// adding clients in connection process can harm the entire program 
// at this point I dont know why :D

mqtttempClient.on("connect", () => {
    console.log("connected  " + mqtttempClient.connected);


    mqtttempClient.publish('G0L1F0/logs',JSON.stringify({
    
        "time":new Date(),
        "GID":"G0L1F0",
        "detail":"There was a problem on the sennsor side",
        "level":"warning",
        "seen":false
        
        }),options,(error)=>{
            if(error){
                console.log("there was an error: ",error);
                return 0 ;
            }else{
                console.log("Schedule published successfully");
            }
        });
});

mqtttempClient.on("error", (err) => {
    console.log("Can't connect" + err);
    process.exit(1)
});





 