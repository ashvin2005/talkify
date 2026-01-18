import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-bold text-white text-center mb-8">
          Welcome to Talkify
        </h1>
        <p className="text-xl text-white text-center mb-12">
          Connect with anyone, anywhere through video calls
        </p>
        <div className="flex justify-center">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth')}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
