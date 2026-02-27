import React from "react";

function sortItems(items, sortOption) {
  const cloned = [...items];

  if (sortOption === "latest") {
    return cloned.sort((a, b) => b.id - a.id);
  }

  if (sortOption === "oldest") {
    return cloned.sort((a, b) => a.id - b.id);
  }

  if (sortOption === "mostMessages") {
    return cloned.sort(
      (a, b) => (b.messageCount || 0) - (a.messageCount || 0)
    );
  }

  return cloned;
}

export default function MessageListGrid({
  items,
  sortOption,
  showMembers,
  showUnreadBadge,
}) {
  const sorted = sortItems(items, sortOption);

  return (
    <div className="bg-[#FFF9F2] rounded-3xl shadow-sm px-4 py-4 md:px-6 md:py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[0, 1, 2].map((columnIndex) => (
          <div key={columnIndex} className="space-y-3 md:space-y-4">
            {sorted
              .filter((_, index) => index % 3 === columnIndex)
              .map((item) => {
                const lastName =
                  item.name.split(" ").slice(-1)[0] || item.name[0];
                const initial = lastName[0];
                const isOnline = item.status === "Online";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white rounded-2xl px-3 py-3 md:px-4 md:py-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#FFE6DD] flex items-center justify-center text-sm md:text-base font-semibold text-[#F58A4A]">
                          {initial}
                        </div>
                        {isOnline && (
                          <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm md:text-base">
                            {item.name}
                          </span>
                          {showMembers && (
                            <span className="text-[10px] md:text-xs text-gray-400">
                              {item.members} thành viên
                            </span>
                          )}
                          {showUnreadBadge && item.unreadCount > 0 && (
                            <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-[#FF6B8A]/10 text-[#FF6B8A]">
                              {item.unreadCount} mới
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] md:text-xs text-gray-400">
                        {item.lastActive}
                      </div>
                      <div
                        className={`text-[10px] md:text-xs font-semibold ${
                          isOnline ? "text-[#FF6B8A]" : "text-gray-400"
                        }`}
                      >
                        {item.status}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

