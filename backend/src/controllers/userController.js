import { db } from '../firebase.js';

export const getHealth = async (req, res) => {
  try {
    res.status(200).json({ message: 'User service healthy' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const userRef = db.collection('users').doc(username);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userRef.set({
      name,
      username,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  try {
    const userRef = db.collection('users').doc(username);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userSnap.data();
    const isValid = await bcrypt.compare(password, userData.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    await userRef.update({ token });

    res.status(200).json({
      token,
      user: { username: userData.username, name: userData.name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
