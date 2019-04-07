var express = require('express');
var router = express.Router();
var mysql = require('mysql');

// url starts at localhost:8080/chatrooms/

/* GET home page */
// 1. get all rows from the table "chatrooms" in Chatroom.db
router.get('/', function(req, res) {
    console.log("You are in the chatroom router, GET all chatrooms");
    // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
	console.log("GET-Chatroom: /, successfully connected to the database");
	
	// Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: GET-Chatroom: /");
			console.log(error);
		}
		else {
			console.log("Success: GET-Chatroom: /");
		}
    });
    
    pool.query('SELECT * FROM ebdb.Chatrooms;', function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        else {
            res.send(results);
        }
    });
});


// 2. get all posts from a SPECIFIC roomID (url specified) from table "Posts",
router.get('/:id', function(req, res) {

    console.log("You are in the chatroom router, GET all chatrooms");
    // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
	console.log("GET-Chatroom: /:id, successfully connected to the database");
	
	// Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: GET-Chatroom: /:id");
			console.log(error);
		}
		else {
			console.log("Success: GET-Chatroom: /:id");
		}
    });

    var roomID = req.params.id;
    pool.query('SELECT * FROM ebdb.Posts WHERE RoomID = ?', [roomID], function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        else {
            res.send(results);
        }
    })
});



/* POST home page */
// 1. add a new chat room to table "chatrooms" with its name specified, use urlencoded, req.body.name
router.post('/', function (req, res, next) {

    var roomName = req.body.name;
    
    // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
	console.log("POST-Chatroom: /, successfully connected to the database");
	
	// Attention, only administrator can set a user to be administrator, so we dont have that option here
	pool.query('USE ebdb', function(error) {
		if (error) {
			console.log("ERROR: POST-Chatroom: /");
			console.log(error);
		}
		else {
			console.log("Success: POST-Chatroom: /");
		}
    });

    pool.query('INSERT INTO ebdb.Chatrooms (RoomName) VALUES (?)', [roomName],
        function (error, results, fields) {
        if (error) {
            console.log("Insertion fails: POST-Chatroom: /");
        }
        else {
            console.log("Insertion succeeds: POST-Chatroom: /");
        }
    })
});


// 2. add a new post to table "Posts" which needs 1. roomID(params), 2. req.body.content(urlencoded)
router.post('/makePost', function (req, res, next) {

    if (!req.body) {
        console.log("Cannot get any values");
        res.sendStatus(400);
    }
    else {
        var roomID = req.body.room_id;
        var userID = req.body.user_id;
        var postContent = req.body.content;
        console.log(roomID, userID, postContent);
        
        // database connection
        var pool = mysql.createPool({
            connectionLimit: 10,
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT
        });
        console.log("POST-Chatroom: /makePost, successfully connected to the database");
        
        // Attention, only administrator can set a user to be administrator, so we dont have that option here
        pool.query('USE ebdb', function(error) {
            if (error) {
                console.log("ERROR: POST-Chatroom: /makePost");
                console.log(error);
            }
            else {
                console.log("Success: POST-Chatroom: /makePost");
            }
        });
        // typo, I make it PostContent to be PostCount.......
        pool.query('INSERT INTO ebdb.Posts (RoomID, UserID, PostCount) VALUES (?, ?, ?)',
            [roomID, userID, postContent], function(error, results, fields) {
            if (error) {
                console.log(error);
                res.send("Insertion fails...")      // why this doesn't print on the web
            }
            else {
                console.log("Successfully make a post in POST-Chatroom: /makePost");
                res.status(201).send("Insertion succeeds");     // why this doesn't print on the web
            }
        })
    }
});


/* DELETE home page */
// 1. delete a chatRoom from table: "chatrooms" with room name specified, use url
router.delete('/deleteRoom', function(req, res, next) {
    console.log("You are deleting a room from DB using roomID, this will lead everything related to this chatroom gets" +
        "deleted.");
    var roomID = req.body.room_id;
    var userID = req.body.user_id;

    // database connection
    var pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT
    });
    console.log("DELETE-Chatroom: /deleteRoom, successfully connected to the database");
    
    // Attention, only administrator can set a user to be administrator, so we dont have that option here
    pool.query('USE ebdb', function(error) {
        if (error) {
            console.log("ERROR: DELETE-Chatroom: /deleteRoom");
            console.log(error);
        }
        else {
            console.log("Success: DELETE-Chatroom: /deleteRoom");
        }
    });

    // check whether this user is a super user
    pool.query('SELECT isAdministrator FROM ebdb.User WHERE UserID = ?', [userID], function(error, result, fields) {
        if (error) {
            console.log(error);
        }
        else {
            if (result.length === 0) {
                res.send("User doesn't exist");
            }
            else if (result.length > 0) {
                if (result[0].isAdministrator === 1) {
                    pool.query('DELETE FROM ebdb.Chatrooms WHERE RoomID = ?', [roomID], function (error, result, fields) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            if (result.affectedRows === 0) {
                                console.log("The chatroom you wish to delete is not in the DB");
                                res.send("Deletion fails: You are trying to delete an non-existing room")
                            }
                            else {
                                console.log("You successfully delete this room from DB");
                                res.send("Deletion succeeds");
                            }
                        }
                    })
                }
                else {
                    res.send("You are not one of the super users, you can NOT delete a chatroom");
                }
            }
            else {
                res.send("mysql is down...");
            }
        }
    });
});

module.exports = router;