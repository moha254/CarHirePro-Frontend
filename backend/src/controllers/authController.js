import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  return res.json(req.user);
};

// Create demo users if they don't exist
export const createDemoUsers = async () => {
  try {
    const demoUsers = [
      { name: 'Director User', email: 'director@carhire.com', password: 'Password125', role: 'Director' },
    ];

    // Create a real user for the director
    const directorUser = { name: 'Real Director User', email: 'director2@shilaabo.com', password: 'Password125', role: 'Director' };
    const existingDirector = await User.findOne({ email: directorUser.email });
    if (!existingDirector) {
      await User.create(directorUser);
      console.log(`✅ Created director user: ${directorUser.email}`);
    }

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`✅ Created demo user: ${userData.email}`);
      }
    }
  } catch (err) {
    console.error('❌ Error creating demo users:', err.message);
  }
};


