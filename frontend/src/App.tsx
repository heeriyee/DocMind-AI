import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";

import Upload from "./pages/Upload";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import "./App.css";

function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/upload" element={<Upload />} />

        <Route path="/chat" element={<Chat />} />

        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;