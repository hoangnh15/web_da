const db = require('../config/db');
const hashPassword = require('../utils/hashfunc')
function isAuthenticated(req, res, next) {
    const sessionId = req.cookies.session_id;
    if (sessionId && sessions[sessionId]) {
        req.session = sessions[sessionId];
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

function CheckPassword(req, res, next) {
    const userId = req.session.userId;
    const { password, secret } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
    }

    const query = 'SELECT pass_w FROM register_info WHERE ACCID = ?';
    db.query(query, [userId], async (error, results) => {
        if (error) {
            console.error('Lỗi khi thực hiện truy vấn SQL:', error);
            return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        const storedPassword = results[0].pass_w;
        const hashedPassword = await hashPassword(password);
        if (storedPassword === hashedPassword) {
            next(); // Mật khẩu khớp, tiếp tục xử lý request tiếp theo
        } else {
            res.status(401).json({ message: 'Mật khẩu không chính xác.' });
        }
    });
}

module.exports = { isAuthenticated, CheckPassword };
