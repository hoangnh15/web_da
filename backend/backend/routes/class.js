const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { checkSession } = require('../middleware/session');

router.get('/get_classes', async (req, res) => {
    function isValidClassID(str) {
        return /^c\d{9}$/.test(str);
    }
    try {
        const whereCondition = req.query.where || ''; 
        const hasQuestionMark = /\?/.test(whereCondition);
      //  const [classesData] = await db.promise().query('SELECT * FROM Class WHERE start_time > NOW() AND isBooked = 0');
      const query = 'SELECT Class.*,fullname,ward, district, subName FROM subjects inner join Class inner join register_info WHERE ' 
                            +'subjects.subID = Class.subID AND tutorID = register_info.ACCID AND ' + whereCondition;
      var classesData ='';   
      console.log(isValidClassID(whereCondition), whereCondition);            
        if(hasQuestionMark){
            [classesData] = await db.promise().query(query, req.session.userId);
        }
        else if(isValidClassID(whereCondition)){
            const currentTime = new Date();

            const _query = 'SELECT Class.*,fullname,ward, district, subName, edu FROM subjects inner join Class inner join register_info WHERE '
            + 'subjects.subID = Class.subID AND tutorID = register_info.ACCID AND '+`classID = '${whereCondition}' `;
            [classesData] = await db.promise().query(_query);
        }
         else {
            [classesData] = await db.promise().query(query);
        }
        
//SELECT Class.*,fullname,ward, district, subName FROM subjects inner join Class inner join register_info WHERE subjects.subID = Class.subID AND tutorID = register_info.ACCID AND start_time > NOW() AND isBooked = 0;
        res.json(classesData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/getSubID', async (req, res) =>{

    try{
        const whereCondition = req.query.where || ''; 
        const query = 'SELECT subID FROM subjects WHERE ' + whereCondition;
        const [subID] = await db.promise().query(query);
        res.json(subID);

    }
    catch (error){
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/editClass', (req, res) => {
    const classInfo = req.body;
    const _classID = classInfo.classID;
    delete classInfo['classID'];
    // Kiểm tra xem có thiếu thông tin nào không
    const requiredFields = ['class_name', 'subName', 'grade', 'price', 'start_time', 'end_time', 'detail'];
    for (const field of requiredFields) {
        if (!classInfo[field]) {
            return res.status(400).json({ message: `Thiếu thông tin bắt buộc: ${field}` });
        }
    }
    //
    var _subName = classInfo.subName;
    const _query = `SELECT subID FROM subjects WHERE subName = ?`
    var _subID ='';
    db.query(_query, [_subName], (error, results) => {
        if (error) {
            console.log('Error executing SQL query:', error);
            //return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng.' });
        }

        //res.json({ message: 'Thông tin đã được cập nhật thành công.' });
        _subID = results[0].subID;
        console.log(results);

    classInfo.subID = _subID;
    delete classInfo.subName;
    // Thực hiện truy vấn SQL để cập nhật thông tin người dùng trong database
    const query = `UPDATE Class SET ? WHERE classID = ?`;
    db.query(query, [classInfo, _classID], (error, results) => {
        if (error) {
            console.error('Error executing SQL query:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng.' });
        }

        res.json({ message: `Thông tin lớp ${_classID} đã được cập nhật thành công.` });
    });

    });
    
});

router.delete('/deleteClass/:classID', async (req, res) => {
    const classID = req.params.classID;
    let isBooked = 0;
  
    try {
      // Thực hiện truy vấn SQL để kiểm tra trạng thái đặt chỗ
      const queryCheckBooked = 'SELECT isBooked FROM Class WHERE classID = ?';
      const [resultsCheckBooked] = await db.promise().query(queryCheckBooked, [classID]);
      isBooked = resultsCheckBooked[0].isBooked;
  
      const enddate = new Date(resultsCheckBooked[0].end_time);
      const isExpired = enddate < new Date();
  
      if (isBooked === 1 || (isExpired && isBooked === 1)) {
        return res.status(400).json({ message: 'Lớp đã đăng ký không thể xóa - Nếu hết hạn 30 ngày sau hệ thống sẽ tự động xóa!!' });
      }
  
      // Nếu không đăng ký hoặc đã hết hạn, tiếp tục xóa
      const queryDelete = 'DELETE FROM Class WHERE classID = ?';
      await db.promise().query(queryDelete, [classID]);
  
      res.status(200).json({ message: 'Dữ liệu đã được xóa thành công.' });
    } catch (error) {
      console.error('Lỗi khi thực hiện truy vấn SQL:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa dữ liệu.' });
    }
  });

//Post lớp lên
router.post('/insertClass', (req, res) => {
    var { classID, class_name, subID, grade, price, start_time, end_time, detail } = req.body;
    if(req.session.role === 0){
        return res.status(400).json({message:'Hành động không được phép thực hiện !!'});
    }
    classID = 'c' + Math.floor(100000000 + Math.random() * 900000000);
    console.log(classID);
    // Kiểm tra xem có thiếu thông tin nào không
    const requiredFields = ['classID', 'class_name', 'start_time', 'end_time', 'subID', 'grade', 'price', 'detail'];
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ message: `Thiếu thông tin bắt buộc: ${field}` });
        }
    }

    // Thực hiện truy vấn SQL để chèn dữ liệu vào bảng Class
    const query = `INSERT INTO Class (classID, class_name, start_time, end_time, subID, grade, price, detail, tutorID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [classID, class_name, start_time, end_time, subID, grade, price, detail, req.session.userId], (error, results) => {
        if (error) {
            console.error('Lỗi khi thực hiện truy vấn SQL:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm lớp.' });
        }

        res.status(200).json({ message: 'Dữ liệu lớp đã được thêm thành công!!' });
    });
});
router.get('/getAllClasses', (req, res) => {
    const query = `
        SELECT *
        FROM Class
        WHERE isBooked = 1
        GROUP BY accID, classID; 
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Lỗi khi thực hiện truy vấn SQL:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin lớp.' });
        }

        // Trả về dữ liệu lớp
        res.status(200).json({ success: true, classes: results });
    });
});


router.post('/cancelClass', async(req, res) => {
    const { classID } = req.body;

    // Kiểm tra điều kiện trước khi hủy lớp
    const query = 'SELECT * FROM Class WHERE classID = ? AND isBooked = 1 AND start_time > NOW() + INTERVAL 1 DAY';

    db.query(query, [classID], (error, results) => {
        if (error) {
            console.error('Lỗi khi thực hiện truy vấn SQL:', error);
            return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi hủy lớp.' });
        }

        if (results.length > 0) {
            // Cập nhật trạng thái của lớp về chưa đặt
            const updateQuery = 'UPDATE Class SET isBooked = 0, accID = null WHERE classID = ?';
            db.query(updateQuery, [classID], (updateError, updateResults) => {
                if (updateError) {
                    console.error('Lỗi khi cập nhật trạng thái lớp:', updateError);
                    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi hủy lớp.' });
                }

                res.status(200).json({ success: true, message: 'Lớp đã được hủy thành công.' });
            });
        } else {
            // Không đủ điều kiện để hủy lớp
            res.status(400).json({ success: false, message: 'Không thể hủy lớp. Điều kiện không đúng.' });
        }
    });
});

module.exports = router;
