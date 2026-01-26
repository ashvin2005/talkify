import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

function VideoMeet() {
  const { roomCode } = useParams();
  const [joined, setJoined] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        localStreamRef.current = stream;
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
        alert('Camera or microphone access denied');
      });

    // Optional cleanup (good practice)
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
      <h1 className="text-white text-xl mb-4">
        Room: {roomCode}
      </h1>

      <div className="w-80 h-60 bg-black rounded-lg overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

export default VideoMeet;
