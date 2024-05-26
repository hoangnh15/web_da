const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sessions } = require('../middleware/session');

router.post('/register', (req, res) => {
    const { usrname, email, password, role } = req.body;
    db.query('SELECT * FROM register_info WHERE email = ?', [email], (selectErr, selectResults) => {
        if (selectErr) {
            console.error('Error checking email:', selectErr);
            return;
        }
        if (selectResults.length > 0) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        const randomId = 'a' + Math.floor(100000000 + Math.random() * 900000000);
        db.query('INSERT INTO register_info (accid, username, email, pass_w, acc_type) VALUES (?, ?, ?, ?, ?)', 
                 [randomId, usrname, email, password, role], (insertErr, insertResults) => {
            if (insertErr) {
                console.error('Error adding user:', insertErr);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            res.json({ message: 'Tạo tài khoản thành công, vui lòng đăng nhập !!' });
        });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM register_info WHERE email = ? AND pass_w = ?', [email, password], (selectErr, selectResults) => {
        if (selectErr) {
            console.error('Error checking login:', selectErr);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (selectResults.length > 0) {
            const newSessionId = Math.random().toString(36).substring(2);
            req.session.id = newSessionId;
            req.session.userId = selectResults[0].ACCID;
            req.session.username = selectResults[0].username;
            req.session.role = selectResults[0].acc_type;
            sessions[newSessionId] = req.session;
            res.cookie('sessionId', newSessionId, { maxAge: 60 * 60 * 1000, httpOnly: true });
            res.status(200).json({ message: 'Login successfully!!' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
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
