import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import { defaultGlobalSettings } from './gameConfig';

export default function SettingsScreen() {
  const { globalSettings, setGlobalSettings } = useGameSettings();
  const [draft, setDraft] = useState(globalSettings);

  function change(event) {
    const { name, value, validity } = event.target;
    const next = { ...draft, [name]: value === '' ? '' : Number(value) };
    setDraft(next);
    if (validity.valid) setGlobalSettings({ ...globalSettings, [name]: Number(value) });
  }

  return <section>
    <h1>共通設定</h1>
    <p>ここでの設定は、すべてのゲームモードに適用されます。</p>
    <fieldset>
      <legend>記事の取得設定</legend>
      <label className="option-item"><span>一度に調べる記事数</span>
        <input name="fetchBatchSize" type="number" min="1" max="50" step="1" required value={draft.fetchBatchSize} onChange={change} />
      </label>
      <label className="option-item"><span>最大試行回数</span>
        <input name="fetchAttempts" type="number" min="1" max="10" step="1" required value={draft.fetchAttempts} onChange={change} />
      </label>
      <button onClick={() => { setDraft(defaultGlobalSettings); setGlobalSettings(defaultGlobalSettings); }}>デフォルトに戻す</button>
    </fieldset>
    <Link className="back-link" to="/">戻る</Link>
  </section>;
}
