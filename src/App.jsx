import { Navigate, Route, Routes } from 'react-router-dom';
import TitleScreen from './TitleScreen';
import HowToPlay from './HowToPlay';
import Index from './Index';
import GameModeSelection from './GameModeSelection';
import PreparationScreen from './PreparationScreen';
import SettingsScreen from './SettingsScreen';
import QuizGame from './QuizGame';
import './App.css';

export default function App() {
  return <main className="App">
    <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route path="/select-mode" element={<GameModeSelection />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/prepare/:mode" element={<PreparationScreen />} />
      <Route path="/how-to-play" element={<HowToPlay />} />
      <Route path="/index" element={<Index />} />
      <Route path="/game/:mode" element={<QuizGame />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </main>;
}
