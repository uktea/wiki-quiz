import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import { gameModes, settingFields } from './gameConfig';

export default function PreparationScreen() {
  const { mode } = useParams();
  if (!gameModes[mode]) return <Navigate to="/select-mode" replace />;
  return <Preparation key={mode} mode={mode} />;
}

function Preparation({ mode }) {
  const selected = gameModes[mode];
  const [settings, setSettings] = useState(selected.settings);
  const { setModeSettings } = useGameSettings();
  const navigate = useNavigate();
  const fields = settingFields.filter(([key]) => {
    if (mode === 'practice') return false;
    if (key === 'questionCount') return mode !== 'survival';
    if (key === 'maxTime') return mode !== 'timeattack';
    return true;
  });

  function start(event) {
    event.preventDefault();
    setModeSettings({ mode, settings });
    navigate('/game/' + mode);
  }

  return <section>
    <h1>{selected.name}モード</h1>
    <p className="mode-description">{selected.description}</p>
    <form onSubmit={start}>
      <fieldset>
        <legend>オプション</legend>
        {fields.map(([key, label, min, max]) => <label className="option-item" key={key}>
          <span>{label}</span>
          <input name={key} type="number" min={min} max={max} step="1" required value={settings[key]}
            onChange={event => setSettings({ ...settings, [key]: event.target.value === '' ? '' : Number(event.target.value) })} />
        </label>)}
        <label className="checkbox-label">
          <input type="checkbox" checked={settings.isReverse}
            onChange={event => setSettings({ ...settings, isReverse: event.target.checked })} />
          逆問題モード（サムネイルから記事名を当てる）
        </label>
        <button type="button" onClick={() => setSettings(selected.settings)}>デフォルトに戻す</button>
      </fieldset>
      <div className="actions"><button className="primary" type="submit">ゲーム開始</button><Link to="/select-mode">戻る</Link></div>
    </form>
  </section>;
}
