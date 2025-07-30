module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'jwt_secret_key',
  JWT_EXPIRES_IN: '30d'
};

// Set hospital context for all requests
exports.setHospitalContext = (req, res, next) => {
  // In future can get from JWT or headers
  req.hospital = req.headers['x-hospital-id'] || 'dsgh1'; 
  next();
};