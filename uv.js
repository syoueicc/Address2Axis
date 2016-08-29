var _ = require('underscore'),
    fs = require("fs"),
    mysql = require('mysql'),
    dataConfig = {
        host     : '127.0.0.1',
        port     : '3305',
        //host     : '10.161.168.138',
        //port     : '3306',
        user     : 'developer',
        password : 'gdas.developer',
        database : 'gdas_dev',
        waitForConnections: true
    },
    connection,
    filePath = "result.txt",
    http = require('http'),
    start = 0, amount = 200, currentLength;
    getDBData(start, amount);

function getDBData(_count, _amount) {
    connection = mysql.createConnection(dataConfig);
    connection.query("SELECT * FROM report_display.trade_map LIMIT ?,?;",[_count,_amount], function(err, result) {
        if(err) throw err;
        //console.log(start * amount);
        if(!!result && !!result.length) {
            currentLength = result.length;
            getBaiduAxis(result);
            //getBaiduAxis(result);
        }
        connection.end();
    });
}

function getBaiduAxis(userList) {
    var user = _.first(userList),
        resultList = [], timezone = 0, timer,
        akList = ['INqNWCQRj4DedVFzGoT58MIu', 'LUnpwgVrxMmzi8lZWbw4ToLq'], akIndex = 0;
    //, 'DRg1T6xs1oEnXTmjHFDNcMc7', 'dT9Cyku0GNdvnKj2XWG6eTEg','GAW5txDkS7GGgManH7Z3q2Lj'
//    if(!!user) {
        _.each(userList, function(user, key, list) {
            var url = 'http://api.map.baidu.com/geocoder/v2/?address='+encodeURIComponent(user.address)+'&city=%E4%B8%8A%E6%B5%B7%E5%B8%82&output=json&ak=' + akList[akIndex];
            akIndex++;
            akIndex > 1 ? akIndex=0 : akIndex;
            
            http.get(url, function(res) {
                var body = "";
                res.on('end', function() {
                    timezone+=1;
                    var result = new Buffer(body, 'utf-8').toString();
                    try{
                        var axis = JSON.parse(result);
                        if(!axis.message) {
                            resultList.push([user.address,~~(parseFloat(axis.result.location.lat) * 1000) / 1000, ~~(parseFloat(axis.result.location.lng) * 1000) / 1000]);
                        }else {
                            console.log('error address rows tel: ' + user.tel);
                            //getBaiduAxis(_.rest(userList));
                        }
                    }catch(e) {
                        console.log("catch e :" + e);
                        console.log(axis);
                    }
                });

                res.on('data', function(chunk) {
                    body += chunk;
                });
            })
            .on('error', function(err) {
                timezone+=1;
                console.log("Got error: " + err.message);
            });
        });
    
    timer = setInterval(function() {
        if( timezone === currentLength) {
            clearInterval(timer);
            var conn = mysql.createConnection(dataConfig),
                sql = "INSERT INTO report_display.trade_map_cxcy (`address`,`c_x`,`c_y`) VALUES ",
                plus = [];

            _.chain(resultList).map(function(v) {
                return _.map(v, function(val) {
                    return _.isNull(val) || _.isUndefined(val) ? "null" : "'" +val+ "'";
                });
            }).each(function(val) {
                plus.push( "(" + val.join(",") + ")" );
            });
            conn.query(sql + plus.join(","), function(err, result) {
                if(err) {
                    console.log("insert error " + err);
                }
                if(result && result.affectedRows) console.log('insert ' + result.affectedRows + ' rows');
                conn.end();
                start += 1;
                console.log("loop count: " + start);
                getDBData(start * amount, amount);
            });
        }else {
            console.log("baidu api is running. timezone: " + timezone);
        }
    }, 500);
}

