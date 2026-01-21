import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Tabs, Tab, Box } from '@mui/material';
import axios from 'axios';
import { server } from '../environment';
import { AuthContext } from '../contexts/AuthContext';
import { Google } from '@mui/icons-material';

function Authentication() {

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const response = await axios.post(`${server}/api/v1/users/google-auth`, {
        idToken,
      });
      const { token, user } = response.data;
      login(user, token);
      navigate('/home');
    } catch (error) {
      console.error('Google sign-in failed:', error);
      alert('Google sign-in failed. Please try again.');
    }
  };
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
  });
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${server}/api/v1/users/login`, {
        username: formData.username,
        password: formData.password,
      });

      const { token, user } = response.data;
      login(user, token);
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleSubmit = () => {
    if (tab === 0) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Box className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Talkify</h2>
        
        <Tabs value={tab} onChange={(e, v) => setTab(v)} className="mb-6">
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {tab === 1 && (
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
          />
        )}
        
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          margin="normal"
        />
        
        <TextField
          fullWidth
          type="password"
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
        />

        <Button
          fullWidth
          variant="contained"
          className="mt-4"
          onClick={handleSubmit}
        >
          {tab === 0 ? 'Login' : 'Register'}
        </Button>
      </Box>
    </div>
  );
}


const handleRegister = async () => {
  if (!formData.name || !formData.username || !formData.password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    await axios.post(`${server}/api/v1/users/register`, {
      name: formData.name,
      username: formData.username,
      password: formData.password,
    });

    alert('Registration successful! Please login.');
    setTab(0); 
    setFormData({ name: '', username: '', password: '' });
  } catch (error) {
    console.error('Registration failed:', error);
    alert('Registration failed. Username might already exist.');
  }
};


const handleSubmit = () => {
  if (tab === 0) {
    handleLogin();
  } else {
    handleRegister();
  }
};




export default Authentication;
