require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Patient = require('./models/Patient');
const User = require('./models/User');
const app = express();
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON' });
      throw new Error('Bad JSON');
    }
  }
}));
app.use(cors());



// Middleware - REORDERED AND SIMPLIFIED
app.use(cors());  // CORS first
app.use(express.json());  // Then JSON parsing
app.use(express.urlencoded({ extended: true }));  // Optional for form data

// MongoDB Connection 
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

// Enhanced Auth Routes with better error handling
app.post('/api/auth/register', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'Request body cannot be empty' });
  }

  console.log('Received RAW body:', req.body); // Should now show your data

  try {
    // Add input validation
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const { username, password, role = 'user' } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Temporary test route
app.get('/test-bcrypt', async (req, res) => {
  const plain = 'test';
  const hash = await bcrypt.hash(plain, 10);
  const match = await bcrypt.compare(plain, hash);
  
  res.json({
    plainText: plain,
    generatedHash: hash,
    comparisonResult: match
  });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Raw request body:', req.body); // Add this line
    
    const { username, password } = req.body;
    
    console.log('Login attempt:', { 
      username, 
      inputPassword: password,
      currentTime: new Date().toISOString()
    });

    const user = await User.findOne({ username });
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', {
      username: user.username,
      storedHash: user.password,
      createdAt: user.createdAt
    });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch details:', {
        inputLength: password.length,
        hashLength: user.password.length,
        hashPrefix: user.password.substring(0, 10)
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
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

// Role-based Middleware (optional)
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// Add this temporary route to properly reset the password
app.get('/fix-pass', async (req, res) => {
  try {
    const user = await User.findOne({ username: 'test' });
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // Generate a new hash with proper salt rounds
    user.password = await bcrypt.hash('test', 10);
    await user.save();
    
    // Verify the new hash works
    const isMatch = await bcrypt.compare('test', user.password);
    
    res.send(`Password reset done. Verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.get('/bcrypt-test', async (req, res) => {
  try {
    const plainText = 'test123';
    console.log('Plain text:', plainText);
    
    // Generate hash
    const hash = await bcrypt.hash(plainText, 10);
    console.log('Generated hash:', hash);
    
    // Immediate comparison
    const match = await bcrypt.compare(plainText, hash);
    console.log('Comparison result:', match);
    
    res.json({
      success: match,
      hash: hash,
      length: hash.length
    });
  } catch (error) {
    console.error('Bcrypt test error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Temporary testing routes (NO BCRYPT)
app.post('/api/auth/register-test', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Store password in plain text (ONLY FOR TESTING)
    const user = new User({ 
      username, 
      password, // Storing plain text password
      role: 'user' 
    });

    await user.save();
    res.status(201).json({ message: 'User created (TEST MODE)' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login-test', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare plain text passwords (INSECURE - TESTING ONLY)
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Temporary route to test raw body parsing
app.post('/api/raw-test', express.raw({ type: '*/*' }), (req, res) => {
  console.log('Raw body:', req.body.toString());
  res.send('Check server logs');
});

// Protected Routes (with JWT verification)
app.use('/api/patients', verifyToken); // Protect all patient routes

// Patient Routes (unchanged but now protected)
app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});