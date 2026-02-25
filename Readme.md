# Talkify

> A modern, secure video meeting and chat web app built with React, Firebase, and Node.js.

Talkify enables users to sign up via Google or email, create or join meeting rooms with shareable codes, and chat in real time. Designed for seamless remote collaboration with a responsive and user-friendly UI.
## Features

- Email/Password and Google Sign-In (Firebase Authentication)
- Secure, token-based meeting creation and joining
- Realtime chat using Firestore
- Unique, shareable meeting codes
- Mute/unmute camera and audio before joining
- Responsive, modern UI built with React

---

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Firebase SDK** - Authentication & Firestore
- **Tailwind CSS** - Styling
- **Material-UI** - UI components
- **Socket.IO Client** - Real-time communication
- **WebRTC** - Video/audio streaming
- **Particles.js** - Animated backgrounds

### Backend
- **Node.js & Express** - Server framework
- **Socket.IO** - WebSocket server
- **Firebase Admin SDK** - Backend authentication & Firestore
- **bcrypt** - Password hashing

---

##  How It Works

1. **Sign Up / Login**  
   - Users register or sign in securely with Email/Password or Google using Firebase Authentication.

2. **Create or Join Meetings**  
   - Users can generate a unique 8-character meeting code to create a room.
   - Others can join using that code.

3. **Token-Based Access Control**  
   - Frontend sends a secure token to the Express backend.
   - Backend verifies the token before granting access to the meeting room.

4. **Pre-Join Settings**  
   - Users can choose to enable/disable their camera and microphone before joining.

5. **Real-Time Chat**  
   - Messages are stored and synced using Firestore for instant updates.
   - Each chat includes user details, timestamps, and room info.

6. **Responsive & Modern UI**  
   - Built with React and Tailwind CSS for a smooth experience on all devices.

