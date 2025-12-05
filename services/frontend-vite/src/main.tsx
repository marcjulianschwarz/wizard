import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { AboutPage } from "./pages/About.tsx";
import HomePage from "./pages/home/HomePage.tsx";
import NewGamePage from "./pages/game/new/NewGamePage.tsx";
import PreviewPage from "./pages/preview/PreviewPage.tsx";
import ControllerGamePage from "./pages/game/controller/ControllerGamePage.tsx";
import DisplayGamePage from "./pages/game/display/DisplayGamePage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/new" element={<NewGamePage />} />
        <Route
          path="/game/controller/:gameCode"
          element={<ControllerGamePage />}
        />
        <Route path="/game/display/:gameCode" element={<DisplayGamePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/preview" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
