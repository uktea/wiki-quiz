import { createContext, useContext, useState } from 'react';
import { defaultGlobalSettings } from './gameConfig';
import { readStored, writeStored } from './storage';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [modeSettings, setModeSettings] = useState(null);
  const [globalSettings, updateGlobalSettings] = useState(() => {
    const saved = readStored('wikiGameGlobalSettings', {});
    return Object.fromEntries(Object.entries(defaultGlobalSettings).map(([key, fallback]) => {
      const value = Number(saved?.[key]);
      const max = key === 'fetchBatchSize' ? 50 : 10;
      return [key, Number.isInteger(value) && value >= 1 && value <= max ? value : fallback];
    }));
  });

  function setGlobalSettings(value) {
    const next = typeof value === 'function' ? value(globalSettings) : value;
    updateGlobalSettings(next);
    writeStored('wikiGameGlobalSettings', next);
  }

  return <GameContext.Provider value={{ modeSettings, setModeSettings, globalSettings, setGlobalSettings }}>
    {children}
  </GameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGameSettings() { return useContext(GameContext); }
