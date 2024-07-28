const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const db = require('./config/db');
const sessionConfig = require('./config/session');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const classRoutes = require('./routes/class');
const momoRoutes = require('./routes/momo');
const walletRoutes = require('./routes/wallet')

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session(sessionConfig));

// Serve index.html on the root path
const publicPath = '../Public'
app.use(express.static(publicPath))
app.get('/', (req, res) => {
    const indexPath = '../Public/index.html';
    res.sendFile(indexPath);
});
app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';"
    );
    next();
  });
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', classRoutes);
app.use('/api', momoRoutes);
app.use('/api', walletRoutes);






app.listen(3000, () => {
    console.log('Server started on port 3000');
});
