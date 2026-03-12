import React from "react";
import { Video, Phone, PhoneOff } from "lucide-react";

export default function IncomingCallModal({
  fromUserName,
  roomName,
  onAccept,
  onDecline,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#6CB8FF]/20 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-[#6CB8FF]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{fromUserName}</p>
            <p className="text-sm text-gray-500">
              {roomName ? `${roomName} • ` : ""}Đang gọi video
            </p>
          </div>
          <div className="flex gap-4 justify-center pt-2">
            <button
              type="button"
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition"
              title="Từ chối"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"
              title="Nghe"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
