import { useState, useEffect } from 'react';
import { AppSettings, PerformerProfile, ThemeColors } from '../types';
import { themePresets, ColorPreset } from '../data/themePresets';
import { isContrastAcceptable, getContrastRatio } from '../utils/colorUtils';
import { AlertTriangle, Check, RefreshCw, Moon, Sun, Paintbrush, Sliders, Type } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  profile: PerformerProfile;
  onSaveSettings: (settings: AppSettings) => void;
  onSaveProfile: (profile: PerformerProfile) => void;
}

export default function SettingsView({
  settings,
  profile,
  onSaveSettings,
  onSaveProfile
}: SettingsViewProps) {
  // Brand color states
  const [matchFrontBack, setMatchFrontBack] = useState(settings.matchFrontBack);
  const [isDarkMode, setIsDarkMode] = useState(settings.isDarkMode);
  
  const [backendColors, setBackendColors] = useState<ThemeColors>(settings.backendColors);
  const [frontendColors, setFrontendColors] = useState<ThemeColors>(settings.frontendColors);

  // Text/Defaults states
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono'>(settings.fontStyle);
  const [defaultFontSize, setDefaultFontSize] = useState(settings.defaultFontSize);
  const [defaultScrollDelay, setDefaultScrollDelay] = useState(settings.defaultScrollDelay);
  const [defaultScrollSpeed, setDefaultScrollSpeed] = useState(settings.defaultScrollSpeed);
  const [chordSiteSearchUrl, setChordSiteSearchUrl] = useState(settings.chordSiteSearchUrl);

  // Warnings / Checks
  const [contrastErrorBackend, setContrastErrorBackend] = useState('');
  const [contrastErrorFrontend, setContrastErrorFrontend] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile fields (used for metadata/social links)
  const [profName, setProfName] = useState(profile.name || '');
  const [profEmail, setProfEmail] = useState(profile.email || '');
  const [profBandName, setProfBandName] = useState(profile.bandName || '');
  const [profFb, setProfFb] = useState(profile.facebookUrl || '');
  const [profCashapp, setProfCashapp] = useState(profile.cashappTag || '');
  const [profVenmo, setProfVenmo] = useState(profile.venmoTag || '');
  const [profBannerText, setProfBannerText] = useState(profile.brandBannerText || '');

  // Perform contrast check on state changes
  useEffect(() => {
    if (!isContrastAcceptable(backendColors.bg, backendColors.text)) {
      const ratio = getContrastRatio(backendColors.bg, backendColors.text).toFixed(2);
      setContrastErrorBackend(`Backend colors have too low contrast (${ratio}:1). Text might be illegible! Choose higher contrast.`);
    } else {
      setContrastErrorBackend('');
    }
  }, [backendColors]);

  useEffect(() => {
    if (!isContrastAcceptable(frontendColors.bg, frontendColors.text)) {
      const ratio = getContrastRatio(frontendColors.bg, frontendColors.text).toFixed(2);
      setContrastErrorFrontend(`Frontend colors have too low contrast (${ratio}:1). Audience might not be able to read!`);
    } else {
      setContrastErrorFrontend('');
    }
  }, [frontendColors]);

  // Synchronize frontend if match selected
  const updateBackendColor = (key: keyof ThemeColors, value: string) => {
    const updated = { ...backendColors, [key]: value };
    setBackendColors(updated);
    if (matchFrontBack) {
      setFrontendColors(updated);
    }
  };

  const updateFrontendColor = (key: keyof ThemeColors, value: string) => {
    setFrontendColors(prev => ({ ...prev, [key]: value }));
  };

  // Toggle match
  const handleMatchToggle = (val: boolean) => {
    setMatchFrontBack(val);
    if (val) {
      setFrontendColors(backendColors);
    }
  };

  // Preset load
  const loadPresetColors = (preset: ColorPreset) => {
    setBackendColors(preset.colors);
    setIsDarkMode(preset.isDark);
    if (matchFrontBack) {
      setFrontendColors(preset.colors);
    }
  };

  const handleSave = () => {
    // Block saving if contrast is dangerously bad (ratio < 2.0)
    const backendRatio = getContrastRatio(backendColors.bg, backendColors.text);
    const frontendRatio = getContrastRatio(frontendColors.bg, frontendColors.text);

    if (backendRatio < 2.0 || frontendRatio < 2.0) {
      alert("Error: Contrast ratio is too low! Your text and background colors are nearly identical. Please adjust the colors to ensure the screen is readable before saving.");
      return;
    }

    const updatedSettings: AppSettings = {
      fontStyle,
      defaultFontSize,
      defaultScrollDelay,
      defaultScrollSpeed,
      chordSiteSearchUrl,
      matchFrontBack,
      backendColors,
      frontendColors,
      isDarkMode
    };

    const updatedProfile: PerformerProfile = {
      name: profName,
      email: profEmail,
      bandName: profBandName,
      facebookUrl: profFb,
      cashappTag: profCashapp,
      venmoTag: profVenmo,
      brandBannerText: profBannerText
    };

    onSaveSettings(updatedSettings);
    onSaveProfile(updatedProfile);

    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const activeColors = settings.backendColors;

  return (
    <div 
      className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in"
      style={{ color: activeColors.text }}
      id="settings-container"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activeColors.accent + '22' }}>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: activeColors.primary }}>Settings & Brand Setup</h2>
          <p className="text-sm opacity-75 mt-1">Configure your performance displays, chord viewer, brand colors, and account links.</p>
        </div>
        
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl font-bold bg-[var(--primary-color)] transition-all hover:scale-105 active:scale-95 cursor-pointer text-white shadow-lg"
          style={{ backgroundColor: activeColors.primary }}
          id="settings-save-btn"
        >
          Save All Changes
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border flex items-center gap-2 text-white font-semibold shadow-md animate-pulse"
             style={{ backgroundColor: activeColors.accent, borderColor: activeColors.accent }}>
          <Check className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {/* Preset color scheme loading */}
      <div className="p-6 rounded-2xl border" style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: activeColors.primary }}>
          <Paintbrush className="w-5 h-5" />
          Quick Theme Presets
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" id="theme-presets-grid">
          {themePresets.map(preset => {
            const isSelected = backendColors.bg === preset.colors.bg && backendColors.text === preset.colors.text;
            return (
              <button
                key={preset.name}
                onClick={() => loadPresetColors(preset)}
                className="p-3 rounded-xl border text-left transition-all hover:scale-105 flex flex-col justify-between h-24 relative overflow-hidden group cursor-pointer"
                style={{ 
                  backgroundColor: preset.colors.bg, 
                  color: preset.colors.text, 
                  borderColor: isSelected ? activeColors.primary : preset.colors.accent + '33' 
                }}
              >
                <div className="text-xs font-bold truncate pr-4">{preset.name}</div>
                <div className="flex gap-1.5 mt-auto">
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.colors.primary }} />
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.colors.accent }} />
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.colors.cardBg }} />
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: activeColors.primary }}>
                    <Check className="w-2.5 h-2.5 font-bold" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 rounded-xl border bg-blue-500/10 border-blue-500/20 text-xs flex items-center gap-2">
          <Moon className="w-4 h-4 text-blue-400" />
          <span>
            <strong className="font-semibold text-blue-300">Visibility Tip:</strong> Performers are heavily encouraged to use a <strong className="font-semibold text-blue-300">Dark Theme</strong> (such as Cosmic Slate or Sunset Amber) to reduce eye strain, conserve tablet battery, and ensure readability in dimly-lit live music environments.
          </span>
        </div>
      </div>

      {/* Brand Color Configurator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Colors */}
        <div className="p-6 rounded-2xl border flex flex-col space-y-4" style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: activeColors.primary }}>Backend / Tablet Colors</h3>
            <p className="text-xs opacity-75 mt-0.5">Define your on-stage performance dashboard colors.</p>
          </div>

          {contrastErrorBackend && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{contrastErrorBackend}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backendColors.bg}
                  onChange={(e) => updateBackendColor('bg', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={backendColors.bg}
                  onChange={(e) => updateBackendColor('bg', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Text / Lyrics</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backendColors.text}
                  onChange={(e) => updateBackendColor('text', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={backendColors.text}
                  onChange={(e) => updateBackendColor('text', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Primary Accent</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backendColors.primary}
                  onChange={(e) => updateBackendColor('primary', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={backendColors.primary}
                  onChange={(e) => updateBackendColor('primary', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Secondary Accent</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backendColors.accent}
                  onChange={(e) => updateBackendColor('accent', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={backendColors.accent}
                  onChange={(e) => updateBackendColor('accent', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Card Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backendColors.cardBg}
                  onChange={(e) => updateBackendColor('cardBg', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={backendColors.cardBg}
                  onChange={(e) => updateBackendColor('cardBg', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Muted Text</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backendColors.mutedText}
                  onChange={(e) => updateBackendColor('mutedText', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={backendColors.mutedText}
                  onChange={(e) => updateBackendColor('mutedText', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Frontend / Audience Colors */}
        <div className="p-6 rounded-2xl border flex flex-col space-y-4" style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: activeColors.primary }}>Frontend / Audience Colors</h3>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={matchFrontBack}
                  onChange={(e) => handleMatchToggle(e.target.checked)}
                  className="rounded bg-black/40 border-white/10 focus:ring-0 cursor-pointer"
                />
                <span>Match Performer Colors</span>
              </label>
            </div>
            <p className="text-xs opacity-75 mt-0.5">Define colors seen by audience members on their mobile phones.</p>
          </div>

          {contrastErrorFrontend && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{contrastErrorFrontend}</span>
            </div>
          )}

          <div className={`grid grid-cols-2 gap-4 ${matchFrontBack ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={frontendColors.bg}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('bg', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={frontendColors.bg}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('bg', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={frontendColors.text}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('text', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={frontendColors.text}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('text', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Primary Accent</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={frontendColors.primary}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('primary', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={frontendColors.primary}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('primary', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Secondary Accent</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={frontendColors.accent}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('accent', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={frontendColors.accent}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('accent', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Card Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={frontendColors.cardBg}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('cardBg', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={frontendColors.cardBg}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('cardBg', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Muted Text</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={frontendColors.mutedText}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('mutedText', e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={frontendColors.mutedText}
                  disabled={matchFrontBack}
                  onChange={(e) => updateFrontendColor('mutedText', e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 bg-black/20 text-xs rounded border border-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Viewer / Defaults configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}>
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: activeColors.primary }}>
            <Sliders className="w-5 h-5" />
            Viewer Defaults
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Font Style Pairings</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sans', 'serif', 'mono'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setFontStyle(style)}
                    className="py-2 rounded-lg font-semibold border capitalize transition-all text-xs cursor-pointer"
                    style={{
                      backgroundColor: fontStyle === style ? activeColors.primary : 'transparent',
                      color: fontStyle === style ? '#ffffff' : activeColors.text,
                      borderColor: fontStyle === style ? activeColors.primary : activeColors.accent + '22'
                    }}
                  >
                    {style === 'sans' ? 'Inter Sans' : style === 'serif' ? 'Georgia Serif' : 'JetBrains Mono'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Default Font Size ({defaultFontSize}px)</label>
              <input
                type="range"
                min="12"
                max="36"
                value={defaultFontSize}
                onChange={(e) => setDefaultFontSize(Number(e.target.value))}
                className="w-full accent-[var(--primary-color)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Scroll Start Delay ({defaultScrollDelay} seconds)</label>
              <input
                type="range"
                min="0"
                max="30"
                value={defaultScrollDelay}
                onChange={(e) => setDefaultScrollDelay(Number(e.target.value))}
                className="w-full accent-[var(--primary-color)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Default Scroll Speed ({defaultScrollSpeed} px/sec)</label>
              <input
                type="range"
                min="5"
                max="100"
                value={defaultScrollSpeed}
                onChange={(e) => setDefaultScrollSpeed(Number(e.target.value))}
                className="w-full accent-[var(--primary-color)]"
              />
            </div>
          </div>
        </div>

        {/* Custom request configuration */}
        <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}>
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: activeColors.primary }}>
            <Type className="w-5 h-5" />
            Custom Requests Integration
          </h3>
          
          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1.5">Custom Request Search Engine Template</label>
            <input
              type="text"
              value={chordSiteSearchUrl}
              onChange={(e) => setChordSiteSearchUrl(e.target.value)}
              placeholder="https://www.ultimate-guitar.com/search.php?value={query}"
              className="w-full px-4 py-2.5 rounded-lg border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{ borderColor: activeColors.accent + '33' }}
            />
            <p className="text-xs opacity-60 mt-1.5 leading-relaxed">
              When an audience member requests a custom song you don't have, tapping it on your dashboard opens this URL in a new window. Use <code className="bg-black/20 px-1 py-0.5 rounded font-mono font-bold text-[10px]">{`{query}`}</code> as a placeholder for the song title and artist.
            </p>
          </div>

          <div className="space-y-1 bg-black/10 p-3 rounded-lg border text-xs" style={{ borderColor: activeColors.accent + '11' }}>
            <p className="font-semibold opacity-85">Example Search Providers:</p>
            <ul className="list-disc list-inside space-y-1 opacity-70">
              <li><strong className="font-semibold">Ultimate Guitar:</strong> <code className="text-[10px]">https://www.ultimate-guitar.com/search.php?value={'{query}'}</code></li>
              <li><strong className="font-semibold">E-Chords:</strong> <code className="text-[10px]">https://www.e-chords.com/search?q={'{query}'}</code></li>
              <li><strong className="font-semibold">Google Chords:</strong> <code className="text-[10px]">https://www.google.com/search?q={'{query}'}+chords</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performer branding & profile */}
      <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}>
        <h3 className="text-lg font-bold" style={{ color: activeColors.primary }}>Performer Brand & Tips Profile</h3>
        <p className="text-xs opacity-75 mt-0.5">These settings populate the headings, tip links, and Facebook button on your audience's requests screen.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Your Name / Contact</label>
            <input
              type="text"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              placeholder="e.g. John Denver"
              className="w-full px-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: activeColors.accent + '22', focusBorderColor: activeColors.primary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Email Address</label>
            <input
              type="email"
              value={profEmail}
              onChange={(e) => setProfEmail(e.target.value)}
              placeholder="e.g. denver@john.com"
              className="w-full px-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: activeColors.accent + '22', focusBorderColor: activeColors.primary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Band / Performer Stage Name *</label>
            <input
              type="text"
              required
              value={profBandName}
              onChange={(e) => setProfBandName(e.target.value)}
              placeholder="e.g. The John Denver Trio"
              className="w-full px-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: activeColors.accent + '22', focusBorderColor: activeColors.primary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Facebook Page URL (Optional)</label>
            <input
              type="url"
              value={profFb}
              onChange={(e) => setProfFb(e.target.value)}
              placeholder="e.g. https://facebook.com/myband"
              className="w-full px-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
              style={{ borderColor: activeColors.accent + '22', focusBorderColor: activeColors.primary }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Venmo Username (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-75">@</span>
              <input
                type="text"
                value={profVenmo.replace('@', '')}
                onChange={(e) => setProfVenmo(e.target.value)}
                placeholder="venmousername"
                className="w-full pl-7 pr-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: activeColors.accent + '22', focusBorderColor: activeColors.primary }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Cash App Tag (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-75">$</span>
              <input
                type="text"
                value={profCashapp.replace('$', '')}
                onChange={(e) => setProfCashapp(e.target.value)}
                placeholder="cashapptag"
                className="w-full pl-7 pr-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
                style={{ borderColor: activeColors.accent + '22', focusBorderColor: activeColors.primary }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase opacity-85 mb-1">Audience Screen Banner Welcome Text</label>
          <textarea
            value={profBannerText}
            onChange={(e) => setProfBannerText(e.target.value)}
            rows={2}
            placeholder="Welcome! Browse my song list, request your favorite songs, and support the show!"
            className="w-full px-4 py-2 bg-transparent rounded-lg border focus:outline-none focus:ring-1"
            style={{ borderColor: activeColors.accent + '22' }}
          />
        </div>
      </div>
    </div>
  );
}
