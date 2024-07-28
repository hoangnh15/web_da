

const csrfProtection = (req, res, next) => {
    const clientToken = req.headers['x-csrf-token'] || req.body.csrfToken || req.query.csrfToken;
    const tokenFromCookie = req.cookies.csrfToken
    if (!clientToken || clientToken !== tokenFromCookie) {
      return res.status(403).send('CSRF Token không hợp lệ')
    }
    next()
  }

module.exports = csrfProtection ;