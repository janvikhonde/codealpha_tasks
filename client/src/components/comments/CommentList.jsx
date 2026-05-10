import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

export default function CommentList({ taskId }) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    api.get(`/comments?task=${taskId}`).then(({ data }) => setComments(data));
  }, [taskId]);

  const sendText = async () => {
    if (!text.trim()) return;
    const { data } = await api.post('/comments', { task: taskId, text });
    setComments((c) => [...c, data]);
    setText('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start();
      setRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (!mediaRef.current) return;
    mediaRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const fd = new FormData();
      fd.append('audio', blob, 'voice.webm');
      fd.append('task', taskId);
      fd.append('voiceDuration', recordingSeconds);
      const { data } = await api.post('/comments/voice', fd);
      setComments((c) => [...c, data]);
      setRecording(false);
      setRecordingSeconds(0);
    };
    mediaRef.current.stop();
    mediaRef.current.stream.getTracks().forEach((t) => t.stop());
  };

  return (
    <div>
      <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Comments & Voice Notes</p>

      <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
        {comments.map((c) => (
          <div key={c._id} className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 mt-0.5"
              style={{ background: c.author?.color || '#6c63ff', color: '#fff' }}
            >
              {c.author?.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-gray-300">{c.author?.name}</span>
                <span className="text-[10px] text-gray-600">
                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {c.text && <p className="text-xs text-gray-400 leading-relaxed">{c.text}</p>}
              {c.voiceUrl && (
                <div className="bg-dark-600 rounded-lg px-3 py-2 flex items-center gap-2 mt-1">
                  <button
                    onClick={() => new Audio(c.voiceUrl).play()}
                    className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-[10px] flex-shrink-0"
                  >
                    ▶
                  </button>
                  {/* Simple waveform visual */}
                  <div className="flex items-center gap-0.5 flex-1 h-4">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-brand/60 rounded-full"
                        style={{ height: `${Math.random() * 12 + 4}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {c.voiceDuration}s
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
          style={{ background: user?.color || '#6c63ff', color: '#fff' }}
        >
          {user?.initials}
        </div>
        <input
          className="input text-xs py-1.5 flex-1"
          placeholder="Add comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
        />
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
            recording ? 'bg-red-500 animate-pulse' : 'bg-brand'
          }`}
          title={recording ? `Stop (${recordingSeconds}s)` : 'Record voice note'}
        >
          {recording ? '⏹' : '🎙'}
        </button>
        <button
          onClick={sendText}
          className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs flex-shrink-0"
        >
          →
        </button>
      </div>
    </div>
  );
}