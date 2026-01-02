import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  IconButton,
  TextField,
  Button,
  Badge,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  CallEnd,
  Mic,
  MicOff,
  Chat,
  People,
  MoreVert,
  Close,
  Info,

  Settings,
  Fullscreen,
  FullscreenExit,

} from "@mui/icons-material";
import server from "../environment";
import { useAuth } from "../contexts/AuthContext";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const server_url = server;
const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function VideoMeetComponent() {
  const navigate = useNavigate();
  const { userData, addToUserHistory, token } = useAuth();
  const connectionsRef = useRef({});
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([]);
  const chatContainerRef = useRef();
  const participantsContainerRef = useRef();
  const meetingContainerRef = useRef();
  const reconnectAttemptsRef = useRef(0);


  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState(userData?.name || "");
  const [videos, setVideos] = useState([]);
  const [meetingCode, setMeetingCode] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [participants, setParticipants] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [loading, setLoading] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);


  // New crazy features states
  const [reactions, setReactions] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [isPiPMode, setIsPiPMode] = useState(false);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // Extract meeting code from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    let code = pathParts[pathParts.length - 1];

    if (!code || code.length < 3) {
      code = generateRandomCode();
      navigate(`/meet/${code}`, { replace: true });
    }

    setMeetingCode(code);
    setShowJoinDialog(true);
  }, [navigate]);

  // Timer effects
  useEffect(() => {
    let timer;
    if (connectionStatus === "connected") {
      timer = setInterval(() => {
        setMeetingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectionStatus]);



  const formatMeetingTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours > 0 ? hours + ":" : ""}${minutes < 10 ? "0" + minutes : minutes
      }:${secs < 10 ? "0" + secs : secs}`;
  };



  // New feature handlers
  const sendReaction = (emoji) => {
    const id = Date.now();
    setReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
    showSnackbar(`You reacted with ${emoji}`, "info");
  };

  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    showSnackbar(handRaised ? "Hand lowered" : "Hand raised ✋", "success");
  };



  // Additional crazy feature handlers
  const triggerConfetti = () => {
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
      color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][Math.floor(Math.random() * 6)]
    }));
    setConfettiPieces(pieces);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setConfettiPieces([]);
    }, 4000);
    showSnackbar("🎉 Celebration! 🎉", "success");
  };

  const togglePiP = async () => {
    if (localVideoref.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiPMode(false);
          showSnackbar("Exited Picture-in-Picture", "info");
        } else {
          const pipWindow = await localVideoref.current.requestPictureInPicture();
          setIsPiPMode(true);
          showSnackbar("Entered Picture-in-Picture mode", "success");

          // Handle PiP window close event
          pipWindow.addEventListener('pagehide', () => {
            setIsPiPMode(false);
          });
        }
      } catch (error) {
        console.error("PiP error:", error);
        showSnackbar("Picture-in-Picture not available", "error");
      }
    }
  };



  const toggleFullscreen = () => {
    if (!fullscreen) {
      if (meetingContainerRef.current.requestFullscreen) {
        meetingContainerRef.current.requestFullscreen();
      } else if (meetingContainerRef.current.webkitRequestFullscreen) {
        meetingContainerRef.current.webkitRequestFullscreen();
      }
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setFullscreen(false);
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Stable callback for video element to prevent flickering on re-renders
  const setVideoRef = React.useCallback((node) => {
    localVideoref.current = node;
    if (node && window.localStream) {
      node.srcObject = window.localStream;
    }
  }, []);

  const handleJoinMeeting = async () => {
    setShowJoinDialog(false);
    if (!username.trim()) {
      showSnackbar("Please enter your name", "error");
      return;
    }
    setAskForUsername(false);

    // Add meeting to history in background
    if (addToUserHistory && meetingCode) {
      addToUserHistory(meetingCode).catch(error => {
        console.error("Background - Error adding to history:", error);
      });
    }

    // Ensure we start with correct state, but don't re-run permission check which kills stream
    connectToSocketServer();
    // Re-trigger getUserMedia only if we really need to ensure stream freshness, 
    // but usually we can just rely on the existing window.localStream.
    // However, calling it ensures we have the latest device if anything changed.
    // But importantly, we REMOVE the getPermissions() call that was stopping tracks.
    if (!window.localStream || !window.localStream.active) {
      getUserMedia();
    } else {
      // Just to be safe, re-assign to ref if needed, but the callback ref on the video element will handle it
    }
  };

  const getPermissions = async () => {
    try {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoStream.getTracks().forEach((track) => track.stop());
        setVideoAvailable(true);
        setVideo(true); // Auto-start camera when permission is granted
      } catch (err) {
        console.warn("Video permissions denied:", err);
        setVideoAvailable(false);
        setVideo(false);
        showSnackbar(
          "Camera access was denied. You can enable it later in browser settings.",
          "warning"
        );
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioAvailable(true);
      } catch (err) {
        console.warn("Audio permissions denied:", err);
        setAudioAvailable(false);
        setAudio(false);
        showSnackbar(
          "Microphone access was denied. You can enable it later in browser settings.",
          "warning"
        );
      }
    } catch (err) {
      console.error("Permissions error:", err);
      showSnackbar("Error checking media permissions", "error");
    }
  };

  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    Object.keys(connectionsRef.current).forEach((id) => {
      if (id === socketIdRef.current) return;

      try {
        const senders = connectionsRef.current[id].getSenders();
        senders.forEach((sender) =>
          connectionsRef.current[id].removeTrack(sender)
        );

        stream.getTracks().forEach((track) => {
          connectionsRef.current[id].addTrack(track, stream);
        });

        connectionsRef.current[id]
          .createOffer()
          .then((offer) =>
            connectionsRef.current[id].setLocalDescription(offer)
          )
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connectionsRef.current[id].localDescription,
              })
            );
          })
          .catch((e) => console.log(e));
      } catch (e) {
        console.log(e);
      }
    });

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        if (track.kind === "video") setVideo(false);
        if (track.kind === "audio") setAudio(false);
      };
    });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable,
        })
        .then(getUserMediaSuccess)
        .catch((err) => {
          console.error("Error getting user media:", err);
          showSnackbar("Error accessing media devices", "error");
        });
    } else {
      try {
        if (localVideoref.current && localVideoref.current.srcObject) {
          const tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleReconnect = () => {
    if (reconnectAttemptsRef.current < 5) {
      reconnectAttemptsRef.current += 1;
      const delay = Math.min(1000 * reconnectAttemptsRef.current, 5000);

      showSnackbar(
        `Attempting to reconnect (${reconnectAttemptsRef.current}/5)`,
        "info"
      );

      setTimeout(() => {
        connectToSocketServer();
      }, delay);
    } else {
      showSnackbar(
        "Failed to reconnect after multiple attempts. Please refresh the page.",
        "error"
      );
      setReconnecting(false);
      setConnectionStatus("disconnected");
    }
  };

  const connectToSocketServer = () => {
    if (!meetingCode) return;

    setLoading(true);
    setConnectionStatus("connecting");

    socketRef.current = io.connect(server_url, {
      secure: false,
      query: {
        room: meetingCode,
        username: username,
        token: token,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token,
      },
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnectionStatus("disconnected");
      setLoading(false);
      setReconnecting(true);
      handleReconnect();
    });

    socketRef.current.on("reconnect_failed", () => {
      setConnectionStatus("disconnected");
      setLoading(false);
      setReconnecting(false);
      showSnackbar(
        "Failed to reconnect to server. Please refresh the page.",
        "error"
      );
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus("connected");
      setLoading(false);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      showSnackbar("Reconnected to the meeting", "success");

      if (meetingCode) {
        socketRef.current.emit("join-call", meetingCode);
      }
    });

    socketRef.current.on("connect", () => {
      setConnectionStatus("connected");
      setLoading(false);
      reconnectAttemptsRef.current = 0;
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", meetingCode);
    });

    socketRef.current.on("room-joined", (room) => {
      showSnackbar(`Joined meeting room: ${room}`, "success");
    });

    socketRef.current.on("join-error", (error) => {
      setConnectionStatus("disconnected");
      setLoading(false);
      showSnackbar(`Error joining room: ${error}`, "error");
    });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      if (connectionsRef.current[id]) {
        connectionsRef.current[id].close();
        delete connectionsRef.current[id];
      }
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      showSnackbar(
        `${participants.find((p) => p.id === id)?.name || "A participant"
        } left the meeting`,
        "info"
      );
    });

    socketRef.current.on("user-joined", (id, clients) => {
      setParticipants((prev) => {
        // Create map of existing participants to preserve any extra state if needed
        const existingParticipants = new Map(prev.map((p) => [p.id, p]));

        // Map clients to participant objects
        const merged = clients.map((client) => {
          // Check if client is object with username or just ID
          const clientId = typeof client === 'object' ? client.socketId : client;
          const clientName = typeof client === 'object' ? client.username : `User ${clientId.slice(0, 4)}`;

          // Use existing participant if found, otherwise create new one
          if (existingParticipants.has(clientId)) {
            return {
              ...existingParticipants.get(clientId),
              name: clientName // Update name just in case
            };
          }

          return {
            id: clientId,
            name: clientId === socketIdRef.current ? username : clientName,
          };
        });
        return merged;
      });

      if (id !== socketIdRef.current) {
        showSnackbar(`New participant joined`, "info");
      }

      clients.forEach((socketListId) => {
        if (
          !connectionsRef.current[socketListId] &&
          socketListId !== socketIdRef.current
        ) {
          const peerConnection = new RTCPeerConnection(peerConfigConnections);
          connectionsRef.current[socketListId] = peerConnection;

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          peerConnection.ontrack = (event) => {
            setVideos((prevVideos) => {
              const videoExists = prevVideos.some(
                (video) => video.socketId === socketListId
              );
              if (videoExists) {
                return prevVideos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.streams[0] }
                    : video
                );
              } else {
                return [
                  ...prevVideos,
                  {
                    socketId: socketListId,
                    stream: event.streams[0],
                    autoplay: true,
                    playsinline: true,
                  },
                ];
              }
            });
          };

          peerConnection.oniceconnectionstatechange = () => {
            if (
              peerConnection.iceConnectionState === "disconnected" ||
              peerConnection.iceConnectionState === "failed"
            ) {
              if (connectionsRef.current[socketListId]) {
                connectionsRef.current[socketListId].close();
                delete connectionsRef.current[socketListId];
              }
              setVideos((prev) =>
                prev.filter((v) => v.socketId !== socketListId)
              );
              setParticipants((prev) =>
                prev.filter((p) => p.id !== socketListId)
              );
            }
          };

          if (window.localStream) {
            window.localStream.getTracks().forEach((track) => {
              peerConnection.addTrack(track, window.localStream);
            });
          }

          if (socketListId > socketIdRef.current) {
            peerConnection
              .createOffer()
              .then((offer) => peerConnection.setLocalDescription(offer))
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ sdp: peerConnection.localDescription })
                );
              })
              .catch((err) => {
                console.error("Error creating offer:", err);
                showSnackbar("Error establishing connection", "error");
              });
          }
        }
      });
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    if (!connectionsRef.current[fromId]) {
      const peerConnection = new RTCPeerConnection(peerConfigConnections);
      connectionsRef.current[fromId] = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ ice: event.candidate })
          );
        }
      };

      peerConnection.ontrack = (event) => {
        setVideos((prevVideos) => {
          const videoExists = prevVideos.some(
            (video) => video.socketId === fromId
          );
          if (videoExists) {
            return prevVideos.map((video) =>
              video.socketId === fromId
                ? { ...video, stream: event.streams[0] }
                : video
            );
          } else {
            return [
              ...prevVideos,
              {
                socketId: fromId,
                stream: event.streams[0],
                autoplay: true,
                playsinline: true,
              },
            ];
          }
        });
      };

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, window.localStream);
        });
      }
    }

    const peerConnection = connectionsRef.current[fromId];

    if (signal.sdp) {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            return peerConnection
              .createAnswer()
              .then((answer) => peerConnection.setLocalDescription(answer))
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  fromId,
                  JSON.stringify({ sdp: peerConnection.localDescription })
                );
              });
          }
        })
        .catch((err) => {
          console.error("Error handling SDP:", err);
          showSnackbar("Error establishing connection", "error");
        });
    }

    if (signal.ice) {
      peerConnection
        .addIceCandidate(new RTCIceCandidate(signal.ice))
        .catch((err) => {
          console.error("Error adding ICE candidate:", err);
          showSnackbar("Connection issue detected", "warning");
        });
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [...prev, { sender, data, timestamp: new Date() }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
    }
  };

  const handleVideo = () => {
    setVideo((prev) => {
      const newValue = !prev;
      if (newValue && !videoAvailable) {
        showSnackbar(
          "Camera permissions denied. Please enable camera access in your browser settings.",
          "error"
        );
        return false;
      }
      return newValue;
    });
  };

  const handleAudio = () => {
    setAudio((prev) => {
      const newValue = !prev;
      if (newValue && !audioAvailable) {
        showSnackbar(
          "Microphone permissions denied. Please enable microphone access in your browser settings.",
          "error"
        );
        return false;
      }
      return newValue;
    });
  };

  const handleEndCall = async () => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }

      Object.keys(connectionsRef.current).forEach((id) => {
        if (connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
        }
      });

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      if (userData && meetingCode) {
        try {
          await addToUserHistory(meetingCode);
        } catch (err) {
          console.error("Failed to add meeting to history:", err);
          showSnackbar("Failed to save meeting history", "error");
        }
      }

      navigate("/home");
    } catch (err) {
      console.error("Error ending call:", err);
      showSnackbar("Error ending call", "error");
      navigate("/home");
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCopyMeetingCode = () => {
    navigator.clipboard.writeText(meetingCode);
    showSnackbar("Meeting code copied to clipboard", "success");
  };

  useEffect(() => {
    if (userData) {
      setUsername(userData.name);
      setAskForUsername(false);
    }
  }, [userData]);

  useEffect(() => {
    return () => {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }

      Object.keys(connectionsRef.current).forEach((id) => {
        if (connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
        }
      });

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-start camera when join dialog is shown
  useEffect(() => {
    if (showJoinDialog) {
      getPermissions();
    }
  }, [showJoinDialog]);

  // Handle Picture-in-Picture events
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiPMode(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  return (
    <div
      className="flex flex-col w-full h-screen bg-black text-white relative"
      ref={meetingContainerRef}
    >
      <div className="absolute inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#000000" } },
            fpsLimit: 60,
            interactivity: {
              events: {
                onHover: { enable: true, mode: "repulse" },
                resize: true,
              },
              modes: { repulse: { distance: 100, duration: 0.4 } },
            },
            particles: {
              color: { value: "#ff0000" },
              links: {
                color: "#ff0000",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 40,
              },
              opacity: { value: 0.3 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-5 -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-5 -z-10"></div>

      <Dialog
        open={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="bg-gray-900 text-white">
          Join Meeting
        </DialogTitle>
        <DialogContent className="bg-gray-900 text-white">
          <div className="flex flex-col items-center py-6">
            <div className="mb-6 flex justify-center">
              <div className="relative w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                {video ? (
                  <video
                    ref={setVideoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "rotateY(180deg)" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                      <Avatar className="w-16 h-16 text-3xl">
                        {username.charAt(0).toUpperCase()}
                      </Avatar>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <TextField
              fullWidth
              label="Your Name"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                className: "text-white",
                style: { color: '#fff' }
              }}
              InputLabelProps={{
                className: "text-gray-300",
                style: { color: '#d1d5db' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4b5563' },
                  '&:hover fieldset': { borderColor: '#8b5cf6' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                },
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#d1d5db' },
              }}
              className="mb-4"
            />

            <div className="flex gap-2 mb-4">
              <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                <Button
                  onClick={() => setVideo(!video)}
                  variant={video ? "contained" : "outlined"}
                  color={video ? "primary" : "inherit"}
                  startIcon={video ? <Videocam /> : <VideocamOff />}
                >
                  {video ? "Camera On" : "Camera Off"}
                </Button>
              </Tooltip>

              <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                <Button
                  onClick={() => setAudio(!audio)}
                  variant={audio ? "contained" : "outlined"}
                  color={audio ? "primary" : "inherit"}
                  startIcon={audio ? <Mic /> : <MicOff />}
                >
                  {audio ? "Mic On" : "Mic Off"}
                </Button>
              </Tooltip>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 text-center w-full">
              <p className="text-sm text-gray-300 font-medium">Meeting Code</p>
              <p className="font-mono text-2xl font-bold text-white mt-1">{meetingCode}</p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="bg-gray-900">
          <Button onClick={() => navigate("/home")} className="text-white">
            Cancel
          </Button>
          <Button
            onClick={handleJoinMeeting}
            variant="contained"
            disabled={loading}
            style={{
              background: 'linear-gradient(to right, #8b5cf6, #3b82f6)',
              color: '#fff'
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Join Meeting"}
          </Button>
        </DialogActions>
      </Dialog>

      {(loading || reconnecting) && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
          <div className="text-center">
            <CircularProgress size={60} />
            <p className="mt-4 text-xl">
              {reconnecting ? "Reconnecting..." : "Connecting to meeting..."}
            </p>
            <p className="text-gray-400">Room: {meetingCode}</p>
            {reconnecting && (
              <p className="text-gray-400 mt-2">
                Attempt {reconnectAttemptsRef.current} of 5
              </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${connectionStatus === "connected"
            ? "bg-green-500"
            : connectionStatus === "connecting"
              ? "bg-yellow-500"
              : "bg-purple-500"
            }`}
        ></div>
        <span className="text-sm">
          {connectionStatus === "connected"
            ? "Connected"
            : connectionStatus === "connecting"
              ? reconnecting
                ? "Reconnecting..."
                : "Connecting..."
              : "Disconnected"}
        </span>
      </div>

      {!showJoinDialog && (
        <div className="flex flex-1 relative h-full overflow-hidden">
          {showChat && (
            <div className="absolute md:relative z-20 w-full md:w-96 h-full bg-gray-900/95 backdrop-blur-md border-r border-gray-800 flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-800/50">
                <h2 className="text-xl font-bold text-white">Meeting Chat</h2>
                <IconButton
                  onClick={() => setShowChat(false)}
                  className="text-white hover:text-purple-400 transition"
                >
                  <Close />
                </IconButton>
              </div>
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length ? (
                  messages.map((item, index) => (
                    <div
                      key={index}
                      className={`flex ${item.sender === username
                        ? "justify-end"
                        : "justify-start"
                        }`}
                    >
                      <div
                        className={`max-w-xs rounded-xl p-3 shadow-lg ${item.sender === username
                          ? "bg-gradient-to-br from-purple-600 to-blue-700"
                          : "bg-gray-800"
                          }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white">{item.sender}</span>
                          <span className="text-xs text-gray-300">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-white">{item.data}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">No messages yet</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-800 bg-gray-800/30">
                <div className="flex gap-2">
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message"
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(139, 92, 246, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(139, 92, 246, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#8b5cf6',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    style={{
                      background: 'linear-gradient(to right, #8b5cf6, #3b82f6)',
                      color: 'white'
                    }}
                    sx={{
                      '&:hover': {
                        opacity: 0.9,
                      },
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showParticipants && (
            <div className="absolute md:relative z-20 w-full md:w-80 h-full bg-gray-900/95 backdrop-blur-md border-r border-gray-800 flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-800/50">
                <h2 className="text-xl font-bold text-white">
                  Participants ({participants.length})
                </h2>
                <IconButton
                  onClick={() => setShowParticipants(false)}
                  className="text-white hover:text-purple-400 transition"
                >
                  <Close />
                </IconButton>
              </div>
              <div
                ref={participantsContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/70 transition cursor-pointer group"
                  >
                    <Avatar className="bg-gradient-to-br from-purple-500 to-blue-700 font-bold text-lg">
                      {participant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {participant.name}{" "}
                        {participant.id === socketIdRef.current && (
                          <span className="text-purple-400 text-sm">(You)</span>
                        )}
                      </div>
                    </div>
                    <IconButton size="small" className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition">
                      <MoreVert />
                    </IconButton>
                  </div>
                ))}
              </div>

            </div>
          )}

          <div className="flex-1 relative bg-black">
            {/* Meeting Code Card - Enhanced */}
            <div className="absolute top-4 left-4 z-10 glass-effect rounded-xl px-4 py-3 shadow-2xl flex items-center space-x-3 border border-purple-500/30 animate-fade-in">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Info className="text-purple-400" fontSize="medium" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">Meeting Code</span>
                <span className="font-mono text-lg font-bold text-white">
                  {meetingCode}
                </span>
              </div>
              <button
                onClick={handleCopyMeetingCode}
                className="ml-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Copy
              </button>
            </div>

            {/* Timer and Controls - Enhanced */}
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 animate-fade-in">
              <div className="glass-effect rounded-xl px-4 py-2 shadow-lg border border-purple-500/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-mono font-bold text-base">
                    {formatMeetingTime(meetingTime)}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 glass-effect rounded-xl flex items-center justify-center text-white hover:text-purple-400 transition border border-purple-500/30 hover:border-purple-500 shadow-lg"
              >
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </button>
              <Tooltip title="Settings">
                <button
                  onClick={() => setShowQuickSettings(!showQuickSettings)}
                  className={`w-10 h-10 glass-effect rounded-xl flex items-center justify-center transition border shadow-lg ${showQuickSettings
                    ? "text-purple-400 border-purple-500"
                    : "text-white hover:text-purple-400 border-purple-500/30 hover:border-purple-500"
                    }`}
                >
                  <Settings />
                </button>
              </Tooltip>
            </div>

            {!video && videos.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                  <People className="w-12 h-12" />
                </div>
                <h3 className="text-xl mb-2">Waiting for others to join</h3>
                <p className="text-gray-400">
                  Share this meeting code:{" "}
                  <span className="font-mono text-white">{meetingCode}</span>
                </p>
              </div>
            )}

            {(video || videos.length > 0) && (
              <div
                className={`
                  absolute inset-0 p-4 gap-4 overflow-auto grid
                  ${videos.length + (video ? 1 : 0) === 1 ? "grid-cols-1" : ""}
                  ${videos.length + (video ? 1 : 0) === 2
                    ? "sm:grid-cols-2"
                    : ""
                  }
                  ${videos.length + (video ? 1 : 0) > 2
                    ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : ""
                  }
                  auto-rows-[minmax(150px,1fr)]
                `}
              >
                {video ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 bg-black">
                    <video
                      ref={setVideoRef}
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: "rotateY(180deg)" }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                      <div className="text-base font-semibold text-white truncate flex items-center">
                        {username} (You){" "}
                        {!audio && (
                          <MicOff
                            className="text-purple-500 ml-2"
                            style={{ fontSize: "1.2rem" }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Avatar className="w-20 h-20 text-3xl">
                        {username?.charAt(0).toUpperCase() || "Y"}
                      </Avatar>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-sm font-medium text-white truncate">
                        {username} (You){" "}
                        {!audio && (
                          <MicOff
                            className="text-purple-500 ml-1"
                            style={{ fontSize: "1rem" }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {videos.map((videoItem) => {
                  const participant = participants.find(
                    (p) => p.id === videoItem.socketId
                  );
                  const hasVideo = videoItem.stream
                    .getVideoTracks()
                    .some((track) => track.readyState === "live");

                  return (
                    <div
                      key={videoItem.socketId}
                      className="relative rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black"
                    >
                      {hasVideo ? (
                        <video
                          ref={(ref) => {
                            if (ref && videoItem.stream) {
                              ref.srcObject = videoItem.stream;
                            }
                          }}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <Avatar className="w-20 h-20 text-3xl">
                            {participant?.name?.charAt(0).toUpperCase() || "U"}
                          </Avatar>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center">
                          <Avatar className="w-8 h-8 mr-2">
                            {participant?.name?.charAt(0).toUpperCase() || "U"}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {participant?.name || "User"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced Control Bar with Larger Buttons */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
            <div className="glass-effect rounded-2xl px-6 py-4 flex items-center space-x-4 shadow-2xl border-2 border-purple-500/30 animate-fade-in-scale">
              <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                <button
                  onClick={handleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${video
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white animate-pulse"
                    }`}
                >
                  {video ? <Videocam fontSize="large" /> : <VideocamOff fontSize="large" />}
                </button>
              </Tooltip>

              <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                <button
                  onClick={handleAudio}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${audio
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white animate-pulse"
                    }`}
                >
                  {audio ? <Mic fontSize="large" /> : <MicOff fontSize="large" />}
                </button>
              </Tooltip>

              <Tooltip title="Celebration">
                <button
                  onClick={triggerConfetti}
                  className="w-14 h-14 rounded-full bg-gray-800 hover:bg-purple-600 text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110 text-2xl"
                >
                  🎉
                </button>
              </Tooltip>

              <div className="w-px h-10 bg-gray-700 mx-2"></div>

              <Tooltip title="Participants">
                <button
                  onClick={() => {
                    setShowParticipants(!showParticipants);
                    setShowChat(false);
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 relative ${showParticipants
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                >
                  <People fontSize="large" />
                  {participants.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-scale">
                      {participants.length}
                    </span>
                  )}
                </button>
              </Tooltip>

              <Tooltip title="Chat">
                <button
                  onClick={() => {
                    setShowChat(!showChat);
                    setShowParticipants(false);
                    setNewMessages(0);
                  }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 relative ${showChat
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                >
                  <Chat fontSize="large" />
                  {newMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-scale">
                      {newMessages}
                    </span>
                  )}
                </button>
              </Tooltip>

              <div className="w-px h-10 bg-gray-700 mx-2"></div>

              <Tooltip title="End call">
                <button
                  onClick={handleEndCall}
                  className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-lg shadow-purple-500/50"
                >
                  <CallEnd fontSize="large" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div >
      )
      }

      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {reactions.map(reaction => (
          <div
            key={reaction.id}
            className="absolute text-6xl animate-fade-in"
            style={{
              left: `${reaction.x}%`,
              bottom: '10%',
              animation: 'float-up 3s ease-out forwards',
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Confetti Display */}
      {
        showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confettiPieces.map(piece => (
              <div
                key={piece.id}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${piece.left}%`,
                  top: '-5%',
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                  animation: `confetti-fall ${piece.duration}s ease-in forwards`,
                  animationDelay: `${piece.delay}s`,
                }}
              />
            ))}
          </div>
        )
      }

      {/* Reaction Menu - Floating */}
      {
        !showJoinDialog && (
          <>
            <div className="fixed bottom-28 right-8 z-40 flex flex-col space-y-3">
              {/* Hand Raise Button */}
              <Tooltip title={handRaised ? "Lower hand" : "Raise hand"}>
                <button
                  onClick={toggleHandRaise}
                  className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 transform hover:scale-110 ${handRaised
                    ? "bg-yellow-500 animate-bounce"
                    : "glass-effect border border-purple-500/30 hover:bg-purple-500/20"
                    }`}
                >
                  ✋
                </button>
              </Tooltip>

              {/* Reaction Button */}
              <Tooltip title="Reactions">
                <button
                  onClick={() => setShowReactionMenu(!showReactionMenu)}
                  className="w-14 h-14 glass-effect rounded-full shadow-2xl flex items-center justify-center text-2xl border border-purple-500/30 hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-110"
                >
                  😊
                </button>
              </Tooltip>


            </div>

            {/* Reaction Menu Popup */}
            {showReactionMenu && (
              <div className="fixed bottom-28 right-28 z-50 glass-effect rounded-2xl p-4 shadow-2xl border border-purple-500/30 animate-fade-in-scale">
                <div className="grid grid-cols-4 gap-3">
                  {['👍', '❤️', '😂', '👏', '🎉', '🔥', '😮', '🤔'].map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        sendReaction(emoji);
                        setShowReactionMenu(false);
                      }}
                      className="w-12 h-12 flex items-center justify-center text-3xl hover:scale-125 transition-transform duration-200 rounded-xl hover:bg-purple-500/20"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}



            {/* Quick Settings Menu */}
            <div className="fixed top-20 right-4 z-30">
              {showQuickSettings && (
                <div className="glass-effect rounded-2xl p-4 shadow-2xl border border-purple-500/30 animate-slide-in-right w-80">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg">Quick Settings</h3>
                    <button
                      onClick={() => setShowQuickSettings(false)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <Close />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">Network Quality</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-4 bg-green-500 rounded"></div>
                        <div className="w-2 h-5 bg-green-500 rounded"></div>
                        <div className="w-2 h-6 bg-green-500 rounded"></div>
                        <span className="text-green-400 text-sm ml-2">Good</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">Participants</span>
                      <span className="text-purple-400 font-bold">{participants.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">Duration</span>
                      <span className="text-white font-mono">{formatMeetingTime(meetingTime)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      }

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div >
  );
}
