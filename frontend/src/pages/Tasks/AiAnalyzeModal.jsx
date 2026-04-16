import React, { useState } from "react";
import { Sparkles, Loader2, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function AiAnalyzeModal({ teamId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [userCommand, setUserCommand] = useState("");

  const handleAnalyze = async (command = "") => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("chatwave_token");
      const response = await fetch(`${API_URL}/api/v1/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ teamId, userCommand: command || userCommand }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Lỗi ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    // Show inline results instead of AiResultModal
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#FA8DAE]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Kết quả phân tích AI
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {/* Stats Section */}
            {result.stats && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">📊 Thống kê Team</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{result.stats.totalTasks}</p>
                    <p className="text-xs text-gray-600">Tổng task</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{result.stats.pendingTasks}</p>
                    <p className="text-xs text-gray-600">Chờ làm</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{result.stats.inProgressTasks}</p>
                    <p className="text-xs text-gray-600">Đang làm</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{result.stats.overdueTasks}</p>
                    <p className="text-xs text-gray-600">Quá hạn</p>
                  </div>
                </div>

                {result.stats.members && result.stats.members.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">👥 Thành viên</h4>
                    <div className="space-y-2">
                      {result.stats.members.map((m) => (
                        <div key={m.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{m.name}</span>
                            {m.overdueCount > 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                {m.overdueCount} quá hạn
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-gray-600">
                            <span>📋 {m.taskCount} task</span>
                            <span>⏳ {m.pendingCount} chờ</span>
                            <span>🔄 {m.inProgressCount} đang</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Section - exclude STATS_TEAM_PROGRESS */}
            {result.actions && result.actions.filter(a => a.type !== "STATS_TEAM_PROGRESS").length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">🎯 Đề xuất của AI</h3>
                <div className="space-y-2">
                  {result.actions
                    .filter(a => a.type !== "STATS_TEAM_PROGRESS")
                    .map((action, idx) => (
                    <div key={idx} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{action.type}</span>
                        {action.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            action.priority === "high" ? "bg-red-100 text-red-700" :
                            action.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {action.priority}
                          </span>
                        )}
                        {action.severity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            action.severity === "critical" || action.severity === "high" ? "bg-red-100 text-red-700" :
                            action.severity === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {action.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{action.reason}</p>
                      {action.taskId && (
                        <p className="text-xs text-gray-500 mt-1">Task ID: {action.taskId}</p>
                      )}
                      {action.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{action.message}"</p>
                      )}
                      {action.userId && (
                        <p className="text-xs text-gray-500">User: {action.userId}</p>
                      )}
                    </div>
                  ))}
                </div>
                {result.summary && (
                  <p className="text-sm text-gray-600 mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    💡 {result.summary}
                  </p>
                )}
              </div>
            )}

            {result.actions && result.actions.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-gray-500">✅ Không có đề xuất nào - team đang ổn!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
            >
              Đóng
            </button>
            {!loading && (
              <button
                onClick={() => handleAnalyze(userCommand)}
                className="px-4 py-2 bg-[#FA8DAE] text-white rounded-xl text-sm font-medium hover:bg-[#e87a9c] transition"
              >
                Phân tích lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#FA8DAE]" />
          <h2 className="text-lg font-semibold text-gray-900">
            Phân tích Team bằng AI
          </h2>
        </div>

        {/* Command Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nhập yêu cầu (tuỳ chọn):
          </label>
          <input
            type="text"
            placeholder="VD: thống kê tiến độ, ai bị bí task, cân bằng task..."
            value={userCommand}
            onChange={(e) => setUserCommand(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
          />
        </div>

        {/* Content */}
        {!loading && !error && !result && (
          <div className="text-center mb-6 flex-1 flex flex-col items-center justify-center">
            <Sparkles className="w-12 h-12 text-[#FA8DAE] mb-3" />
            <p className="text-gray-600 mb-4">
              AI sẽ phân tích team và đưa ra các đề xuất tối ưu hóa công việc.
            </p>
            <p className="text-xs text-gray-500">
              Có thể hỏi: "Thống kê tiến độ", "Ai bị bí task?", "Cân bằng công việc"
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-[#FA8DAE] animate-spin mb-4" />
            <p className="text-gray-600">AI đang phân tích...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Lỗi</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result View */}
        {result && (
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {/* Stats Section */}
            {result.stats && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">📊 Thống kê Team</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{result.stats.totalTasks}</p>
                    <p className="text-xs text-gray-600">Tổng task</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{result.stats.pendingTasks}</p>
                    <p className="text-xs text-gray-600">Chờ làm</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{result.stats.inProgressTasks}</p>
                    <p className="text-xs text-gray-600">Đang làm</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{result.stats.overdueTasks}</p>
                    <p className="text-xs text-gray-600">Quá hạn</p>
                  </div>
                </div>

                {result.stats.members && result.stats.members.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">👥 Thành viên</h4>
                    <div className="space-y-2">
                      {result.stats.members.map((m) => (
                        <div key={m.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{m.name}</span>
                            {m.overdueCount > 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                {m.overdueCount} quá hạn
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-gray-600">
                            <span>📋 {m.taskCount} task</span>
                            <span>⏳ {m.pendingCount} chờ</span>
                            <span>🔄 {m.inProgressCount} đang</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Section */}
            {result.actions && result.actions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">🎯 Đề xuất của AI</h3>
                <div className="space-y-2">
                  {result.actions.map((action, idx) => (
                    <div key={idx} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{action.type}</span>
                        {action.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            action.priority === "high" ? "bg-red-100 text-red-700" :
                            action.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {action.priority}
                          </span>
                        )}
                        {action.severity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            action.severity === "critical" || action.severity === "high" ? "bg-red-100 text-red-700" :
                            action.severity === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {action.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{action.reason}</p>
                      {action.taskId && (
                        <p className="text-xs text-gray-500 mt-1">Task ID: {action.taskId}</p>
                      )}
                      {action.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{action.message}"</p>
                      )}
                      {action.userId && (
                        <p className="text-xs text-gray-500">User: {action.userId}</p>
                      )}
                    </div>
                  ))}
                </div>
                {result.summary && (
                  <p className="text-sm text-gray-600 mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    💡 {result.summary}
                  </p>
                )}
              </div>
            )}

            {result.actions && result.actions.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-gray-500">✅ Không có đề xuất nào - team đang ổn!</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Đóng
          </button>
          {!loading && (
            <button
              onClick={() => handleAnalyze(userCommand)}
              className="px-4 py-2 bg-[#FA8DAE] text-white rounded-xl text-sm font-medium hover:bg-[#e87a9c] transition"
            >
              Phân tích
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
