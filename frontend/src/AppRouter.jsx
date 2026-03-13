import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Message from "./pages/Message";
import Home from "./pages/Home";
import Friends from "./pages/Friends";
import GroupsPage from "./pages/Groups/GroupsPage";
import GroupDetailPage from "./pages/Groups/GroupDetailPage";
import Tasks from "./pages/Tasks";
import ChatbotPage from "./pages/Chatbot/ChatbotPage";
import Profile from "./pages/Profile";
import AdminTasks from "./pages/AdminTasks";
import SearchPage from "./pages/Search/SearchPage";

export default function App() {
  return (
    <BrowserRouter>
        <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/message/*" element={<Message />} />
          <Route path="/friends/*" element={<Friends />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/admin/tasks" element={<AdminTasks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/" element={<Home />} />
        </Routes>
        </NotificationProvider>
      </BrowserRouter>
  );
}