import React from "react";
import FriendsPage from "./FriendsPage";
import FriendsRequestsPage from "./FriendsRequestsPage";
import FriendsAllPage from "./FriendsAllPage";
import { Routes, Route } from "react-router-dom";

export default function Friends() {
  return (
    <Routes>
      <Route path="/" element={<FriendsPage />} />
      <Route path="/requests" element={<FriendsRequestsPage />} />
      <Route path="/all" element={<FriendsAllPage />} />
    </Routes>
  );
}
