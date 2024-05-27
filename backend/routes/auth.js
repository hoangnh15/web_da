const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sessions } = require('../middleware/session');

const hashPassword = require('../utils/hashfunc')
router.post('/register', (req, res) => {
    const { usrname, email, password, role } = req.body;

    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
    const hashedPassword =  hashPassword(password);
    db.query('SELECT * FROM register_info WHERE email = ?', [email], (selectErr, selectResults) => {
        if (selectErr) {
            console.error('Error checking email:', selectErr);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (selectResults.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Tạo accid ngẫu nhiên
        const randomId = 'a' + Math.floor(100000000 + Math.random() * 900000000);

        // Thêm người dùng mới vào bảng register_info
        
        db.query('INSERT INTO register_info (accid, username, email, pass_w, acc_type) VALUES (?, ?, ?, ?, ?)', 
                 [randomId, usrname, email,hashedPassword, role], (insertErr, insertResults) => {
            if (insertErr) {
                console.error('Error adding user:', insertErr);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            // Sau khi thêm người dùng thành công, tạo một dòng mới trong bảng Wallet
            const secretkey = ''; // Bạn có thể tạo secretkey ngẫu nhiên nếu cần
            const balance = 0; // Khởi tạo balance với giá trị mặc định (0)

            db.query('INSERT INTO Wallet (ACCID, secretkey, balance) VALUES (?, ?, ?)', 
                     [randomId, secretkey, balance], (walletErr, walletResults) => {
                if (walletErr) {
                    console.error('Error creating wallet:', walletErr);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                res.status(200).json({ message: 'Tạo tài khoản thành công, vui lòng đăng nhập !!' });
            });
        });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = hashPassword(password);
    console.log(hashedPassword);
    db.query('SELECT * FROM register_info WHERE email = ? AND pass_w = ?', [email,hashedPassword], (selectErr, selectResults) => {
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
