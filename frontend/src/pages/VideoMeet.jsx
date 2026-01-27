import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

function VideoMeet() {
  const { roomCode } = useParams();
  const [joined, setJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

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

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
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

      <button
        onClick={toggleAudio}
        className={`px-4 py-2 rounded text-white ${
          audioEnabled ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
      </button>
    </div>
  );
}

export default VideoMeet;
