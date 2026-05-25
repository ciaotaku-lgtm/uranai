import { useState, useRef } from "react";

function getElement(year, month, day) {
  const elements = ["木", "火", "土", "金", "水"];
  return elements[(year + month + day) % 5];
}

const ELEMENT_COLORS = {
  木: { color: "#2d6a4f", accent: "#95d5b2" },
  火: { color: "#c1121f", accent: "#ffb703" },
  土: { color: "#8b5e3c", accent: "#f4d58d" },
  金: { color: "#4a4e69", accent: "#c9ada7" },
  水: { color: "#023e8a", accent: "#90e0ef" },
};

const DEFAULT_CATEGORIES = [
  { key: "総合", label: "総合運", emoji: "🌟" },
  { key: "恋愛", label: "恋愛運", emoji: "💕" },
  { key: "仕事", label: "仕事運", emoji: "💼" },
  { key: "金",   label: "金運",   emoji: "💰" },
  { key: "健康", label: "健康運", emoji: "🌿" },
];

const PRESET_THEMES = ["猫", "野球選手", "家電製品", "お菓子", "宇宙人", "侍"];

const ELEMENT_INFO = {
  木: { label: "木の属性", desc: "成長・創造・しなやかさ", icon: "🌿" },
  火: { label: "火の属性", desc: "情熱・行動力・明るさ", icon: "🔥" },
  土: { label: "土の属性", desc: "安定・誠実・包容力", icon: "🌍" },
  金: { label: "金の属性", desc: "意志・洗練・決断力", icon: "✨" },
  水: { label: "水の属性", desc: "知恵・柔軟性・直感力", icon: "💧" },
};

