const mysql = require('mysql2');
const fs = require('fs');

// Replace '{ca-cert filename}' with the actual path to your CA certificate file
const caCertPath = './cert/certificate.pem';

const db = mysql.createConnection({
    host: 'YOURHOST.mysql.database.azure.com',
    user: 'XXXXX', //my user
    password: 'YYYYYY', //
    database: 'tutoring',
    port: 3306,
    ssl: {
        ca: fs.readFileSync(caCertPath)
    }
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

module.exports = db;
