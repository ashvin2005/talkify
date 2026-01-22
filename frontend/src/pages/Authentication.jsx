import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Google } from '@mui/icons-material';
import axios from 'axios';
import { server } from '../environment';
import { AuthContext } from '../contexts/AuthContext';


function Authentication() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

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

  const showError = (message) => {
    setError(message);
    setOpenSnackbar(true);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${server}/api/v1/users/login`, {
        username: formData.username,
        password: formData.password,
      });

      const { token, user } = response.data;
      login(user, token);
      navigate('/home');
    } catch (err) {
      console.error('Login failed:', err);
      showError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      showError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(`${server}/api/v1/users/register`, {
        name: formData.name,
        username: formData.username,
        password: formData.password,
      });

      setTab(0);
      setFormData({ name: '', username: '', password: '' });
      showError('Registration successful! Please login.');
    } catch (err) {
      console.error('Registration failed:', err);
      showError(
        err.response?.data?.message ||
          'Registration failed. Username might already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (tab === 0) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await axios.post(
        `${server}/api/v1/users/google-auth`,
        { idToken }
      );

      const { token, user } = response.data;
      login(user, token);
      navigate('/home');
    } catch (err) {
      console.error('Google sign-in failed:', err);
      showError(
        err.response?.data?.message ||
          'Google sign-in failed. Please try again.'
      );
    } finally {
      setLoading(false);
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
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : tab === 0 ? (
            'Login'
          ) : (
            'Register'
          )}
        </Button>

        <div className="text-center my-4 text-gray-500">OR</div>

        <Button
          fullWidth
          variant="outlined"
          startIcon={!loading && <Google />}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Continue with Google'}
        </Button>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Authentication;
