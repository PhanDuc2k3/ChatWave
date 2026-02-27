import React from "react";

function sortItems(items, sortOption) {
  const cloned = [...items];
  if (sortOption === "latest") return cloned.sort((a, b) => b.id - a.id);
  if (sortOption === "oldest") return cloned.sort((a, b) => a.id - b.id);
  if (sortOption === "mostMessages")
    return cloned.sort(
      (a, b) => (b.messageCount || 0) - (a.messageCount || 0)
    );
  return cloned;
}

export default function MessageListSidebar({
  items,
  sortOption,
  selectedId,
  onSelect,
  showMembers,
  showUnreadBadge,
}) {
  const sorted = sortItems(items, sortOption);

  return (
    <div className="h-full overflow-y-auto space-y-1 pr-1">
      {sorted.map((item) => {
        const lastName = item.name.split(" ").slice(-1)[0] || item.name[0];
        const initial = lastName[0];
        const isOnline = item.status === "Online";
        const isActive = selectedId === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
              isActive ? "bg-[#FFF7F0]" : "hover:bg-gray-50"
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#FFE6DD] flex items-center justify-center text-sm font-semibold text-[#F58A4A]">
                {initial}
              </div>
              {isOnline && (
                <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 text-sm truncate">
                  {item.name}
                </span>
                {showMembers && item.members && (
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {item.members} tv
                  </span>
                )}
                {showUnreadBadge && item.unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B8A]/10 text-[#FF6B8A] shrink-0">
                    {item.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{item.message}</p>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-[10px] text-gray-400">{item.lastActive}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
