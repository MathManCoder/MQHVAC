var request = require("request");
var sensorStatus = require("../models/sensorStatus.model");
var schedule = require("../models/schedule.model");
var emergencyCall = require("../models/emergencyCall.model");
var logs = require("../models/log.model");
var admin = require("../models/admin.model");

const bcrypt = require("bcrypt");

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

exports.setSchedule = async(req, res) => {
    console.log("An schedule have been received. GID: ", req.body.GID);
    console.log("sunday", req.body.sunday);

    // save received Schedule first in Database ..........................................
    var newSchedule = new schedule({
        GID: req.body.GID,
        SJ: "S",
        saturday: req.body.saturday,
        sunday: req.body.sunday,
        monday: req.body.monday,
        tuesday: req.body.tuesday,
        wednesday: req.body.wednesday,
        thursday: req.body.thursday,
        friday: req.body.friday,
    });

    try {
        newSchedule.save();
        console.log(":::  Schedule has been saved into the database.");
    } catch (err) {
        res.send({
            status: "Failed to access database",
        });
        // there should be a log checker
        // You should stop the whole process here
        console.log("::: There is something wrong with saving in DB", err);
    }
    // [end]save received Schedule first in Database ..........................................

    // publish received shchedule to broker ...................................................
    var mqtttemp = require("mqtt");
    const mqtttempBroker = "mqtt://127.0.0.1";
    const options = {
        qos: 2,
    };
    var mqtttempClient = mqtttemp.connect(
        mqtttempBroker, {
            clientId: "mqttjs99",
        },
        options
    );

    mqtttempClient.publish(
        req.body.GID + "/schedule",
        JSON.stringify(req.body),
        options,
        (error) => {
            if (error) {
                console.log("there was an error: ", error);
            } else {
                console.log("Schedule published successfully");
            }
        }
    );

    // [end]publish received shchedule to broker ...................................................

    //send the result ..............................................................................
    res.send({
        status: "Schedule published successfully",
    });
};

exports.updateData = async(req, res) => {
    response = [];

    GIDLIST = ["g1f0", "g2f0"];
    for (currentGID of GIDLIST) {
        sensorData = await sensorStatus
            .find({
                    GID: currentGID,
                },
                function(err, document) {
                    // five is number of sensors
                    var avgTemperature = new Array(5);
                    avgTemperature.fill(0);

                    var avgHumidity = new Array(5);
                    avgHumidity.fill(0);
                    for (x of document) {
                        tempSensors = x.sensors;
                        for (y of tempSensors) {
                            avgTemperature[y.SID] += y.temperature;
                            avgHumidity[y.SID] += y.humidity;
                        }
                    }

                    for (i = 0; i < avgTemperature.length; i++) {
                        avgTemperature[i] /= document.length;
                        avgHumidity[i] /= document.length;
                    }

                    let tempresponse = {
                        GID: currentGID,
                        avgTemperature: avgTemperature,
                        avgHumidity: avgHumidity,
                    };
                    response.push(tempresponse);
                }
            )
            .sort({
                _id: -1,
            })
            .limit(5);
    }

    // console.log(response)
    res.send(response);
    //return model
    // console.log("REQUEST gateway: " + req.body.requestedGateway)

    // let GID = req.body.requestedGateway;
    // let sensors = [
    //     { SID: 1, H: randomInt(10, 24), T: randomInt(1, 9) },
    //     { SID: 2, H: randomInt(10, 24), T: randomInt(1, 9) }
    // ]

    // res.send({
    //     "sensors": sensors
    // })
};

