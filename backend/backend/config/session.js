module.exports = {
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutes
};
