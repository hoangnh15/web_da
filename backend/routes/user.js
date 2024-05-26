const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { checkSession } = require('../middleware/session');

router.get('/get_user_info', checkSession, (req, res) => {
    const sql = 'SELECT * FROM register_info WHERE ACCID = ?';
    db.query(sql, [req.session.userId], (err, results) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
});

router.post('/save_user_info', (req, res) => {
    const userInfo = req.body;
    const requiredFields = ['email', 'dob', 'edu', 'fullname', 'CCCD', 'phone_num', 'addr_number', 'ward', 'district', 'province'];
    for (const field of requiredFields) {
        if (!userInfo[field]) {
            return res.status(400).json({ message: `Thiếu thông tin bắt buộc: ${field}` });
        }
    }
    const query = 'UPDATE register_info SET ? WHERE email = ?';
    db.query(query, [userInfo, userInfo.email], (error, results) => {
        if (error) {
            console.error('Error executing SQL query:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng.' });
        }
        res.json({ message: 'Thông tin đã được cập nhật thành công.' });
    });
});

router.get('/authenticated_routes/user_info', checkSession, (req, res) => {
    // Trả về thông tin user từ session
    res.json({
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role,
        // Thêm các thông tin khác nếu cần
    });
});

module.exports = router;