exports.emergencyCall = async(req, res) => {
    // for security reasons don't let setting SJ dirrectly

    //save the request into database
    var newEmergencyCall = new emergencyCall({
        GID: req.body.GID,
        SJ: "M",
        command: req.body.command,
    });

    try {
        newEmergencyCall.save();
        console.log(":::  Emergency call has been saved into the database.");
    } catch (err) {
        res.send({
            status: "Failed to access database",
        });
        // there should be a log checker
        // You should stop the whole process here
        console.log("::: There is something wrong with saving in DB", err);
    }

    // publish received emergency call to the broker ...................................................
    var mqtttemp = require("mqtt");
    const mqtttempBroker = "mqtt://127.0.0.1";
    const options = {
        qos: 2,
    };
    var mqtttempClient = mqtttemp.connect(
        mqtttempBroker, {
            clientId: "mqttjs99",
        },
        options
    );

    mqtttempClient.publish(
        req.body.GID + "/emergencycall",
        JSON.stringify(req.body),
        options,
        (error) => {
            if (error) {
                console.log("there was an error: ", error);
            } else {
                console.log("Emergency call published successfully");
            }
        }
    );
    res.send({
        status: "Emergency call published successfully",
    });
};

exports.readLogs = async(req, res) => {
    requestedGID = req.body.GID;

    // search for latest logs from the server
    readLogs = await logs
        .find({
                GID: requestedGID,
            },
            function(err, document) {
                if (err) {
                    console.log("There was an problem: ", err);
                }

                list = [];
                for (log in document) {
                    let tempLog = {};
                    tempLog["detail"] = document[parseInt(log)].detail;
                    tempLog["level"] = document[parseInt(log)].level;
                    tempLog["GID"] = document[parseInt(log)].GID;
                    tempLog["time"] = document[parseInt(log)].time;
                    list.push(tempLog);
                }

                // send this data to res
                res.send(JSON.stringify(list));
            }
        )
        .sort({
            _id: -1,
        })
        .limit(10);
};

exports.signUp = async(req, res) => {
    requestedUsername = req.body.username;
    requestedPassword = req.body.password;
    // credentials = req.body.credentials;
    // to sign up a new user you have to have credentials
    // originalCredentials = "CREDENTIALS";
    // if both credentials are the same, then start the process
    dublicatedFlag = false;
    // first check the username is unique
    adminData = await admin.find({
            username: requestedUsername,
        },
        (err, document) => {
            if (document.length > 0) {
                res.send({
                    status: "This username has already been taken.",
                    err: err,
                });
                dublicatedFlag = true;
            }
        }
    );

    if (dublicatedFlag == true) {
        return;
    }

    if (requestedPassword == "") {
        res.send({
            status: "The password field cannot be empty.",
        });
        return;
    } else {
        const saltRounds = 10;
        const hash = bcrypt.hashSync(requestedPassword, saltRounds);

        var newAdmin = new admin({
            username: requestedUsername,
            password: hash,
        });
        try {
            newAdmin.save();
            console.log("A new admin is added to the system");
            res.send({ status: "The admin is added to the system" });
        } catch (err) {
            res.send({
                status: "Failed to access database",
            });
            console.log("::: There is something wrong with saving in DB", err);
        }
    }
};

exports.changePass = async(req, res) => {
    username = req.body.username;
    currentPassword = req.body.currentPassword;
    newPassword = req.body.newPassword;

    // first find that user
    adminData = await admin.find({ username: username }, (err, document) => {
        if (document.length == 0) {
            res.send({ status: "There is no such username in system database" });
        } else {
            const saltRounds = 10;
            bcrypt.compare(currentPassword, document[0].password, (err, result) => {
                // if enetered password same as the password in the database
                if (result == true) {
                    // check the new password is not empty
                    if (newPassword == "") {
                        res.send({ status: "The new password cannot be empty" });
                    } else {
                        try {
                            // the new entered password is correct
                            // save it into the database
                            const saltRounds = 10;
                            const hash = bcrypt.hashSync(newPassword, saltRounds);
                            const filter = { username: username };
                            const update = { password: hash };
                            (async(filter, update) => {
                                let doc = await admin.findOneAndUpdate(filter, update);
                                res.send({ status: "The password successfully changed." });
                            })(filter, update);
                        } catch (err) {
                            res.send({ status: "The password could not be changed" });
                        }
                    }
                }
                // if entered password is different from the password in the database
                else {
                    res.send({ status: "The enetered password is incorrect" });
                }
            });
        }
    });
};