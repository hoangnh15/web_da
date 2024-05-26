function isAuthenticated(req, res, next) {
    const sessionId = req.cookies.session_id;
    if (sessionId && sessions[sessionId]) {
        req.session = sessions[sessionId];
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = { isAuthenticated };
