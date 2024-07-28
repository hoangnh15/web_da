const express = require('express');
const router = express.Router();
const axios = require('axios');
const { checkSession } = require('../middleware/session');
const db = require('../config/db');
const momo = require('../utils/CollectionLink');
async function getMOMO(extradt,price) {
    try {
        const result = await momo.Func_MOMO(extradt, price );
        console.log('Response:', result);
        return result;
    } catch (error) {
        console.error('Error:', error);
        return;
    }
}
router.post('/momo',checkSession, async (req, res) => {

    var classID = req.body.classID;
    var price = '';
    if(req.session.role === 1){
        return res.status(400).json({message:'Hành động không được phép thực hiện !!'});
    }
    const query1 = `SELECT price FROM class WHERE classID = '${classID}'`;
    const [result] = await db.promise().query(query1);
    price = result[0].price;
    console.log("PRICE ", price);
    extradt = classID+req.session.userId;
    
    var js_res = await getMOMO(extradt, price);
   // console.log("RRRR",js_res);
   js_res = JSON.parse(js_res);
    var link = js_res.shortLink;
    console.log(link);
    res.status(200).json({message: link});



});

router.post('/api/insertTrans', async(req, res) => {
    const {transID, accID, classID} = req.body;
    const query1 = 'INSERT INTO Trans (transID, accID, classID) VALUES (?, ?, ?)';
    try{
        await db.promise().query(query1,[transID,accID,classID]);
        console.log("nhap trans thanh cong");
    }
    catch(error){
        console.log(error);
        return res.status(400).json({message: 'Lỗi!'});

    }

    const query2 = `UPDATE Class SET accID = '${accID}', isBooked = 1 WHERE classID = '${classID}'`;

    try{
        await db.promise().query(query2);
        console.log("upate thanh cong");
        return res.status(200).json({message: 'cap nhat lop thanh cong'});
    }
    catch(error){
        console.log(error);
        return res.status(400).json({message: 'Lỗi!'});

    }
});

module.exports = router;