export default function App() {
  const [step, setStep] = useState("input");
  const [birthdate, setBirthdate] = useState({ year: "", month: "", day: "" });
  const [themeInput, setThemeInput] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [customCats, setCustomCats] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [result, setResult] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [svgChar, setSvgChar] = useState(null);
  const [activeTab, setActiveTab] = useState("総合");
  const [loadingCustom, setLoadingCustom] = useState(false);

  // refでresult/aiDataを常に最新値として参照
  const resultRef = useRef(null);
  const aiDataRef = useRef(null);

  const activeTheme = themeInput.trim() || selectedTheme;

  function pickPreset(t) { setSelectedTheme(t); setThemeInput(""); }

  async function generateSvgChar(characterName, theme, accentColor) {
    setSvgChar(null);
    const prompt = `以下のキャラクターをSVGイラストで描いてください。

キャラクター名：「${characterName}」（テーマ：${theme}）

【仕様】
- <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> で始めること
- 背景なし（透明）
- 個性的でユーモアがあり、親しみやすい表情のキャラクター
- 顔・目・口・体を描く（棒人間は不可）
- メインカラー：${accentColor}
- 200×200の中央に配置
- アニメーションなし

SVGコードのみ。説明文・コードブロック不要。`;

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("").trim();
      const clean = text.replace(/^```[\w]*\n?|```$/gm, "").trim();
      if (clean.includes("<svg")) setSvgChar(clean);
    } catch { /* 失敗時は絵文字にフォールバック */ }
  }

  async function runFortune() {
    if (!birthdate.year || !birthdate.month || !birthdate.day || !activeTheme) return;
    setStep("loading");
    setSvgChar(null);

    const y = Number(birthdate.year), m = Number(birthdate.month), d = Number(birthdate.day);
    const element = getElement(y, m, d);
    const colors = ELEMENT_COLORS[element];

    const allKeys = ["総合", "恋愛", "仕事", "金", "健康"];
    const messagesTemplate = allKeys.map(k => `    "${k}": "2〜3文"`).join(",\n");
    const adviceTemplate = allKeys.map(k => `    "${k}": "一言"`).join(",\n");

    const userPrompt = `【占い対象者】
生年月日：${y}年${m}月${d}日　五行：${element}
テーマ：「${activeTheme}」占い

【キャラクター名の作り方】
・この人を「${activeTheme}」の世界観で表現した個性的なキャラクター名
・ユーモアとクスッと笑える要素を入れる（例：「二度寝が得意なゾウ係長」「締め切りに強いホッチキス」「うっかり寝坊するエース投手」）
・親しみやすく、読んだ瞬間にクスッとくる名前にする

【占いメッセージ】
・「${activeTheme}」の世界観と言葉を使った楽しい日本語
・自然でユーモアのある表現にする
・「木の属性」「火の気」などの専門用語は文章に出さない
・難しい言葉や不自然な表現は避ける

JSONのみ返してください：
{
  "character": "ユーモアあるキャラクター名",
  "emoji": "絵文字1つ",
  "lucky": "ラッキーアイテム（${activeTheme}にちなんだもの）",
  "messages": {
${messagesTemplate}
  },
  "advice": {
${adviceTemplate}
  }
}`;

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: "あなたは四柱推命の占い師です。JSONのみ返してください。コードブロック不要。",
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("").trim();
      const clean = text.replace(/^```[\w]*\n?|```$/gm, "").trim();
      const parsed = JSON.parse(clean);
      setAiData(parsed);
      aiDataRef.current = parsed;
      const newResult = { element, colors, theme: activeTheme, y, m, d };
      setResult(newResult);
      resultRef.current = newResult;
      setCustomCats([]);
      setActiveTab("総合");
      setStep("result");
      generateSvgChar(parsed.character, activeTheme, colors.accent);
    } catch {
      const fallback = { character: `${activeTheme}キャラ`, emoji: "✨", lucky: activeTheme, messages: {}, advice: {} };
      allKeys.forEach(k => { fallback.messages[k] = "今日も自分らしく。"; fallback.advice[k] = "前向きに！"; });
      setAiData(fallback);
      aiDataRef.current = fallback;
      const newResult = { element, colors, theme: activeTheme, y, m, d };
      setResult(newResult);
      resultRef.current = newResult;
      setStep("result");
    }
  }

  async function fetchCustomFortune(key) {
    const r = resultRef.current;
    const ad = aiDataRef.current;
    if (!r || !ad) return;

    setLoadingCustom(true);
    setActiveTab(key);

    const prompt = `【占い対象者】
生年月日：${r.y}年${r.m}月${r.d}日　五行：${r.element}
テーマ：「${r.theme}」占い
キャラクター：${ad.character}
占う内容：「${key}」

「${key}」に関するユーモアのある具体的な占いアドバイスを「${r.theme}」の世界観で。
JSONのみ：{"message": "2〜3文", "advice": "一言アドバイス"}`;

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: "JSONのみ返してください。コードブロック不要。",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("").trim();
      const clean = text.replace(/^```[\w]*\n?|```$/gm, "").trim();
      const parsed = JSON.parse(clean);
      setAiData(prev => {
        const updated = {
          ...prev,
          messages: { ...prev.messages, [key]: parsed.message },
          advice: { ...prev.advice, [key]: parsed.advice },
        };
        aiDataRef.current = updated;
        return updated;
      });
      setCustomCats(prev => {
        if (prev.find(c => c.key === key)) return prev;
        return [...prev, { key, label: key, emoji: "🔍" }];
      });
    } catch {
      setAiData(prev => {
        const updated = {
          ...prev,
          messages: { ...prev.messages, [key]: "占い結果を取得できませんでした。" },
          advice: { ...prev.advice, [key]: "もう一度試してみてください。" },
        };
        aiDataRef.current = updated;
        return updated;
      });
    }
    setLoadingCustom(false);
  }

  const allCats = [...DEFAULT_CATEGORIES, ...customCats];
  const cat = allCats.find(c => c.key === activeTab);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes msgFade { from{opacity:0} to{opacity:1} }
        .float { animation: float 3s ease-in-out infinite; display:inline-block; }
        .fade-in { animation: fadeIn .6s ease forwards; }
        .msg-fade { animation: msgFade .4s ease forwards; }
        select, input { outline: none; }
        button { cursor: pointer; transition: transform .15s, opacity .15s; }
        button:hover { opacity: .85; }
        button:active { transform: scale(.97); }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 46, marginBottom: 5 }} className="float">🔮</div>
          <h1 style={{ color: "#e0c8ff", fontSize: 23, fontWeight: 700, margin: 0, letterSpacing: 4 }}>キャラクター占い</h1>
          <p style={{ color: "#a89cc8", fontSize: 11, marginTop: 4, letterSpacing: 2 }}>四柱推命 × 自由テーマ占い</p>
        </div>

        {/* INPUT */}
        {step === "input" && (
          <div className="fade-in" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 24, padding: "26px 20px", border: "1px solid rgba(224,200,255,0.2)" }}>

            <p style={{ color: "#a89cc8", fontSize: 12, marginBottom: 8, textAlign: "left" }}>🎂 生年月日</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[
                { key: "year", label: "年", options: Array.from({length: 80}, (_, i) => 2006 - i) },
                { key: "month", label: "月", options: Array.from({length: 12}, (_, i) => i + 1) },
                { key: "day", label: "日", options: Array.from({length: 31}, (_, i) => i + 1) },
              ].map(({ key, label, options }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#a89cc8", fontSize: 13, width: 18, flexShrink: 0 }}>{label}</span>
                  <select value={birthdate[key]} onChange={e => setBirthdate(p => ({ ...p, [key]: e.target.value }))}
                    style={{ flex: 1, padding: "11px 12px", borderRadius: 12, border: "1px solid rgba(224,200,255,0.3)", background: "rgba(30,20,60,0.95)", color: birthdate[key] ? "#fff" : "#a89cc8", fontSize: 15, appearance: "none", WebkitAppearance: "none" }}>
                    <option value="" disabled>{label}を選択</option>
                    {options.map(v => <option key={v} value={v} style={{ background: "#1a1040" }}>{key === "year" ? `${v}年` : key === "month" ? `${v}月` : `${v}日`}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <p style={{ color: "#a89cc8", fontSize: 12, marginBottom: 8, textAlign: "left" }}>🎭 何に例えて占いますか？</p>
            <input type="text" placeholder="例：家電製品、お菓子、宇宙人…" value={themeInput}
              onChange={e => { setThemeInput(e.target.value); setSelectedTheme(""); }}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, boxSizing: "border-box", border: themeInput ? "1px solid #c77dff" : "1px solid rgba(224,200,255,0.3)", background: "rgba(30,20,60,0.95)", color: "#fff", fontSize: 15, marginBottom: 10 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
              {PRESET_THEMES.map(t => (
                <button key={t} onClick={() => pickPreset(t)} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 12, border: selectedTheme === t ? "1.5px solid #c77dff" : "1px solid rgba(255,255,255,0.2)", background: selectedTheme === t ? "rgba(199,125,255,0.2)" : "transparent", color: selectedTheme === t ? "#c77dff" : "#a89cc8" }}>{t}</button>
              ))}
            </div>

            <button onClick={runFortune} disabled={!activeTheme || !birthdate.year || !birthdate.month || !birthdate.day}
              style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: activeTheme && birthdate.year ? "linear-gradient(135deg, #7b2ff7, #c77dff)" : "rgba(100,100,120,0.3)", color: "#fff", fontSize: 16, fontWeight: 700, letterSpacing: 2, boxShadow: activeTheme && birthdate.year ? "0 4px 24px rgba(123,47,247,0.4)" : "none" }}>
              🔮 占う
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div className="fade-in" style={{ color: "#c9b8e8", fontSize: 15 }}>
            <div style={{ fontSize: 48, animation: "spin 1.5s linear infinite", display: "inline-block" }}>🔮</div>
            <p style={{ marginTop: 14, letterSpacing: 2 }}>「{activeTheme}」の運命を読み解いています…</p>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && aiData && (
          <div className="fade-in">
            <div style={{ background: `linear-gradient(135deg, ${result.colors.color}33, rgba(255,255,255,0.04))`, borderRadius: 24, padding: "24px 20px", border: `1px solid ${result.colors.accent}44` }}>

              {/* キャラ画像 */}
              <div style={{ width: 150, height: 150, margin: "0 auto 10px", borderRadius: "50%", background: `${result.colors.color}55`, border: `2px solid ${result.colors.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }} className="float">
                {svgChar
                  ? <div dangerouslySetInnerHTML={{ __html: svgChar }} style={{ width: 140, height: 140 }} />
                  : <div style={{ fontSize: 66 }}>{aiData.emoji}</div>
                }
              </div>

              <div style={{ color: result.colors.accent, fontSize: 11, letterSpacing: 3, marginBottom: 3 }}>あなたは…</div>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "0 0 16px", letterSpacing: 1 }}>{aiData.character}</h2>

              {/* メッセージ */}
              <div style={{ marginTop: 14 }}>
                {loadingCustom && !aiData.messages[activeTab] ? (
                  <div style={{ color: "#c9b8e8", padding: "20px", fontSize: 14 }}>
                    <div style={{ fontSize: 28, animation: "spin 1.2s linear infinite", display: "inline-block" }}>🔮</div>
                    <p style={{ marginTop: 8 }}>占っています…</p>
                  </div>
                ) : (
                  <div key={activeTab} className="msg-fade">
                    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 14, padding: "16px", marginBottom: 10, textAlign: "left" }}>
                      <div style={{ color: result.colors.accent, fontSize: 12, marginBottom: 6 }}>{cat?.emoji} {cat?.label || cat?.key}</div>
                      <p style={{ color: "#e8deff", lineHeight: 1.9, fontSize: 14, margin: 0 }}>
                        {aiData.messages[activeTab] || "下のボタンで占ってください"}
                      </p>
                    </div>
                    {aiData.advice[activeTab] && (
                      <div style={{ borderLeft: `3px solid ${result.colors.accent}`, paddingLeft: 12, textAlign: "left", marginBottom: 14 }}>
                        <p style={{ color: result.colors.accent, fontSize: 11, margin: "0 0 3px" }}>今日のひとこと</p>
                        <p style={{ color: "#d8ccf0", fontSize: 13, margin: 0, lineHeight: 1.7 }}>{aiData.advice[activeTab]}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ラッキー */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
                <span style={{ color: result.colors.accent, fontSize: 11 }}>🍀 ラッキー　</span>
                <span style={{ color: "#e8deff", fontSize: 13 }}>{aiData.lucky}</span>
              </div>

              {/* もう一度 */}
              <button onClick={() => { setStep("input"); setResult(null); resultRef.current = null; setAiData(null); aiDataRef.current = null; setCustomCats([]); setSvgChar(null); setActiveTab("総合"); }}
                style={{ padding: "11px 26px", borderRadius: 20, border: `1px solid ${result.colors.accent}`, background: "transparent", color: result.colors.accent, fontSize: 13, letterSpacing: 1, marginBottom: 20 }}>
                もう一度占う 🔮
              </button>

              {/* さらに占う（一番下） */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                <p style={{ color: "#a89cc8", fontSize: 11, textAlign: "left", margin: "0 0 10px" }}>➕ さらに占いたいことを入力、またはボタンを選択</p>

                {/* 入力欄＋占うボタン */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  <input type="text" placeholder="例：ゴルフ、転職、受験…" value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const val = e.target.value.trim();
                        if (val) { fetchCustomFortune(val); setCustomInput(""); }
                      }
                    }}
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(224,200,255,0.25)", background: "rgba(30,20,60,0.8)", color: "#fff", fontSize: 13 }} />
                  <button onClick={() => {
                    const val = customInput.trim();
                    if (!val) return;
                    fetchCustomFortune(val);
                    setCustomInput("");
                  }} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7b2ff7, #c77dff)", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                    🔮 占う
                  </button>
                </div>

                {/* 運勢ボタン一覧 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                  {DEFAULT_CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setActiveTab(c.key)} style={{
                      padding: "7px 4px", borderRadius: 10, fontSize: 11, border: "none",
                      background: activeTab === c.key ? result.colors.accent : "rgba(255,255,255,0.09)",
                      color: activeTab === c.key ? "#000" : "#a89cc8",
                      fontWeight: activeTab === c.key ? 700 : 400,
                      textAlign: "center",
                    }}>{c.emoji} {c.label}</button>
                  ))}
                  {customCats.map(c => (
                    <button key={c.key} onClick={() => setActiveTab(c.key)} style={{
                      padding: "7px 4px", borderRadius: 10, fontSize: 11,
                      border: "1px solid rgba(199,125,255,0.4)",
                      background: activeTab === c.key ? "#c77dff" : "rgba(199,125,255,0.1)",
                      color: activeTab === c.key ? "#000" : "#c77dff",
                      fontWeight: activeTab === c.key ? 700 : 400,
                      textAlign: "center",
                    }}>🔍 {c.key}</button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
