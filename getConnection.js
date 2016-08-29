var mysql = require('mysql'),
pool  = mysql.createPool({
        host     : '127.0.0.1',
        port     : '3305',
        //host     : '10.161.168.138',
        //port     : '3306',
        user     : 'developer',
        password : 'gdas.developer',
        database : 'gdas_dev',
        waitForConnections: false
    });
 
exports.do = function (sql, args, callback){
    var that = this;
    that.getConnection(function (err, connection){
        if(err) throw err;
        connection.query(sql, args, function (){
            callback.apply(connection, arguments);
            connection.release();
        });
    });
}.bind(pool);