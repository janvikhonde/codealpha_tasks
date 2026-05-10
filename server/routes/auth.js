const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOtpEmail } = require('../utils/sendOtp');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified)
      return res.status(409).json({ message: 'Email already in use' });

    const otp = generateOTP();
    const otpExpiry = new Date(
      Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000
    );

    let user = existing || new User({ name, email, password });
    user.name = name;
    user.password = password;
    user.otpCode = otp;
    user.otpExpiry = otpExpiry;
    user.isVerified = false;
    await user.save();

    await sendOtpEmail(email, otp);
    res.status(201).json({ message: 'OTP sent to email', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otpCode !== otp)
      return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < new Date())
      return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpiry = new Date(
      Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000
    );
    await user.save();

    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isVerified)
      return res.status(403).json({ message: 'Email not verified', email });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/authMiddleware').protect, (req, res) => {
  res.json(req.user);
});

// PATCH /api/auth/profile
router.patch('/profile', require('../middleware/authMiddleware').protect, async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (color) updates.color = color;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;