import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { groupApi } from "../../api/groupApi";
import { useGroups } from "../../hooks/useGroups";
import toast from "react-hot-toast";

export default function GroupsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [creating, setCreating] = useState(false);

  const handleFetchError = useCallback((err) => {
    toast.error(err?.message || "Không tải được danh sách nhóm.");
  }, []);

  const {
    groups,
    setGroups,
    loading,
    currentUserId,
  } = useGroups({ onError: handleFetchError });

  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    } catch {
      return null;
    }
  }, []);
  const ownerName = currentUser?.username || currentUser?.email || currentUser?.name || "Bạn";

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên nhóm.");
      return;
    }
    if (!currentUserId) {
      toast.error("Bạn cần đăng nhập để tạo nhóm.");
      return;
    }
    try {
      setCreating(true);
      const group = await groupApi.create({
        name,
        description: newDesc.trim(),
        ownerId: currentUserId,
        ownerName,
        visibility,
      });
      setGroups((prev) => [group, ...prev]);
      toast.success("Tạo nhóm thành công!");
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setVisibility("public");
      navigate(`/groups/${group.id || group._id}`);
    } catch (err) {
      toast.error(err?.message || "Không tạo được nhóm.");
    } finally {
      setCreating(false);
    }
  };

  const isMember = (g) => g.members?.some((m) => m.userId === currentUserId);

  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Nhóm
          </h1>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-full bg-[#FA8DAE] text-white text-sm font-semibold hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo nhóm
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Đang tải...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
            <p className="text-gray-500">Chưa có nhóm nào.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-3 text-[#FA8DAE] font-medium hover:underline"
            >
              Tạo nhóm đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => {
              const id = g.id || g._id;
              const joined = isMember(g);
              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/groups/${id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FA8DAE]/20 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-[#FA8DAE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {g.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {g.description || "Chưa có mô tả"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            g.visibility === "private"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {g.visibility === "private" ? "Riêng tư" : "Công khai"}
                        </span>
                        {joined && (
                          <span className="text-xs text-green-600 font-medium">
                            Đã tham gia
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {g.members?.length || 0} thành viên
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                Tạo nhóm mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-gray-500 hover:text-gray-700 text-lg px-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
                  placeholder="VD: Nhóm làm việc A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Mô tả (tuỳ chọn)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] resize-none min-h-[70px]"
                  placeholder="Mô tả ngắn gọn về mục đích nhóm"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Loại nhóm
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="text-[#FA8DAE]"
                    />
                    <span className="text-sm">Công khai</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === "private"}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="text-[#FA8DAE]"
                    />
                    <span className="text-sm">Riêng tư</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {visibility === "public"
                    ? "Mọi người có thể tìm và xem thông tin nhóm"
                    : "Chỉ thành viên được mời mới thấy nhóm"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={creating}
                onClick={handleCreate}
                className="px-4 py-1.5 text-xs rounded-full bg-[#FA8DAE] text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Đang tạo..." : "Tạo nhóm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
