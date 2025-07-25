const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT error:', err.message);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = decoded;
    next();
  });
};

exports.setHospitalContext = (req, res, next) => {
  const hospitalId = req.headers['x-hospital-id'];
  if (!hospitalId) {
    return res.status(400).json({ message: 'Hospital ID header is required' });
  }
  req.hospital = hospitalId;
  next();
};

exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};