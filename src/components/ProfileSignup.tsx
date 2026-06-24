import React, { useState } from 'react';
import { PerformerProfile, ThemeColors } from '../types';
import { User, Mail, Music, DollarSign, Facebook, Sparkles, Check } from 'lucide-react';

interface ProfileSignupProps {
  profile: PerformerProfile;
  colors: ThemeColors;
  onSignupComplete: (profile: PerformerProfile) => void;
  onCancel: () => void;
}

export default function ProfileSignup({
  profile,
  colors,
  onSignupComplete,
  onCancel
}: ProfileSignupProps) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [bandName, setBandName] = useState(profile.bandName || '');
  const [facebookUrl, setFacebookUrl] = useState(profile.facebookUrl || '');
  const [cashappTag, setCashappTag] = useState(profile.cashappTag || '');
  const [venmoTag, setVenmoTag] = useState(profile.venmoTag || '');
  const [bannerText, setBannerText] = useState(profile.brandBannerText || '');
  
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !bandName.trim()) {
      setError('Please fill out all required fields (Full Name, Email, and Band Name).');
      return;
    }

    onSignupComplete({
      name: name.trim(),
      email: email.trim(),
      bandName: bandName.trim(),
      facebookUrl: facebookUrl.trim() || undefined,
      cashappTag: cashappTag.trim() || undefined,
      venmoTag: venmoTag.trim() || undefined,
      brandBannerText: bannerText.trim() || undefined
    });
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-8 rounded-2xl border shadow-2xl animate-fade-in text-left"
         style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '22', color: colors.text }}>
      
      {/* Signup Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-gradient-to-tr from-amber-500 to-yellow-400">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <h2 className="text-2xl font-black tracking-tight" style={{ color: colors.primary }}>Performers Pro Signup</h2>
        <p className="text-xs opacity-75 mt-1">Unlock cloud catalogs, Stage Sync, and live audience requests. Please finalize your professional profile details below.</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Required details */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 border-b pb-1 border-white/5">Required Performance Information</h3>
          
          <div>
            <label className="block text-xs font-bold mb-1 opacity-80 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Performer Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jimi Hendrix"
              className="w-full px-4 py-2 bg-black/20 rounded-lg border text-sm focus:outline-none focus:ring-1"
              style={{ borderColor: colors.accent + '33' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 opacity-80 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jimi@hendrix.com"
              className="w-full px-4 py-2 bg-black/20 rounded-lg border text-sm focus:outline-none focus:ring-1"
              style={{ borderColor: colors.accent + '33' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 opacity-80 flex items-center gap-1">
              <Music className="w-3.5 h-3.5" />
              Band / Stage Name *
            </label>
            <input
              type="text"
              required
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="e.g. The Jimi Hendrix Experience"
              className="w-full px-4 py-2 bg-black/20 rounded-lg border text-sm focus:outline-none focus:ring-1"
              style={{ borderColor: colors.accent + '33' }}
            />
          </div>
        </div>

        {/* Optional Branding and Socials */}
        <div className="space-y-3.5 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 border-b pb-1 border-white/5">Optional Integrations & Branding</h3>

          <div>
            <label className="block text-xs font-bold mb-1 opacity-80 flex items-center gap-1">
              <Facebook className="w-3.5 h-3.5" />
              Facebook Page URL
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/jimihendrix"
              className="w-full px-4 py-2 bg-black/20 rounded-lg border text-sm focus:outline-none focus:ring-1"
              style={{ borderColor: colors.accent + '22' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1 opacity-80 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                Venmo Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">@</span>
                <input
                  type="text"
                  value={venmoTag.replace('@', '')}
                  onChange={(e) => setVenmoTag(e.target.value)}
                  placeholder="username"
                  className="w-full pl-7 pr-4 py-2 bg-black/20 rounded-lg border text-sm focus:outline-none focus:ring-1"
                  style={{ borderColor: colors.accent + '22' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 opacity-80 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                Cash App Tag
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">$</span>
                <input
                  type="text"
                  value={cashappTag.replace('$', '')}
                  onChange={(e) => setCashappTag(e.target.value)}
                  placeholder="tagname"
                  className="w-full pl-7 pr-4 py-2 bg-black/20 rounded-lg border text-sm focus:outline-none focus:ring-1"
                  style={{ borderColor: colors.accent + '22' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 opacity-80">Banner Greeting Text</label>
            <textarea
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              rows={2}
              placeholder="e.g. Welcome to our show! Tip links above, request catalog below. Have fun!"
              className="w-full px-4 py-2 bg-black/20 rounded-lg border text-xs focus:outline-none focus:ring-1"
              style={{ borderColor: colors.accent + '22' }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border font-bold text-sm transition-all hover:bg-white/5 cursor-pointer"
            style={{ borderColor: colors.accent + '33' }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-102 flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <Check className="w-4 h-4" />
            Complete Profile
          </button>
        </div>
      </form>
    </div>
  );
}
