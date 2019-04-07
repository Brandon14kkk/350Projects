var express = require('express');
var router = express.Router();
var mysql = require('mysql');   // sql
var crypto = require('crypto') // password check

router.post('/', function(req, res) {
    var userEmail = req.body.Email;           // user type in
    var userPassword = req.body.Password;     // user type in

    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
    // var connection = mysql.createConnection({
    //     host     : process.env.RDS_HOSTNAME,
    //     user     : process.env.RDS_USERNAME,
    //     password : process.env.RDS_PASSWORD,
    //     port     : process.env.RDS_PORT
    // });
      
    console.log("20190306: Hello, Are you here" + process.env.RDS_HOSTNAME);
    console.log(process.env.RDS_USERNAME);
    console.log(process.env.RDS_PASSWORD);
    console.log(process.env.RDS_PORT);


    /**
     * hash password with sha512.
     * @function
     * @param {string} password - List of required fields.
     * @param {string} salt - Data to be validated.
     */
    var verifySha512 = function(password, salt){
        var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hash.update(password);
        return hash.digest('hex');
    };


    pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: UserPOST");
			console.log(error);
		}
		else {
			console.log("Successfully use ebdb.");
		}
    });
    
    // first: check whether there is such a user
    pool.query('SELECT Email FROM ebdb.User WHERE Email = ?', [userEmail], function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        else {
            if (results.length === 0) {
                console.log("There is no such user");
                res.redirect("../routes/RegisterAUser.html")
            }
            else {
                pool.query('SELECT Salt, Password FROM ebdb.User WHERE Email = ?', [userEmail], function (error, result, fields) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        const salt = result[0].Salt;
                        const DBHashedPassword = result[0].Password;  // password from database
                        const hashedPassword = verifySha512(userPassword, salt);
                        if (DBHashedPassword === hashedPassword) {
                            res.redirect('../Actions.html');
                        }
                        else {
                            res.redirect('../index.html');
                        }
                    }
                });
            }
        }
    });
    // I am thibking a better way of doing this so that I don't need to reboot ther server anymore...

})

module.exports = router;