const express = require('express');
const app = express();
// const pool = require('./db');  // Import the DB connection
const path = require('path');
// const bcrypt = require('bcryptjs');
const session = require('express-session');
// const oracledb = require('oracledb');
const mysql = require('mysql2');

// Dummy admin credentials (for simplicity, usually this should be stored securely in a DB)
const adminCredentials = {
    username: 'admin',
     passwordHash: '$2a$10$WPPeunqgDQ7FFJYnZb48Gu7Ax4Sc.aY92eUc52lPY1xG1uvom7Nsq'  // Hashed password 'pass'
    // passwordHash: '$2a$10$zhRemoSxkYSQJZwioA1nWug8VJHnv7Fyp4vSQpEL3Bt64zACdwRme'  // Hashed password 'password'
    // passwordHash: '$2a$10$HXzYVx34Pr3F5EJjAfB/hBdS7LQ2nnLg6ZTlhf6cX8n0JYqaCLOe6'  // Hashed password 'password123'
    // $2a$10$WPPeunqgDQ7FFJYnZb48Gu7Ax4Sc.aY92eUc52lPY1xG1uvom7Nsq 'pass'
};

// // Oracle DB connection configuration
// const dbConfig = {
//     user: 'root',
//     password: 'root',
//     connectString: 'localhost/XEPDB1'  // Adjust this as per your Oracle XE configuration
// };

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'roombookdb',
    waitForConnections: true,
    connectionLimit: 10,  // Maximum number of connections in the pool
    queueLimit: 0,         // No limit on waiting queries
    namedPlaceholders: true,

  }

app.use(express.json());
// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
// Middleware for parsing form data
// app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session middleware
app.use(session({
    secret: 'secretkey',  // Use a secure secret key in production
    resave: false,
    saveUninitialized: true
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// // Route to add room (GET)
// app.get('/add-room', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'room_add.html'));
// });

// // Route to handle the room form submission (POST)
// app.post('/add-room', async (req, res) => {
//     const { room_number, price_per_day, room_occupancy, air_con } = req.body;

//     let connection;
//     try {
//         // Get connection from the Oracle database
//         //connection = await oracledb.getConnection(dbConfig);
//         connection = mysql.createConnection( dbConfig );
//         const promisedConnection = connection.promise();

//         const sql = `
//             INSERT INTO rooms (room_number, price_per_day, room_occupancy, air_con)
//             VALUES (:room_number, :price_per_day, :room_occupancy, :air_con)
//         `;
        
//         await promisedConnection.execute(sql, {
//             room_number: room_number,
//             price_per_day: price_per_day,
//             room_occupancy: room_occupancy,
//             air_con: air_con
//         });

//         // Commit the transaction (necessary for changes to be saved)
//         await promisedConnection.commit();

//         res.redirect('/rooms');
//     } catch (err) {
//         console.error('Error adding room:', err);
//         res.status(500).send('Error adding room');
//     } finally {
//         if (connection) {
//             await connection.close(); // Close the connection
//         }
//     }
// });

// Route to get all rooms (GET)
app.get('/get-rooms', async (req, res) => {
    let promisedConnection;
    try {
        // Get connection from the Oracle database
        // connection = await oracledb.getConnection(dbConfig);
        const connection = mysql.createConnection( dbConfig );
        promisedConnection = connection.promise();

        const result = await promisedConnection.execute(
            `SELECT id, room_number, price_per_day, room_occupancy, air_con FROM rooms`
        );
        
      //  res.json(result.rows);  // Return the room data as JSON
        res.json(result[0]);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).send('Error fetching rooms');
    } finally {
        if (promisedConnection) {
            await promisedConnection.close(); // Close the connection
        }
    }
});

// Route to list rooms (GET)
app.get('/rooms', async (req, res) => {
   
    res.sendFile(path.join(__dirname, 'public', 'room_list.html'));
});

// Route to add booking (GET)
app.get('/add-booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'booking_add.html'));
});

// Route to handle the booking form submission (POST)
app.post('/add-booking', async (req, res) => {
    const { customer_id, room_id, booking_date, checkin, checkout } = req.body;

    let promisedConnection;
    try {
        // Get connection from the Oracle database
        // connection = await oracledb.getConnection(dbConfig);
        const connection = mysql.createConnection( dbConfig );
        promisedConnection = connection.promise();

        
        const sql = `
            INSERT INTO bookings (customer_id, room_id, checkin, checkout, gym, pool, food)
            VALUES (:customer_id, :room_id, :checkin, :checkout, :gym, :pool, :food)
        `;
        
        await promisedConnection.execute(sql, {
            customer_id: customer_id,
            room_id: room_id,
            // booking_date: booking_date,
            checkin: checkin,
            checkout: checkout,
            gym: req.body.gym ? 1 : 0,
            pool: req.body.pool ? 1 : 0,
            food: req.body.food ? 1 : 0
        });

        // Commit the transaction (necessary for changes to be saved)
        await promisedConnection.commit();

        res.redirect('/bookings');
    } catch (err) {
        console.error('Error adding booking:', err);
        res.status(500).send('Error adding booking');
    } finally {
        if (promisedConnection) {
            await promisedConnection.close(); // Close the connection
        }
    }
});

// Route to get all bookings (GET)
app.get('/get-bookings', async (req, res) => {
    let promisedConnection;
    try {
        // Get connection from the Oracle database
        // connection = await oracledb.getConnection(dbConfig);
        const connection = mysql.createConnection( dbConfig );
        promisedConnection = connection.promise();

        const result = await promisedConnection.execute(
            `SELECT b.*, c.name AS customer_name, r.room_number,  b.checkin, b.checkout 
             FROM bookings b
             JOIN customers c ON b.customer_id = c.id
             JOIN rooms r ON b.room_id = r.id`
        );
        
        //res.json(result.rows);  // Return the booking data as JSON
        res.json(result[0]);
       // return result.rows;
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).send('Error fetching bookings');
    } finally {
        if (promisedConnection) {
            await promisedConnection.close(); // Close the connection
        }
    }
});

