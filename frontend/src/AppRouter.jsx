import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Message from "./pages/Message";
import Home from "./pages/Home";
export default function App() {
  return (
  <div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/message" element={<Message />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
  </div>
  );
}