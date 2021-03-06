    // we need only to change the dataset
    var ctx = document.getElementById('realtime').getContext('2d');
  
    // var char2t = new Chart(ctx, {
    //     // The type of chart we want to create
    //     type: 'line',

    //     // The data for our dataset
    //     data: {
    //         labels: ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
    //             '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
    //         ],
    //         datasets: [{
    //             label: 'دما- سانتی گراد',
    //             backgroundColor: 'rgb(255, 99, 132)',
    //             borderColor: 'rgb(255, 99, 132)',
    //             data: [0, 10, 5, 2, 20, 30, 45]
    //         }]
    //     },

    //     // Configuration options go here
    //     options: {}
    // });

    function requestReport(aid, title) {

        // replace the title of information accoridng to selected aid
        aidList = [];
        aidList.push(aid);
        document.getElementById("titleOfMonitor").innerHTML = title;

        // wait until you receive the data
        var request = $.ajax({
            url: "http://192.168.99.8:80/sensor_status/latest_report",
            method: "POST",
            data: { aidList: aidList },
            dataType: "json"
        });

        let receivedReport;
        request.done(function(msg) {

            receivedReport = msg.data[0].data;
            console.log("here receive report", receivedReport);

            receivedReport.forEach(element => {

                // console.log(element)
                tempID = element.sid[3]
                if (element.T.value) {
                    document.getElementById("t" + tempID).innerHTML = element.T.value.toFixed(2);
                    document.getElementById("h" + tempID).innerHTML = element.H.value.toFixed(2) + "%";
                } else {
                    document.getElementById("t" + tempID).innerHTML = "No Information";
                    document.getElementById("h" + tempID).innerHTML = "No Information";
                }
            });

        });
        request.fail(function() {
            console.log("FAILED to receive data!");
        });

        //requst for today history
        var requestTwo = $.ajax({
            url: "http://192.168.99.8:80/sensor_status/today_report",
            method: "POST",
            data: { aidList: aidList },
            dataType: "json"
        });



        requestTwo.done(function(msg) {
            
            
            msg = msg.data[0].data;
            // console.log(msg[0].temperature);
            sensorIDTEMP = "a" + aid + "s";

            allTemperatureVector = [];

            for (var i = 0; i <= 5; i++) {
                allTemperatureVector.push(msg[i].temperature);
            }


            let atv = allTemperatureVector;
            avgTempRes = [];

            for (var i = 0; i < 48; i++) {
                // calculate the average!
                avgTempRes.push(Math.round((atv[0][i].value + atv[1][i].value + atv[2][i].value + atv[3][i].value + atv[4][i].value + atv[5][i].value) / 6))
            }
            // console.log(avgTempRes);

            information = avgTempRes;

            if (window.chart3 !=undefined) {
                window.chart3.destroy();
            }
            var ctx = document.getElementById('realtime').getContext('2d');
            
            window.chart3 = new Chart(ctx, {
                // The type of chart we want to create
                type: 'bar',

                // The data fo r our dataset
                data: {
                    labels: ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
                        '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
                    ],
                    datasets: [{
                        label: 'دما- سانتی گراد',
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: information
                    }]
                },

                // Configuration options go here
                options: {
                    legend: {
                        display: true,
                        labels: {
                            fontColor: 'rgb(255, 99, 132)'
                        }
                }}
            });
        });

        document.getElementById("legend").style.visibility = "visible";

        requestTwo.fail(function() {
            console.log("FAILED to receive data!");
        });
    }