// Route to list bookings (GET)
app.get('/bookings', async (req, res) => {
    let promisedConnection;
    try {
        // Get connection from the Oracle database
        // connection = await oracledb.getConnection(dbConfig);
        connection = mysql.createConnection( dbConfig );
        const promisedConnection = connection.promise();

        const result = await promisedConnection.execute(
            `SELECT b.id, c.name AS customer_name, r.room_number,  b.checkin, b.checkout 
             FROM bookings b
             JOIN customers c ON b.customer_id = c.id
             JOIN rooms r ON b.room_id = r.id`
        );
        const bookings = result ? result[0] : [];
        res.render('booking_list', { bookings: bookings });
       // res.render('booking_list', { bookings: result.rows }); // Render the booking list page
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).send('Error fetching bookings');
    } finally {
        if (promisedConnection) {
            await promisedConnection.close(); // Close the connection
        }
    }
});



app.get('/home', (req, res) => {
    if (req.session.loggedIn) {
        res.sendFile(path.join(__dirname, 'public', 'index2.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});
// Root route - serves index.html (home page)
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.send('<h1>Welcome, Admin!</h1><a href="/logout">Logout</a>');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Login route (GET)
app.get('/login', (req, res) => {
    if (req.session.loggedIn) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login route (POST)
// app.post('/login', (req, res) => {
//     const { username, password } = req.body;

//     // Check if credentials match
//     if (username === adminCredentials.username ) {
//         // Compare hashed password
//         console.log(bcrypt.hashSync('pass'));
//     //    req.session.loggedIn = true;
//     //    return res.redirect('/');

//         bcrypt.compare(password, adminCredentials.passwordHash, (err, result) => {
//             if (result) {
//                 // Store session data
//                 req.session.loggedIn = true;
//                 return res.redirect('/home');
//             } else {
//                 return res.send('<h1>Invalid credentials, please try again!</h1><a href="/login">Go back to login</a>');
//             }
//         });
//     } else {
//         return res.send('<h1>Invalid credentials. Please try again!</h1><a href="/login">Go back to login</a>');
//     }
// });

// Login route (POST)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query the database to fetch the user by username
    let connection;
    try {
        connection = mysql.createConnection(dbConfig);
        const promisedConnection = connection.promise();

        // Query to find the user by username
        promisedConnection.execute('SELECT * FROM users WHERE username = ?', [username])
            .then(([rows]) => {
                if (rows.length === 0) {
                    // No user found with this username
                    return res.send('<h1>Invalid credentials. Please try again!</h1><a href="/login">Go back to login</a>');
                }

                // Assuming the first result is the user
                const user = rows[0];

                // Compare the provided password with the stored hashed password
                // bcrypt.compare(password, user.password, (err, result) => {
                if (password === user.password) {
                    // if (err) {
                    //     console.error('Error comparing passwords:', err);
                    //     return res.status(500).send('Internal server error');
                    // }

                    //if (result) 
                    {
                        // Passwords match, log the user in
                        req.session.loggedIn = true;
                        req.session.user = user;  // Store user information in session
                        return res.redirect('/home');
                    } /*else {
                        // Passwords don't match
                        return res.send('<h1>Invalid credentials. Please try again!</h1><a href="/login">Go back to login</a>');
                    }*/
                } else {
                    return res.send('<h1>Invalid credentials. Please try again!</h1><a href="/login">Go back to login</a>');
                }
                //);
            })
            .catch((err) => {
                console.error('Error fetching user:', err);
                res.status(500).send('Error fetching user');
            });
    } catch (err) {
        console.error('Error in login route:', err);
        res.status(500).send('Internal server error');
    } finally {
        if (connection) {
            connection.end(); // Close the connection
        }
    }
});


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login');
    });
});

// Route to add customer (GET)
app.get('/add-customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer_add.html'));
});
// Route to handle the customer form submission (POST)
app.post('/add-customer', async (req, res) => {
    const { name, email, house_no, locality, city, state, pincode } = req.body;

    let connection;
    try {
        // Get connection from the Oracle database
        // connection = await oracledb.getConnection(dbConfig);
        connection = await mysql.createConnection( dbConfig );

        const sql = `
            INSERT INTO customers (name, email, house_no, locality, city, state, pincode)
            VALUES (:name, :email, :house_no, :locality, :city, :state, :pincode)
        `;
        
        await connection.execute(sql, {
            name: name,
            email: email,
            house_no: house_no,
            locality: locality,
            city: city,
            state: state,
            pincode: pincode
        });

        // Commit the transaction (necessary for changes to be saved)
        await connection.commit();

        res.redirect('/customers');
    } catch (err) {
        console.error('Error adding customer:', err);
        res.status(500).send('Error adding customer');
    } finally {
        if (promisedConnection) {
            await promisedConnection.close(); // Close the connection
        }
    }
});

// Route to get all customers (GET)
app.get('/get-customers', async (req, res) => {
    let promisedConnection;
    try {
        // Get connection from the Oracle database
        // connection = await oracledb.getConnection(dbConfig);
        const connection = mysql.createConnection( dbConfig );
        promisedConnection = connection.promise();

        const result = await promisedConnection.execute(
            `SELECT id, name, email, house_no, locality, city, state, pincode FROM customers`
        );
        // console.log(result[0]);
        //res.json(result.rows);  // Return the customer data as JSON
        res.json(result[0]);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).send('Error fetching customers');
    } finally {
        if (promisedConnection) {
            await promisedConnection.close(); // Close the connection
        }
    }
});

// Route to list customers (GET)
app.get('/customers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer_list.html'));
});
// Start the server
const PORT = process.env.PORT || 3000;
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});