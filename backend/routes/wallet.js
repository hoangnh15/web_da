const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated, CheckPassword  } = require('../middleware/auth');
const { checkSession } = require('../middleware/session');
const hashPassword = require('../utils/hashfunc')
router.post('/change_secretkey',CheckPassword,async (req, res)=>{

    const userId = req.session.userId;
    const { password,secretkey } = req.body;
    const hashedPassword = await hashPassword(password);
    const hashedSecretkey = await hashPassword(secretkey);
    if (!secretkey) {
        return res.status(400).json({ message: 'Thiếu secret key.' });
    }

    const updateQuery = 'UPDATE Wallet SET secretkey = ? WHERE ACCID = ?';
    db.query(updateQuery, [hashedSecretkey, userId], (error, results) => {
        if (error) {
            console.error('Lỗi khi thực hiện truy vấn SQL:', error);
            return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
        }

        res.json({ message: 'Secret key đã được thay đổi thành công.' });
    });


} );

router.post('/payment',checkSession, (req, res) => {
    const { classID } = req.body;
    const accID = req.session.userId;

    db.query('SELECT balance FROM Wallet WHERE ACCID = ?', [accID], (err, walletResults) => {
        if (err) {
            console.error('Error fetching wallet balance:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const balance = walletResults[0].balance;

        db.query('SELECT price, isBooked FROM Class WHERE classID = ?', [classID], (err, classResults) => {
            if (err) {
                console.error('Error fetching class details:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            const classDetails = classResults[0];
            const price = classDetails.price;
            const isBooked = classDetails.isBooked;

            if (balance < price) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }

            if (isBooked) {
                return res.status(400).json({ error: 'Class already booked' });
            }

            const newBalance = balance - price;

            db.query('UPDATE Wallet SET balance = ? WHERE ACCID = ?', [newBalance, accID], (err) => {
                if (err) {
                    console.error('Error updating wallet balance:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                }

                db.query('UPDATE Class SET accID = ?, isBooked = 1 WHERE classID = ?', [accID, classID], (err) => {
                    if (err) {
                        console.error('Error updating class details:', err);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    const transId = 't' + Math.floor(100000000 + Math.random() * 900000000); // Generate a random transaction ID
                    const orderType = 'Class Enrollment';
                    const payType = 'Wallet';
                    const amount = price;

                    const extraData = `${classID}${accID}`;
                    const message = 'Successful.';

                    const redirectUrl = `http://localhost:3000/thanks.html?orderId=${transId}&orderType=${orderType}&payType=${payType}&transId=${transId}&extraData=${extraData}&amount=${amount}&message=${message}`;

                    res.status(200).json({ message: redirectUrl });
                });
            });
        });
    });
});


router.post('/insertTrans', async (req, res) => {
    const { transID, accID, classID } = req.body;
    const userId = req.session.userId; // Lấy userId từ session

    if (userId !== accID) {
        return res.status(403).json({ message: 'Unauthorized: accID does not match userId' });
    }

    try {
        // Kiểm tra xem classID có isBooked = 1 và accID đó hay không
        const [rows] = await db.promise().query(
            'SELECT * FROM Class WHERE classID = ? AND accID = ? AND isBooked = 1',
            [classID, accID]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Class is not booked by this user or does not exist' });
        }

        // Chèn vào bảng Trans nếu tất cả các điều kiện đều đúng
        const query1 = 'INSERT INTO Trans (transID, accID, classID) VALUES (?, ?, ?)';
        await db.promise().query(query1, [transID, accID, classID]);
        
        console.log("Transaction inserted successfully");
        return res.status(200).json({ message: 'Transaction inserted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/getbalance', (req, res) => {
    const accID = req.session.userId; // Assuming user is logged in and userId is stored in session

    if (!accID) {
        return res.status(400).json({ error: 'User not logged in' });
    }

    const query = 'SELECT balance FROM Wallet WHERE ACCID = ?';
    db.query(query, [accID], (err, results) => {
        if (err) {
            console.error('Error fetching balance:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        res.status(200).json({ balance: results[0].balance });
    });
});



module.exports = router;