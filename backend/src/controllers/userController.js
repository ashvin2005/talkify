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
