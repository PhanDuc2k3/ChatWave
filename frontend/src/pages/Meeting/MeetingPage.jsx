import React from "react";
import { Video, Plus, Users, User, Clock, Calendar } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { mockMeetingRooms } from "./meetingData";

const STATUS_CONFIG = {
  live: {
    label: "Đang họp",
    className: "bg-green-50 text-green-700 border-green-200",
    dotClass: "bg-green-500",
  },
  scheduled: {
    label: "Sắp bắt đầu",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  ended: {
    label: "Đã kết thúc",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    dotClass: "bg-gray-400",
  },
};

function RoomCard({ room }) {
  const config = STATUS_CONFIG[room.status];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition">
      <div className="flex gap-4 p-4">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-[#E7F3FF] flex items-center justify-center">
          <Video className="w-7 h-7 text-[#6CB8FF]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {room.name}
            </h4>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium border ${config.className}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${room.status === "live" ? "animate-pulse" : ""}`} />
              {config.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {room.host}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {room.members}/{room.maxMembers}
            </span>
            {room.status === "live" && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {room.duration}
              </span>
            )}
            {room.status === "scheduled" && room.scheduledDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {room.scheduledDate} · {room.startTime}
              </span>
            )}
            {room.status === "ended" && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Kết thúc {room.endedAt}
              </span>
            )}
          </div>
          {room.groupName && (
            <p className="text-[11px] text-gray-400 mt-1">{room.groupName}</p>
          )}
          <div className="mt-3 flex gap-2">
            {(room.status === "live" || room.status === "scheduled") && (
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#FA8DAE] text-white text-xs font-medium hover:bg-[#f57a9d] transition"
              >
                {room.status === "live" ? "Vào phòng" : "Tham gia"}
              </button>
            )}
            {room.status === "ended" && (
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
              >
                Xem lại
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingPage() {
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        Phòng họp
      </h2>
    </div>
  );

  const liveRooms = mockMeetingRooms.filter((r) => r.status === "live");
  const scheduledRooms = mockMeetingRooms.filter((r) => r.status === "scheduled");
  const endedRooms = mockMeetingRooms.filter((r) => r.status === "ended");

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Nơi tạo phòng và mời bạn bè, nhóm họp mặt trực tuyến
          </p>
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FA8DAE] text-white text-sm font-medium hover:bg-[#f57a9d] transition"
          >
            <Plus className="w-4 h-4" />
            Tạo phòng
          </button>
        </div>

        {liveRooms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Đang họp ({liveRooms.length})
            </h3>
            <div className="space-y-3">
              {liveRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {scheduledRooms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sắp bắt đầu ({scheduledRooms.length})
            </h3>
            <div className="space-y-3">
              {scheduledRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}

        {endedRooms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Đã kết thúc ({endedRooms.length})
            </h3>
            <div className="space-y-3">
              {endedRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
