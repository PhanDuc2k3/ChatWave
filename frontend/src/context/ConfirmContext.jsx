import React, { createContext, useContext, useState, useCallback } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    visible: false,
    message: "",
    resolve: null,
  });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ visible: true, message: String(message), resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) state.resolve(true);
    setState({ visible: false, message: "", resolve: null });
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    if (state.resolve) state.resolve(false);
    setState({ visible: false, message: "", resolve: null });
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.visible && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={handleCancel}
          onKeyDown={(e) => e.key === "Escape" && handleCancel()}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <p className="text-gray-800 font-medium">{state.message}</p>
            </div>
            <div className="flex gap-3 justify-end p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-full bg-[#FA8DAE] text-white font-medium hover:bg-[#f97a9d]"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
