import React, { useEffect, useRef, useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
} from "lucide-react";
import { getChatSocket } from "../socket/chatSocket";
import toast from "react-hot-toast";

export default function VideoCallRoom({
  roomId,
  roomName,
  currentUserId,
  currentUserName,
  onClose,
}) {
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [joined, setJoined] = useState(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !currentUserId || !currentUserName) return;

    const socket = getChatSocket();
    socketRef.current = socket;

    const createPeerConnection = (remoteSocketId, remoteUserId, remoteUserName) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.ontrack = (e) => {
        const stream = e.streams[0];
        if (stream) {
          setRemoteStreams((prev) => ({
            ...prev,
            [remoteSocketId]: { stream, userId: remoteUserId, userName: remoteUserName },
          }));
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice_candidate", {
            roomId,
            toSocketId: remoteSocketId,
            candidate: e.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          pc.close();
          delete peersRef.current[remoteSocketId];
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[remoteSocketId];
            return next;
          });
        }
      };

      return pc;
    };

    const handleRoomMembers = ({ members }) => {
      if (!members?.length) return;
      members.forEach((m) => {
        if (m.socketId === socket.id) return;
        const pc = createPeerConnection(m.socketId, m.userId, m.userName);
        peersRef.current[m.socketId] = { pc, userId: m.userId, userName: m.userName };
      });
    };

    const handleUserJoined = async ({ userId, userName, socketId }) => {
      if (socketId === socket.id) return;
      const pc = createPeerConnection(socketId, userId, userName);
      peersRef.current[socketId] = { pc, userId, userName };
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call_offer", {
          roomId,
          toSocketId: socketId,
          offer: pc.localDescription,
        });
      } catch (err) {
        console.error("createOffer for new user error", err);
      }
    };

    const handleCallOffer = async ({ fromUserId, fromSocketId, offer }) => {
      let pc = peersRef.current[fromSocketId]?.pc;
      if (!pc) {
        pc = createPeerConnection(fromSocketId, fromUserId, "User");
        peersRef.current[fromSocketId] = { pc, userId: fromUserId, userName: "User" };
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call_answer", {
          roomId,
          toSocketId: fromSocketId,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error("handleCallOffer error", err);
      }
    };

    const handleCallAnswer = async ({ fromSocketId, answer }) => {
      const pc = peersRef.current[fromSocketId]?.pc;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("handleCallAnswer error", err);
      }
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      const pc = peersRef.current[fromSocketId]?.pc;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("addIceCandidate error", err);
      }
    };

    const handleUserLeft = ({ socketId }) => {
      const entry = peersRef.current[socketId];
      if (entry?.pc) {
        entry.pc.close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on("call_room_members", handleRoomMembers);
    socket.on("user_joined_call", handleUserJoined);
    socket.on("call_offer", handleCallOffer);
    socket.on("call_answer", handleCallAnswer);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("user_left_call", handleUserLeft);

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        socket.emit("join_call_room", {
          roomId,
          userId: currentUserId,
          userName: currentUserName,
        });
        setJoined(true);
      } catch (err) {
        console.error("getUserMedia error", err);
        toast.error("Không thể truy cập camera/microphone. Kiểm tra quyền trình duyệt.");
      }
    };

    startLocalStream();

    return () => {
      socket.off("call_room_members", handleRoomMembers);
      socket.off("user_joined_call", handleUserJoined);
      socket.off("call_offer", handleCallOffer);
      socket.off("call_answer", handleCallAnswer);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("user_left_call", handleUserLeft);
      socket.emit("leave_call", { roomId });
      Object.values(peersRef.current).forEach(({ pc }) => pc?.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, [roomId, currentUserId, currentUserName]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [joined]);

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    onClose?.();
  };

  const remoteEntries = Object.entries(remoteStreams);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/40">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-white" />
          <span className="text-white font-medium truncate">{roomName || "Video call"}</span>
          <span className="text-xs text-gray-300">
            <Users className="w-3.5 h-3.5 inline mr-0.5" />
            {1 + remoteEntries.length} người
          </span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {/* Local video */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-video max-h-[40vh] md:max-h-none">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 text-white text-xs">
              {currentUserName} (Bạn)
            </span>
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-12 h-12 text-gray-500" />
              </div>
            )}
          </div>

          {/* Remote videos */}
          {remoteEntries.map(([socketId, { stream, userName }]) => (
            <RemoteVideo
              key={socketId}
              stream={stream}
              userName={userName}
              remoteVideosRef={remoteVideosRef}
              socketId={socketId}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-4 bg-black/40">
        <button
          type="button"
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            videoEnabled ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-red-600 text-white"
          }`}
          title={videoEnabled ? "Tắt camera" : "Bật camera"}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            audioEnabled ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-red-600 text-white"
          }`}
          title={audioEnabled ? "Tắt mic" : "Bật mic"}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-500 transition"
          title="Kết thúc cuộc gọi"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      <style>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
}

function RemoteVideo({ stream, userName, remoteVideosRef, socketId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    remoteVideosRef.current[socketId] = videoRef.current;
    return () => {
      delete remoteVideosRef.current[socketId];
    };
  }, [stream, socketId]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-800 aspect-video max-h-[40vh] md:max-h-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 text-white text-xs truncate max-w-[80%]">
        {userName}
      </span>
    </div>
  );
}
