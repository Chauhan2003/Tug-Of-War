import { createBrowserRouter } from "react-router";
import SplashScreen from "./components/SplashScreen";
import HomeScreen from "./components/HomeScreen";
import ClassSelection from "./components/ClassSelection";
import LevelSelection from "./components/LevelSelection";
import ModeSelection from "./components/ModeSelection";
import MultiplayerLobby from "./components/MultiplayerLobby";
import MatchReadyScreen from "./components/MatchReadyScreen";
import GameScreen from "./components/GameScreen";
import MultiplayerGameScreen from "./components/MultiplayerGameScreen";
import ResultScreen from "./components/ResultScreen";
import Leaderboard from "./components/Leaderboard";
import ProfileScreen from "./components/ProfileScreen";
import AuthScreen from "./components/AuthScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/auth",
    Component: AuthScreen,
  },
  {
    path: "/home",
    Component: HomeScreen,
  },
  {
    path: "/class-selection",
    Component: ClassSelection,
  },
  {
    path: "/level-selection/:classId",
    Component: LevelSelection,
  },
  {
    path: "/mode-selection",
    Component: ModeSelection,
  },
  {
    path: "/multiplayer-lobby",
    Component: MultiplayerLobby,
  },
  {
    path: "/match-ready",
    Component: MatchReadyScreen,
  },
  {
    path: "/game",
    Component: GameScreen,
  },
  {
    path: "/multiplayer-game",
    Component: MultiplayerGameScreen,
  },
  {
    path: "/result",
    Component: ResultScreen,
  },
  {
    path: "/leaderboard",
    Component: Leaderboard,
  },
  {
    path: "/profile",
    Component: ProfileScreen,
  },
]);
