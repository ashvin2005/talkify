import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function VideoMeet() {
  const { roomCode } = useParams();
  const [joined, setJoined] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <h1 className="text-white">Room: {roomCode}</h1>
    </div>
  );
}

export default VideoMeet;
