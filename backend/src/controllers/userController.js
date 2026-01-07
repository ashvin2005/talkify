import { db } from '../firebase.js';

export const getHealth = async (req, res) => {
  try {
    res.status(200).json({ message: 'User service healthy' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
