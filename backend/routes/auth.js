const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sessions } = require('../middleware/session');
const hashPassword = require('../utils/hashfunc')
router.post('/register', async (req, res) => {
    const { usrname, email, password, role } = req.body;

    // Function to validate password
    function isValidPassword(password) {
        const minLength = 14;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    }

    try {
        // Check if the password meets the requirements
        if (!isValidPassword(password)) {
            return res.status(400).json({ code: '400', message: 'Password must be at least 14 characters long and include uppercase, lowercase, number, and special character.' });
        }

        // Check if email already exists in the database
        const [selectResults] = await db.promise().query('SELECT * FROM register_info WHERE email = ?', [email]);

        if (selectResults.length > 0) {
            return res.status(400).json({ code: '400', message: 'Email already registered' });
        }

        // Generate random account ID
        const randomId = 'a' + Math.floor(100000000 + Math.random() * 900000000);

        // Hash the password
        const hashedPassword = hashPassword(password);

        // Add new user to the register_info table
        await db.promise().query('INSERT INTO register_info (accid, username, email, pass_w, acc_type) VALUES (?, ?, ?, ?, ?)', [randomId, usrname, email, hashedPassword, role]);

        // After adding the user, create a new row in the Wallet table
        const secretkey = ''; // You can generate a random secret key if needed
        const balance = 0; // Initialize balance with the default value (0)

        await db.promise().query('INSERT INTO Wallet (ACCID, secretkey, balance) VALUES (?, ?, ?)', [randomId, secretkey, balance]);

        res.status(200).json({ code: '200', message: 'Account created successfully, please log in!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ code: '500', message: 'Internal Server Error' });
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Băm mật khẩu người dùng cung cấp
        const hashedPassword = hashPassword(password);
        console.log(hashedPassword);

        // Truy vấn cơ sở dữ liệu để kiểm tra email và mật khẩu
        const [selectResults] = await db.promise().query('SELECT * FROM register_info WHERE email = ? AND pass_w = ?', [email, hashedPassword]);

        if (selectResults.length > 0) {
            console.log("correct");
            const newSessionId = Math.random().toString(36).substring(2);
            req.session.id = newSessionId;
            req.session.userId = selectResults[0].ACCID;
            req.session.username = selectResults[0].username;
            req.session.role = selectResults[0].acc_type;
            sessions[newSessionId] = req.session;
            res.cookie('sessionId', newSessionId, { maxAge: 60 * 60 * 1000, httpOnly: true, sameSite: true });
            const csrfToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            res.cookie('csrfToken', csrfToken);
            res.status(200).json({ code: "200", message: 'Login successfully!!' });
        } else {
            console.log("incorrect");
            res.status(401).json({ code: "401", message: 'Invalid credentials' });
        }
    } catch (error) {
        console.log("incorrect1");
        console.error('Error checking login:', error);
        res.status(500).json({ code: "500", message: 'Internal Server Error' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.clearCookie('sessionId');
        res.json({ message: 'Logout successful' });
    });
});

module.exports = router;
