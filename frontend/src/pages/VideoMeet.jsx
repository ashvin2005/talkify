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


  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');

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

        localStreamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current);
        });

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


    socketRef.current.on('chat-message', (data, sender, socketId) => {
      setMessages((prev) => [...prev, { sender, data, socketId }]);
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

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    socketRef.current.emit('chat-message', messageInput, 'You');
    setMessageInput('');
  };

  const joinCall = () => {
    if (socketRef.current && !joined) {
      socketRef.current.emit('join-call', roomCode);
      setJoined(true);
    }
  };

  const toggleAudio = () => {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setAudioEnabled(audioTrack.enabled);
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setVideoEnabled(videoTrack.enabled);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">

      <div className="flex-1 flex flex-col items-center p-6">
        <h1 className="text-white text-xl mb-4">Room: {roomCode}</h1>

        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-80 h-60 bg-black rounded mb-4"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <video
              key={id}
              autoPlay
              playsInline
              ref={(el) => el && (el.srcObject = stream)}
              className="w-60 h-44 bg-black rounded"
            />
          ))}
        </div>

        <div className="flex gap-4 mb-4">
          <button onClick={toggleAudio} className="px-4 py-2 bg-gray-700 text-white rounded">
            {audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
          </button>
          <button onClick={toggleVideo} className="px-4 py-2 bg-gray-700 text-white rounded">
            {videoEnabled ? 'Camera Off' : 'Camera On'}
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} className="px-4 py-2 bg-blue-600 text-white rounded">
            Chat
          </button>
        </div>

        <button
          onClick={joinCall}
          disabled={joined}
          className="px-6 py-2 bg-green-600 text-white rounded"
        >
          {joined ? 'Joined' : 'Join Call'}
        </button>
      </div>


      {chatOpen && (
        <div className="w-80 bg-gray-800 p-4 flex flex-col">
          <h2 className="text-white mb-2">Chat</h2>

          <div className="flex-1 overflow-y-auto mb-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-white text-sm mb-1">
                <strong>{msg.sender}:</strong> {msg.data}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-2 py-1 rounded"
              placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="px-3 py-1 bg-blue-600 text-white rounded">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoMeet;
