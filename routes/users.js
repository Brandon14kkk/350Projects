var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var crypto = require('crypto');


/* GET users listing. */
router.get('/', function (req, res, next) {
    // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
	console.log("GET all users, successfully connected to the database");
	
	// Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: UserDELETECHECK");
			console.log(error);
		}
		else {
			console.log("Successfully use ebdb.");
		}
	});

    pool.query('SELECT UserID, UserName, Email, isAdministrator FROM ebdb.User', function (error, result, fields) {
        if (error) throw error;
        else {
            res.send(result);
        }
    });
});


/* POST */
// make a new user, use url-encoded
router.post('/', function(req, res, next) {
  console.log("You can create a new user here");
    var userName = req.body.name;
    var userEmail = req.body.email;
    var userPassword = req.body.password;
	
    // I am going to do salt and hash by using SHA 256
    /**
     * generates random string of characters i.e salt
     * @function
     * @param {number} length - Length of the random string.
     */
    var genRandomString = function(length){
        return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
    };

    /**
     * hash password with sha512.
     * @function
     * @param {string} password - List of required fields.
     * @param {string} salt - Data to be validated.
     */
    var sha512 = function(password, salt){
        var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hash.update(password);
        var value = hash.digest('hex');
        return {
            salt:salt,
            passwordHash:value
        };
    };

    function saltHashPassword(userpassword) {
        var salt = genRandomString(16); /** Gives us salt of length 16 */
        var passwordData = sha512(userpassword, salt);
        console.log('UserPassword = '+userpassword);
        console.log('nSalt = '+passwordData.salt);
        console.log('Passwordhash = '+passwordData.passwordHash);
        return passwordData;
    }

    // get the hashed password from here
    const resultSaltAndHashedPassword = saltHashPassword(userPassword);

    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
	});
	
	console.log("USER POST: Hello, Are you here" + process.env.RDS_HOSTNAME);
    console.log(process.env.RDS_USERNAME);
    console.log(process.env.RDS_PASSWORD);
	console.log(process.env.RDS_PORT);

	// Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: UserPOST");
			console.log(error);
		}
		else {
			console.log("Successfully use ebdb.");
		}
	});

    pool.query('INSERT INTO ebdb.User (UserName, Email, Salt, Password) VALUES (?, ?, ?, ?)',
        [userName, userEmail, resultSaltAndHashedPassword.salt, resultSaltAndHashedPassword.passwordHash],
        function (error, results, fields) {
           if (error) {
               console.log("Error: cannot access DB");
               console.log(error);
               res.send("INSERTION fails");
           }
           else {
               console.log("The row " + results.insertId);
               res.send('INSERTION succeeds');
           }

           pool.end(function (err) {
                // all connections in the pool have ended
                if (err) {
                    throw err;
                }
                else {
                    console.log("Successfully closed the database connection.")
                }
           });
        });
});


/* DELETE */
router.delete('/check', function (req, res, next) {
    var adminID = req.body.admin_id;
 
    // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
    
    // Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: UserDELETECHECK");
			console.log(error);
		}
		else {
			console.log("Successfully use ebdb.");
		}
	});
 
     pool.query('SELECT * FROM ebdb.User WHERE UserID = ?', [adminID], function(error, result, fields) {
         if (error) {
             console.log(error);
         }
         else {
             if (result.length === 0) {
                 res.send("User doesn't exist");
             }
             else if (result.length > 0) {
                 if (result[0].isAdministrator === 1) {
                     console.log("You are a super user");
                     res.send("OK");
                 }
                 else{
                     console.log("Verification fails: you are not one of the super user");
                     res.send("Verification fails: you are not one of the super user");
                 }
             }
             else {
                 res.send("mysql is down...")
             }
         }
 
     })
 });


 router.delete('/', function(req, res, next) {
    var deleteID = req.body.delete_id;
 
     // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
    
    // Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: UserDELETECHECK");
			console.log(error);
		}
		else {
			console.log("Successfully use ebdb.");
		}
	});
 
     pool.query('DELETE FROM ebdb.User WHERE UserID = ?', [deleteID], function(error, result, fields) {
         if (error) console.log(error);
         else {
             if (result.affectedRows === 0) {
                 console.log("The user you wish to delete is not in the DB");
                 res.send("Deletion fails: You are trying to delete an non-existing user")
             }
             else {
                 console.log("You successfully delete this user from DB");
                 res.send("Deletion succeeds");
             }
         }
     });
 });


module.exports = router;