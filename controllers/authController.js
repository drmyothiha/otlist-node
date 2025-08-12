const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

// List of valid roles
const VALID_ROLES = ['admin', 'doctor', 'nurse', 'icu'];
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    

    const { username, password, role = 'icu' } = req.body;

    // 1. Input validation
    console.log(`Validating input - username: ${username}, role: ${role}`);
    if (!username || !password) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 2. Role validation
    if (role && !VALID_ROLES.includes(role)) {
      console.error(`Invalid role attempted: ${role}`);
      return res.status(400).json({ 
        error: 'Invalid role specified',
        validRoles: VALID_ROLES 
      });
    }

    // admin account ဖွင့်ခွင့်ကို ပိတ်ရန်
    // if (role === 'admin') {
    //   console.error('Admin registration attempt blocked');
    //   return res.status(403).json({ 
    //     error: 'Admin registration is restricted',
    //     suggestion: 'Contact system administrator' 
    //   });
    // }

    // 3. Check for existing user
    console.log(`Checking if user exists: ${username}`);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.error('Username already exists');
      return res.status(409).json({ 
        error: 'Username already exists',
        suggestion: 'Try a different username or login instead' 
      });
    }

    // 4. Create new user
    console.log('Creating new user');
    const newUser = new User({ username, password, role });
    
    // 5. Save user
    console.log('Attempting to save user');
    await newUser.save();
    
    console.log('User registered successfully:', { 
      username: newUser.username, 
      role: newUser.role,
      id: newUser._id 
    });

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        username: newUser.username,
        role: newUser.role,
        id: newUser._id
      }
    });

  } catch (err) {
    console.error('Registration error:', {
      error: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    
    // Handle specific Mongoose errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }
    
    // Handle duplicate key error (even if we checked earlier)
    if (err.code === 11000) {
      return res.status(409).json({ 
        error: 'Username already exists',
        details: 'Duplicate key error' 
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create token payload
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // Respond with token and user info
    res.status(200).json({
      success: true,
      token,
      role: user.role,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};