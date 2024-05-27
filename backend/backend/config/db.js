const mysql = require('mysql2');
const fs = require('fs');

// Replace '{ca-cert filename}' with the actual path to your CA certificate file
const caCertPath = './cert/certificate.pem';

const db = mysql.createConnection({
    host: 'dammhnt219cloud.mysql.database.azure.com',
    user: 'webapp1709',
    password: 'admin@123', 
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
