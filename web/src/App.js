import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/config";

// const Explore = () => <div><h1>Keşfet</h1></div>;

const App = () => {
  const [user, loading] = useAuthState(auth);

  return (
    <Router>
      <Navbar />
      <div style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 