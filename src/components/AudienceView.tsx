import React, { useState } from 'react';
import { Song, RequestItem, AppSettings, PerformerProfile } from '../types';
import { Search, Music, DollarSign, Award, ArrowLeft, ArrowRight, Share2, Compass } from 'lucide-react';

interface AudienceViewProps {
  songs: Song[];
  requests: RequestItem[];
  settings: AppSettings;
  profile: PerformerProfile;
  onSubmitRequest: (songId: string | undefined, title: string, artist: string, requesterName: string, tipAmount: number, isCustom: boolean) => Promise<any>;
}

export default function AudienceView({
  songs,
  requests,
  settings,
  profile,
  onSubmitRequest
}: AudienceViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestModalSong, setRequestModalSong] = useState<Song | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [tipSelection, setTipSelection] = useState<number | 'none'>(5);
  const [customTip, setCustomTip] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [lastRequestedTitle, setLastRequestedTitle] = useState('');

  // Extract unique genres
  const genres = ['All', ...Array.from(new Set(songs.map(s => s.genre).filter(Boolean)))];

  // Fuzzy multi-keyword search
  const filteredSongs = songs.filter(song => {
    // Genre filter
    if (selectedGenre !== 'All' && song.genre !== selectedGenre) return false;

    // Search query multi-word filter
    if (!searchQuery.trim()) return true;
    
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const searchableText = `${song.title} ${song.artist}`.toLowerCase();
    
    // Check if every keyword is present in the searchableText
    return keywords.every(kw => searchableText.includes(kw));
  });

  // Pagination
  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredSongs.length / ITEMS_PER_PAGE) || 1;
  const paginatedSongs = filteredSongs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openRequestModal = (song: Song) => {
    setRequestModalSong(song);
    setTipSelection(5);
    setCustomTip('');
    setRequesterName('');
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCustom = !requestModalSong;
    const title = isCustom ? customTitle.trim() : requestModalSong!.title;
    const artist = isCustom ? customArtist.trim() : requestModalSong!.artist;
    const songId = isCustom ? undefined : requestModalSong!.id;

    if (!title) return;

    const tipVal = tipSelection === 'none' ? 0 : Number(tipSelection === 'custom' ? customTip : tipSelection);
    const finalTip = isNaN(tipVal) ? 0 : tipVal;

    await onSubmitRequest(songId, title, artist, requesterName, finalTip, isCustom);
    setLastRequestedTitle(title);
    
    // Reset state and show thank you
    setRequestModalSong(null);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomArtist('');
    setShowThankYou(true);
  };

  // Helper to find how many times a song is requested at this gig
  const getRequestCount = (song: Song) => {
    const req = requests.find(r => !r.played && r.songId === song.id);
    return req ? req.requestCount : 0;
  };

  // Helper to check if a song is already played
  const isSongPlayed = (song: Song) => {
    // Dim if the song is marked played in the requests list OR the song plays counter is > 0
    if (song.plays > 0) return true;
    const req = requests.find(r => r.songId === song.id && r.played);
    return !!req;
  };

  const activeColors = settings.frontendColors;

  return (
    <div 
      className="min-h-screen theme-frontend pb-12 transition-colors duration-200"
      style={{
        backgroundColor: activeColors.bg,
        color: activeColors.text,
        fontFamily: settings.fontStyle === 'sans' ? 'Inter, sans-serif' : settings.fontStyle === 'serif' ? 'Georgia, serif' : 'monospace'
      }}
    >
      {/* Dynamic Header Banner */}
      <div 
        className="relative py-12 px-6 text-center overflow-hidden border-b transition-all"
        style={{ 
          backgroundColor: activeColors.cardBg, 
          borderColor: activeColors.accent + '33' 
        }}
        id="audience-banner"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary-color)] to-[var(--accent-color)]" style={{ backgroundColor: activeColors.primary }} />
        
        <h1 
          className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3"
          style={{ color: activeColors.text }}
        >
          {profile.bandName || 'Live Performer Requests'}
        </h1>
        <p className="text-lg max-w-xl mx-auto opacity-85 mb-6">
          {profile.brandBannerText || 'Welcome! Browse my song list, request your favorite songs, and support the show!'}
        </p>

        {/* Tip Links At the Top */}
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {profile.cashappTag && (
            <a
              href={`https://cash.app/$${profile.cashappTag.replace('$', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-transform hover:scale-105"
              style={{ backgroundColor: '#00D632', color: '#ffffff' }}
              id="audience-tip-cashapp"
            >
              <DollarSign className="w-5 h-5" />
              Tip via Cash App
            </a>
          )}
          {profile.venmoTag && (
            <a
              href={`https://venmo.com/${profile.venmoTag.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-transform hover:scale-105"
              style={{ backgroundColor: '#008CFF', color: '#ffffff' }}
              id="audience-tip-venmo"
            >
              <DollarSign className="w-5 h-5" />
              Tip via Venmo
            </a>
          )}
          {!profile.cashappTag && !profile.venmoTag && (
            <div 
              className="px-4 py-2 rounded-full border text-xs tracking-wider uppercase font-semibold opacity-75"
              style={{ borderColor: activeColors.accent, color: activeColors.accent }}
            >
              🎸 Enjoy the live performance!
            </div>
          )}
        </div>
      </div>

      {showThankYou ? (
        /* Thank You View */
        <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border text-center animate-fade-in shadow-xl"
          style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '22' }}
          id="audience-thank-you"
        >
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
               style={{ backgroundColor: activeColors.accent + '22' }}>
            <Award className="w-8 h-8" style={{ color: activeColors.accent }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: activeColors.primary }}>Thank You!</h2>
          <p className="opacity-80 mb-6">
            Your request for <strong className="font-semibold">"{lastRequestedTitle}"</strong> has been queued up for the performer!
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowThankYou(false)}
              className="w-full py-3 rounded-xl font-bold transition-all hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: activeColors.primary, color: '#ffffff' }}
            >
              Back to Song Catalog
            </button>
            
            {profile.facebookUrl && (
              <a
                href={profile.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-xl border font-bold text-center transition-all hover:bg-white/5"
                style={{ borderColor: activeColors.accent, color: activeColors.accent }}
              >
                Follow on Facebook
              </a>
            )}
          </div>
        </div>
      ) : (
        /* Catalog List View */
        <div className="max-w-4xl mx-auto px-4 mt-8" id="audience-catalog">
          {/* Search and Custom Request */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
              <input
                type="text"
                placeholder="Search songs... (e.g. 'George ace')"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-3 rounded-xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                style={{ 
                  borderColor: activeColors.accent + '33',
                  color: activeColors.text
                }}
                id="audience-search-input"
              />
            </div>
            
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer text-white"
              style={{ backgroundColor: activeColors.accent }}
              id="audience-custom-request-btn"
            >
              <Music className="w-5 h-5" />
              Request Custom Song
            </button>
          </div>

          {/* Genre Filters Scrollable Bar */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10" id="audience-genres">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border cursor-pointer"
                style={{
                  backgroundColor: selectedGenre === genre ? activeColors.primary : activeColors.cardBg,
                  color: selectedGenre === genre ? '#ffffff' : activeColors.text,
                  borderColor: selectedGenre === genre ? activeColors.primary : activeColors.accent + '22'
                }}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Songs List */}
          <div className="space-y-3 mt-4" id="audience-song-list">
            {paginatedSongs.length > 0 ? (
              paginatedSongs.map(song => {
                const reqCount = getRequestCount(song);
                const played = isSongPlayed(song);
                
                return (
                  <div
                    key={song.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:translate-x-1 ${
                      played ? 'opacity-40 select-none' : 'hover:bg-white/5'
                    }`}
                    style={{ 
                      backgroundColor: activeColors.cardBg, 
                      borderColor: activeColors.accent + '22' 
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-lg truncate ${played ? 'line-through' : ''}`}>
                          {song.title}
                        </h3>
                        {played && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full border font-medium uppercase"
                            style={{ borderColor: activeColors.accent + '44', color: activeColors.accent }}
                          >
                            Played
                          </span>
                        )}
                        {reqCount > 0 && !played && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse text-white"
                            style={{ backgroundColor: activeColors.primary }}
                          >
                            Requested {reqCount}x
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-75 truncate">{song.artist}</p>
                      <span 
                        className="inline-block text-xs mt-1.5 px-2 py-0.5 rounded border opacity-70"
                        style={{ borderColor: activeColors.accent + '22' }}
                      >
                        {song.genre || 'Uncategorized'}
                      </span>
                    </div>

                    {!played && (
                      <button
                        onClick={() => openRequestModal(song)}
                        className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-white"
                        style={{ backgroundColor: activeColors.primary }}
                      >
                        {reqCount > 0 ? 'Bump Up' : 'Request'}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div 
                className="py-12 text-center rounded-2xl border"
                style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '11' }}
              >
                <Music className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p className="opacity-75">No songs match your search query or genre filter.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-sm font-semibold underline"
                  style={{ color: activeColors.primary }}
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 border-t pt-6" style={{ borderColor: activeColors.accent + '22' }} id="audience-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold border disabled:opacity-30 disabled:pointer-events-none transition-all hover:bg-white/5 cursor-pointer"
                style={{ borderColor: activeColors.accent + '33' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Prev
              </button>
              
              <span className="text-sm opacity-80 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold border disabled:opacity-30 disabled:pointer-events-none transition-all hover:bg-white/5 cursor-pointer"
                style={{ borderColor: activeColors.accent + '33' }}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Disclaimer at Bottom of Page */}
          <div className="mt-12 text-center text-xs opacity-60">
            <p className="max-w-md mx-auto">
              Tips encourage the artist, but are completely optional. Selected songs are queued in real time.
            </p>
          </div>
        </div>
      )}

      {/* REQUEST MODAL (Either Song Catalog or Custom) */}
      {(requestModalSong || showCustomModal) && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl p-6 border shadow-2xl relative"
            style={{ backgroundColor: activeColors.cardBg, borderColor: activeColors.accent + '44' }}
            id="audience-request-modal"
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: activeColors.primary }}>
              {requestModalSong ? `Request Song` : 'Custom Suggestion'}
            </h2>
            
            {requestModalSong ? (
              <div className="mb-4 p-3 rounded-lg border bg-white/5" style={{ borderColor: activeColors.accent + '11' }}>
                <p className="font-semibold text-lg">{requestModalSong.title}</p>
                <p className="text-sm opacity-75">{requestModalSong.artist}</p>
              </div>
            ) : (
              <div className="mb-4 text-xs p-3 rounded-lg border bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                ⚠️ <strong className="font-semibold">Disclaimer:</strong> The artist may not perform this request because they don't know it yet, but they will take your suggestions on what they should learn next!
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Custom Song inputs */}
              {!requestModalSong && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">Song Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Free Bird"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                      style={{ borderColor: activeColors.accent + '22' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">Artist Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lynyrd Skynyrd"
                      value={customArtist}
                      onChange={(e) => setCustomArtist(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                      style={{ borderColor: activeColors.accent + '22' }}
                    />
                  </div>
                </>
              )}

              {/* Requester Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-75">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Smith"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{ borderColor: activeColors.accent + '22' }}
                />
              </div>

              {/* Tip Selection Section */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-75">
                  Send a Tip? <span className="normal-case opacity-75">(Encouraged, but not required)</span>
                </label>
                
                {/* Quick select tips */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[2, 5, 10, 20].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipSelection(amt)}
                      className="py-2 rounded-lg font-bold border text-sm transition-all cursor-pointer"
                      style={{
                        backgroundColor: tipSelection === amt ? activeColors.accent : 'transparent',
                        color: tipSelection === amt ? '#ffffff' : activeColors.text,
                        borderColor: tipSelection === amt ? activeColors.accent : activeColors.accent + '22'
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                {/* Custom / No Tip */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipSelection('none')}
                    className="py-2.5 rounded-lg font-bold border text-xs transition-all cursor-pointer"
                    style={{
                      backgroundColor: tipSelection === 'none' ? activeColors.primary : 'transparent',
                      color: tipSelection === 'none' ? '#ffffff' : activeColors.text,
                      borderColor: tipSelection === 'none' ? activeColors.primary : activeColors.accent + '22'
                    }}
                  >
                    No Tip/Cash Tip
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipSelection('custom')}
                    className="py-2.5 rounded-lg font-bold border text-xs transition-all cursor-pointer"
                    style={{
                      backgroundColor: tipSelection === 'custom' ? activeColors.accent : 'transparent',
                      color: tipSelection === 'custom' ? '#ffffff' : activeColors.text,
                      borderColor: tipSelection === 'custom' ? activeColors.accent : activeColors.accent + '22'
                    }}
                  >
                    Custom Tip
                  </button>
                </div>

                {tipSelection === 'custom' && (
                  <div className="mt-2.5 relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-75" />
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter amount (USD)"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                      style={{ borderColor: activeColors.accent + '33' }}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: activeColors.accent + '22' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRequestModalSong(null);
                    setShowCustomModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg border font-bold text-sm transition-all hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: activeColors.accent + '44' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110 cursor-pointer text-white"
                  style={{ backgroundColor: activeColors.primary }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
