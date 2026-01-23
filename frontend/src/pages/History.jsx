import { useEffect, useState } from 'react';
import axios from 'axios';
import { server } from '../environment';

function History() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(
          `${server}/api/v1/users/history?token=${token}`
        );
        setMeetings(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h2 className="text-3xl font-bold mb-6">Meeting History</h2>
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white p-4 rounded shadow">
            <p className="font-semibold">{meeting.meetingCode}</p>
            <p className="text-sm text-gray-600">
              {new Date(meeting.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
