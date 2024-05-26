const sessions = {};

function checkSession(req, res, next) {
    const sessionId = req.cookies.sessionId;
    if (sessionId && sessions[sessionId]) {
        req.session = sessions[sessionId];
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports = { sessions, checkSession };
