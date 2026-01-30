import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { server } from '../environment';

function VideoMeet() {
  const { roomCode } = useParams();
  const [joined, setJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState({});

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  const peers = useRef({});


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


  useEffect(() => {
    socketRef.current = io(server);

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('room-joined', (code) => {
      console.log('Joined room:', code);
    });

    socketRef.current.on('user-joined', async (socketId) => {
      const peer = createPeerConnection(socketId);
      peers.current[socketId] = peer;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current);
        });
      }

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socketRef.current.emit('signal', socketId, {
        type: 'offer',
        offer,
      });
    });

    socketRef.current.on('signal', async (fromId, message) => {
      if (message.type === 'offer') {
        const peer = createPeerConnection(fromId);
        peers.current[fromId] = peer;

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            peer.addTrack(track, localStreamRef.current);
          });
        }

        await peer.setRemoteDescription(message.offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socketRef.current.emit('signal', fromId, {
          type: 'answer',
          answer,
        });
      } else if (message.type === 'answer') {
        await peers.current[fromId]?.setRemoteDescription(message.answer);
      } else if (message.type === 'candidate') {
        await peers.current[fromId]?.addIceCandidate(message.candidate);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const createPeerConnection = (socketId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', socketId, {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };


    peer.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [socketId]: event.streams[0],
      }));
    };

    return peer;
  };

  const joinCall = () => {
    if (socketRef.current && !joined) {
      socketRef.current.emit('join-call', roomCode);
      setJoined(true);
    }
  };

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


      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <video
            key={id}
            autoPlay
            playsInline
            ref={(el) => {
              if (el) el.srcObject = stream;
            }}
            className="w-60 h-44 bg-black rounded object-cover"
          />
        ))}
      </div>

      <div className="flex gap-4 mb-4">
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

      <button
        onClick={joinCall}
        disabled={joined}
        className={`px-6 py-2 rounded text-white ${
          joined ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {joined ? 'Joined' : 'Join Call'}
      </button>
    </div>
  );
}

export default VideoMeet;
