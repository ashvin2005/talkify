import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { server } from '../environment';

function VideoMeet() {
  const { roomCode } = useParams();
  const [joined, setJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  // 🎥 Get camera + mic
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

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 🔌 Connect to Socket.IO server
  useEffect(() => {
    socketRef.current = io(server);

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const toggleAudio = () => {
    const localStream = localStreamRef.current;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    const localStream = localStreamRef.current;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
      <h1 className="text-white text-xl mb-4">
        Room: {roomCode}
      </h1>

      <div className="w-80 h-60 bg-black rounded-lg overflow-hidden mb-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={toggleAudio}
          className={`px-4 py-2 rounded text-white ${
            audioEnabled ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
        </button>

        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded text-white ${
            videoEnabled ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {videoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
        </button>
      </div>
    </div>
  );
}

export default VideoMeet;
