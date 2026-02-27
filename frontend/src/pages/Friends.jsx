import React from "react";
import FriendsPage from "./Friends/FriendsPage";
import FriendsRequestsPage from "./Friends/FriendsRequestsPage";
import FriendsAllPage from "./Friends/FriendsAllPage";
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

