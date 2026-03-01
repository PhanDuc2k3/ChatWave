import React, { useState } from "react";
import { User, MapPin, Briefcase, GraduationCap, Calendar } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { mockProfile } from "./profileData";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts"); // posts | about

  const { name, username, bio, stats, info } = mockProfile;
  const initial = name.charAt(0);

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        Trang cá nhân
      </h2>
      <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
        <User className="w-4 h-4" />
        Hồ sơ của tôi
      </span>
    </div>
  );

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full max-w-4xl mx-auto py-6 space-y-6 px-2">
        {/* Cover + Avatar */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="h-32 md:h-40 bg-linear-to-r from-[#F5C46A] to-[#FA8DAE]" />
          <div className="px-4 pb-4 -mt-12 relative">
            <div className="w-24 h-24 rounded-2xl bg-[#FFF7F0] border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-[#FA8DAE]">
              {initial}
            </div>
            <h1 className="mt-3 text-xl md:text-2xl font-bold text-gray-900">
              {name}
            </h1>
            <p className="text-sm text-gray-500">@{username}</p>
            {bio && (
              <p className="mt-2 text-sm text-gray-700">{bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-xl font-bold text-[#FA8DAE]">{stats.posts}</p>
              <p className="text-xs text-gray-500">Bài viết</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#6CB8FF]">{stats.friends}</p>
              <p className="text-xs text-gray-500">Bạn bè</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#F9C96D]">{stats.photos}</p>
              <p className="text-xs text-gray-500">Ảnh</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition ${activeTab === "posts"
              ? "bg-[#FA8DAE] text-white"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Bài viết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition ${activeTab === "about"
              ? "bg-[#FA8DAE] text-white"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Giới thiệu
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "posts" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
            <p className="text-gray-500 text-sm">
              Chưa có bài viết nào. Chia sẻ điều gì đó từ trang chủ nhé!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3">
            {info.work && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Công việc</p>
                  <p className="text-sm font-medium text-gray-800">{info.work}</p>
                </div>
              </div>
            )}
            {info.education && (
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Học vấn</p>
                  <p className="text-sm font-medium text-gray-800">{info.education}</p>
                </div>
              </div>
            )}
            {info.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Nơi sống</p>
                  <p className="text-sm font-medium text-gray-800">{info.location}</p>
                </div>
              </div>
            )}
            {info.joined && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#FA8DAE] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Tham gia</p>
                  <p className="text-sm font-medium text-gray-800">{info.joined}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
