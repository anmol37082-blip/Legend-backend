const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lagend');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Error:', err.message);
    process.exit(1);
  }
};

// Email Schema
const emailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  }
});

const Email = mongoose.model('Email', emailSchema);

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lagend API is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Subscribe to newsletter
app.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    // Check if already subscribed
    const exists = await Email.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(200).json({ 
        success: true,
        message: 'You are already subscribed!' 
      });
    }

    // Save new email
    const newEmail = new Email({ email: email.toLowerCase() });
    await newEmail.save();

    res.status(201).json({ 
      success: true,
      message: 'Subscribed successfully!' 
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Something went wrong. Please try again.' 
    });
  }
});

// Get all subscribers (admin use)
app.get('/subscribers', async (req, res) => {
  try {
    const subscribers = await Email.find().sort({ subscribedAt: -1 });
    res.json({
      success: true,
      count: subscribers.length,
      subscribers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch subscribers' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
});
