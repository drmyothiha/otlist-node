require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// အမှတ် (၁) ကုတင် (၁၀၀၀)အတွက်ပဲ လောလောဆယ် ယာယီအနေနဲ့ ထည့်ထားတာပါ။ 
// နောက်ဆို တစ်နိုင်ငံလုံးဆေးရုံတွေ သုံးမယ်ဆို User registration ကတည်းက ဆေးရုံ ID တစ်ခါတည်း ထည့်တာလုပ်ပေးရန်။ 
// New patient ထည့်တိုင်း လူနာတက်သည့် ဆေးရုံ ID အား အလိုအလျောက်ထည့်သွင်းရန်
app.use((req, res, next) => {
  if (!req.headers['x-hospital-id']) {
    req.headers['x-hospital-id'] = 'dsgh1';
  }
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const icuPatientRoutes = require('./routes/icupatientRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/OTpatients', patientRoutes);
app.use('/api/ICUpatients', icuPatientRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});