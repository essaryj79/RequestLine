import { useState } from 'react';
import { Song, RequestItem, Setlist, ThemeColors, AppSettings, PayTier } from '../types';
import { 
  Play, Trash, Search, Music, DollarSign, ListMusic, Shuffle, Save, Check, 
  RotateCcw, Wifi, WifiOff, Radio, Plus, Trash2, ArrowUp, ArrowDown, BookOpen, X
} from 'lucide-react';

interface BackendDashboardProps {
  songs: Song[];
  requests: RequestItem[];
  setlists: Setlist[];
  activeSetlist: string[];
  payTier: PayTier;
  colors: ThemeColors;
  settings: AppSettings;
  isOnline: boolean;
  stageSyncEnabled: boolean;
  onToggleStageSync: () => void;
  onResetGig: () => void;
  onSongSelected: (song: Song) => void;
  onAddRequestToSetlist: (songTitle: string, songArtist: string) => void;
  onMarkRequestPlayed: (requestId: string, played: boolean) => void;
  onDeleteRequest: (requestId: string) => void;
  
  // Setlist operations
  onUpdateActiveSetlist: (songIds: string[]) => void;
  onSaveSetlist: (name: string, songIds: string[]) => void;
  onDeleteSetlist: (id: string) => void;
}

export default function BackendDashboard({
  songs,
  requests,
  setlists,
  activeSetlist,
  payTier,
  colors,
  settings,
  isOnline,
  stageSyncEnabled,
  onToggleStageSync,
  onResetGig,
  onSongSelected,
  onAddRequestToSetlist,
  onMarkRequestPlayed,
  onDeleteRequest,
  onUpdateActiveSetlist,
  onSaveSetlist,
  onDeleteSetlist
}: BackendDashboardProps) {
  // Local state
  const [shoutoutQuery, setShoutoutQuery] = useState('');
  const [showCatalogOverlay, setShowCatalogOverlay] = useState(false);
  const [saveSetlistName, setSaveSetlistName] = useState('');
  const [selectedSetlistId, setSelectedSetlistId] = useState('');

  // 1. Calculations for top bar
  const activeRequests = requests.filter(r => !r.played);
  const totalRequestsCount = requests.length;
  const totalTips = requests.reduce((sum, r) => sum + r.tipAmount, 0);

  // 2. Request list sorting
  // Sorted first by total tip amount, and then by total number of requests
  const sortedRequests = [...requests].sort((a, b) => {
    if (b.tipAmount !== a.tipAmount) {
      return b.tipAmount - a.tipAmount;
    }
    return b.requestCount - a.requestCount;
  });

  // 3. Catalog searches
  // Bottom-left shoutout search (just one result space)
  const shoutoutResults = songs.filter(song => {
    if (!shoutoutQuery.trim()) return false;
    const query = shoutoutQuery.toLowerCase();
    return song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
  });
  const topShoutoutResult = shoutoutResults[0];

  // 4. Setlist features
  // Resolve active setlist song IDs to song objects
  const activeSetlistSongs = activeSetlist
    .map(id => songs.find(s => s.id === id))
    .filter((s): s is Song => !!s);

  // Load a saved setlist
  const handleLoadSetlist = (id: string) => {
    setSelectedSetlistId(id);
    const list = setlists.find(l => l.id === id);
    if (list) {
      onUpdateActiveSetlist(list.songIds);
    }
  };

  // 15 random unplayed songs
  const handleLoadRandomSetlist = () => {
    const playedSongIds = new Set(requests.filter(r => r.played).map(r => r.songId));
    const eligibleSongs = songs.filter(s => !playedSongIds.has(s.id));
    
    // Shuffle all eligible songs and take 15
    const shuffled = [...eligibleSongs].sort(() => 0.5 - Math.random());
    const random15 = shuffled.slice(0, 15).map(s => s.id);
    onUpdateActiveSetlist(random15);
  };

  // Shuffle currently displayed setlist
  const handleShuffleSetlist = () => {
    const shuffled = [...activeSetlist].sort(() => 0.5 - Math.random());
    onUpdateActiveSetlist(shuffled);
  };

  // Re-order setlist songs up/down
  const moveSetlistItem = (index: number, direction: 'up' | 'down') => {
    const updated = [...activeSetlist];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < updated.length) {
      // Swap elements
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      onUpdateActiveSetlist(updated);
    }
  };

  const handleRemoveFromSetlist = (index: number) => {
    const updated = [...activeSetlist];
    updated.splice(index, 1);
    onUpdateActiveSetlist(updated);
  };

  const handleSaveActiveSetlist = () => {
    const name = saveSetlistName.trim() || `Setlist ${new Date().toLocaleDateString()}`;
    if (activeSetlist.length === 0) {
      alert('Setlist is empty, add some songs first!');
      return;
    }
    onSaveSetlist(name, activeSetlist);
    setSaveSetlistName('');
    alert(`Successfully saved setlist: "${name}"`);
  };

  const handleDeleteSavedSetlist = () => {
    if (!selectedSetlistId) return;
    if (confirm('Are you sure you want to delete this saved setlist?')) {
      onDeleteSetlist(selectedSetlistId);
      setSelectedSetlistId('');
      onUpdateActiveSetlist([]);
    }
  };

  // Click on a request handler
  const handleRequestClick = (req: RequestItem) => {
    if (req.isCustom) {
      // Open popular configured chord chart website in new window
      const queryStr = encodeURIComponent(`${req.title} ${req.artist}`);
      const targetUrl = settings.chordSiteSearchUrl.replace('{query}', queryStr);
      window.open(targetUrl, '_blank');
    } else {
      // Find the song from list
      const song = songs.find(s => s.id === req.songId);
      if (song) {
        onSongSelected(song);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)] overflow-hidden" id="backend-dashboard">
      
      {/* A. INFORMATION BAR (TOP) */}
      <div 
        className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b shrink-0"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '22' }}
      >
        {/* Active requests / Online indicator */}
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-extrabold border bg-black/10"
            style={{ borderColor: colors.accent + '22' }}
            id="dashboard-online-status"
          >
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400">Requests: {activeRequests.length} Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-bold">Requests: Offline</span>
              </>
            )}
          </div>
          <span className="text-xs opacity-75">
            {isOnline ? 'Audience can submit requests online!' : 'Request feature is disabled while offline.'}
          </span>
        </div>

        {/* Gig summary metrics */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center bg-black/15 px-3 py-1 rounded-lg border border-white/5">
            <div className="text-[10px] font-bold uppercase opacity-65">Total Requests</div>
            <div className="text-base font-black" style={{ color: colors.primary }}>{totalRequestsCount}</div>
          </div>

          <div className="text-center bg-black/15 px-3 py-1 rounded-lg border border-white/5">
            <div className="text-[10px] font-bold uppercase opacity-65">Gig Tips</div>
            <div className="text-base font-black text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
              {totalTips.toFixed(2)}
            </div>
          </div>

          <div className="text-center bg-black/15 px-3 py-1 rounded-lg border border-white/5">
            <div className="text-[10px] font-bold uppercase opacity-65">Stage Sync</div>
            <div className="text-xs font-bold flex items-center gap-1.5 mt-0.5 justify-center">
              <Radio className={`w-3.5 h-3.5 ${stageSyncEnabled ? 'text-emerald-400 animate-pulse' : 'opacity-40'}`} />
              <button 
                onClick={onToggleStageSync}
                className="underline font-bold text-[11px] opacity-90 cursor-pointer hover:text-[var(--primary-color)]"
                style={{ color: stageSyncEnabled ? colors.accent : colors.mutedText }}
              >
                {stageSyncEnabled ? 'Active' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Reset Gig */}
          <button
            onClick={() => {
              if (confirm('Are you finished with the gig? This will clear all requests and reset play counters for the next night.')) {
                onResetGig();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            id="dashboard-reset-gig-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Gig
          </button>
        </div>
      </div>

      {/* B. MAIN SPLIT BODY */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-black/5">
        
        {/* LEFT COLUMN: REQUESTS (Top Left) & SHOUTOUTS (Bottom Left) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden border-r h-full" style={{ borderColor: colors.accent + '11' }}>
          
          {/* TOP LEFT: REQUESTS SECTION */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 opacity-80 flex items-center justify-between">
              <span>Audience Requests Queue</span>
              <span className="text-xs font-normal normal-case opacity-60">Sorted by tips then request count</span>
            </h3>

            {payTier === 'free' && (
              <div className="p-3 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                ⚠️ <strong>Audience Request functionality is disabled in the Free Demo.</strong> The table below displays simulated requests to let you preview how tips, queue management, and browser searches function on stage!
              </div>
            )}

            {payTier === 'one-time' && (
              <div className="p-3 mb-3 rounded-xl bg-blue-500/15 border border-blue-500/20 text-xs text-blue-300">
                ℹ️ <strong>Requests require a subscription.</strong> One-Time purchases only support local files and stage sync. Subscribing unlocks the full audience request system.
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {sortedRequests.map(req => {
                const isPlayed = req.played;
                const isCustom = req.isCustom;
                
                return (
                  <div
                    key={req.id}
                    onClick={() => handleRequestClick(req)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isPlayed ? 'opacity-35 select-none hover:opacity-50' : 'bg-black/20 hover:bg-white/5 hover:-translate-y-0.5'
                    }`}
                    style={{ borderColor: isPlayed ? 'transparent' : isCustom ? colors.primary + '33' : colors.accent + '11' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`font-bold text-sm truncate ${isPlayed ? 'line-through' : ''}`}>
                          {req.title}
                        </h4>
                        
                        {isCustom && (
                          <span 
                            className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase tracking-wider"
                            title="Not in performer catalog. Tapping opens internet chord search!"
                          >
                            Web Chords
                          </span>
                        )}

                        {req.tipAmount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center border border-emerald-500/30">
                            <DollarSign className="w-3 h-3 shrink-0" />
                            {req.tipAmount}
                          </span>
                        )}

                        {req.requestCount > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-white font-bold">
                            {req.requestCount}x Req
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-75 truncate">{req.artist}</p>
                      <p className="text-[10px] opacity-50 mt-1 truncate">By: {req.requesterName}</p>
                    </div>

                    {/* Request row action triggers */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Add to setlist button */}
                      {!isPlayed && (
                        <button
                          onClick={() => onAddRequestToSetlist(req.title, req.artist)}
                          className="p-1.5 rounded-lg border text-[10px] font-bold transition-transform hover:scale-105"
                          style={{ borderColor: colors.primary + '44', color: colors.primary }}
                          title="Add song to setlist"
                        >
                          + Setlist
                        </button>
                      )}

                      {/* Played toggle / delete */}
                      <button
                        onClick={() => onMarkRequestPlayed(req.id, !isPlayed)}
                        className={`p-1.5 rounded-lg border transition-all text-xs font-bold hover:scale-105`}
                        style={{ 
                          borderColor: isPlayed ? colors.accent + '44' : colors.accent + '22',
                          color: isPlayed ? colors.mutedText : colors.accent 
                        }}
                        title={isPlayed ? "Mark as Unplayed" : "Mark as Played"}
                      >
                        {isPlayed ? 'Re-queue' : 'Played'}
                      </button>

                      <button
                        onClick={() => onDeleteRequest(req.id)}
                        className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete request"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {sortedRequests.length === 0 && (
                <div className="py-16 text-center opacity-60 text-sm">
                  <Music className="w-10 h-10 mx-auto opacity-20 mb-2 animate-bounce" />
                  Request queue is currently empty.
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM LEFT: SHOUTOUT SONG SEARCH SECTION */}
          <div 
            className="p-4 border-t shrink-0 bg-black/10 flex flex-col gap-2.5"
            style={{ borderColor: colors.accent + '11' }}
          >
            <div className="flex items-center justify-between">
              <h4 
                className="text-xs font-black uppercase tracking-wider opacity-75 cursor-pointer hover:text-[var(--primary-color)] flex items-center gap-1 select-none"
                style={{ color: colors.primary }}
                onClick={() => setShowCatalogOverlay(true)}
              >
                <BookOpen className="w-4 h-4" />
                Catalog Lookup Panel ↗
              </h4>
              <span className="text-[10px] opacity-50">Click header for full catalog</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="Shoutout search... (type title or artist)"
                value={shoutoutQuery}
                onChange={(e) => setShoutoutQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-transparent text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
                style={{ borderColor: colors.accent + '33' }}
              />
            </div>

            {/* Space for one result */}
            <div className="h-14">
              {topShoutoutResult ? (
                <div 
                  onClick={() => onSongSelected(topShoutoutResult)}
                  className="p-2 rounded-lg border bg-black/25 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderColor: colors.accent + '22' }}
                  id="dashboard-shoutout-result"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs truncate">{topShoutoutResult.title}</h5>
                    <p className="text-[10px] opacity-75 truncate">{topShoutoutResult.artist}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateActiveSetlist([...activeSetlist, topShoutoutResult.id]);
                      setShoutoutQuery('');
                    }}
                    className="px-2.5 py-1 rounded bg-[var(--primary-color)] text-[10px] font-extrabold text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    style={{ backgroundColor: colors.primary }}
                  >
                    + Setlist
                  </button>
                </div>
              ) : shoutoutQuery ? (
                <div className="text-center py-3 text-xs opacity-50 italic">
                  No matching songs found in your catalog.
                </div>
              ) : (
                <div className="text-[10px] text-center opacity-45 py-3">
                  Search catalog above to quickly load shoutouts onto the screen.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SETLIST MANAGEMENT (Full Height) */}
        <div className="lg:col-span-5 p-4 flex flex-col overflow-hidden h-full">
          <h3 className="text-sm font-black uppercase tracking-wider mb-2 opacity-80 flex items-center justify-between">
            <span>Gig Setlist Builder</span>
            <span className="text-xs font-bold text-emerald-400">{activeSetlistSongs.length} songs</span>
          </h3>

          {/* Top setlist builder controls */}
          <div className="space-y-2 mb-3 bg-black/15 p-3 rounded-xl border border-white/5 shrink-0">
            {/* Setlist Loader */}
            <div>
              <label className="block text-[9px] font-bold uppercase opacity-65 mb-1">Load Saved Setlist</label>
              <div className="flex gap-2">
                <select
                  value={selectedSetlistId}
                  onChange={(e) => handleLoadSetlist(e.target.value)}
                  className="flex-1 bg-slate-800 text-xs border rounded-lg p-1.5 focus:outline-none cursor-pointer text-white"
                  style={{ borderColor: colors.accent + '22' }}
                >
                  <option value="">-- Choose Setlist --</option>
                  {setlists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
                {selectedSetlistId && (
                  <button
                    onClick={handleDeleteSavedSetlist}
                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    title="Delete saved setlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Setlist Generator buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleLoadRandomSetlist}
                className="py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-white/5 cursor-pointer"
                style={{ borderColor: colors.accent + '22' }}
                title="Generates 15 random unplayed songs onto the setlist"
              >
                <Shuffle className="w-3 h-3 text-[var(--primary-color)]" style={{ color: colors.primary }} />
                15 Random Songs
              </button>
              <button
                onClick={handleShuffleSetlist}
                className="py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-white/5 cursor-pointer"
                style={{ borderColor: colors.accent + '22' }}
                title="Shuffles the order of the currently displayed list"
              >
                <Shuffle className="w-3 h-3 text-[var(--accent-color)]" style={{ color: colors.accent }} />
                Shuffle Order
              </button>
            </div>
          </div>

          {/* SETLIST SONGS LISTING */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {activeSetlistSongs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="p-2 bg-black/20 rounded-lg border flex items-center justify-between gap-2 group transition-all"
                style={{ borderColor: colors.accent + '05' }}
              >
                {/* Index & Title Info */}
                <div 
                  onClick={() => onSongSelected(song)}
                  className="min-w-0 flex-1 cursor-pointer flex items-center gap-2"
                >
                  <span className="text-[10px] font-mono opacity-50 w-4">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-xs truncate group-hover:underline">{song.title}</h5>
                    <p className="text-[9px] opacity-75 truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Move order up/down & remove */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => moveSetlistItem(index, 'up')}
                    className="p-1 rounded text-white disabled:opacity-20 hover:bg-white/5 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === activeSetlistSongs.length - 1}
                    onClick={() => moveSetlistItem(index, 'down')}
                    className="p-1 rounded text-white disabled:opacity-20 hover:bg-white/5 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveFromSetlist(index)}
                    className="p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                    title="Remove from setlist"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {activeSetlistSongs.length === 0 && (
              <div className="text-center py-16 text-xs opacity-50 italic">
                Setlist is currently empty. Add songs from your Master Catalog, search shoutouts, or generate random songs above to get started!
              </div>
            )}
          </div>

          {/* BOTTOM SETLIST ACTIONS */}
          <div 
            className="pt-3 border-t mt-3 flex flex-col gap-2 shrink-0"
            style={{ borderColor: colors.accent + '11' }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Save setlist name..."
                value={saveSetlistName}
                onChange={(e) => setSaveSetlistName(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs rounded-lg border focus:outline-none"
                style={{ borderColor: colors.accent + '22' }}
              />
              <button
                onClick={handleSaveActiveSetlist}
                className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer text-white hover:scale-103"
                style={{ backgroundColor: colors.accent }}
              >
                <Save className="w-3.5 h-3.5" />
                Save Setlist
              </button>
            </div>
            
            <button
              onClick={() => onUpdateActiveSetlist([])}
              className="py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all cursor-pointer"
            >
              Clear Active Setlist
            </button>
          </div>
        </div>
      </div>

      {/* C. FULL CATALOG SCROLLING OVERLAY POPUP */}
      {showCatalogOverlay && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div 
            className="w-full max-w-2xl h-[80vh] rounded-2xl border flex flex-col p-6 shadow-2xl"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '33' }}
            id="dashboard-catalog-overlay"
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: colors.accent + '11' }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: colors.primary }}>Complete Performer Catalog</h3>
                <p className="text-xs opacity-65">Alphabetical listing of your {songs.length} songs</p>
              </div>
              <button
                onClick={() => setShowCatalogOverlay(false)}
                className="p-2 rounded-lg border hover:bg-white/5"
                style={{ borderColor: colors.accent + '22' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable listing */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {[...songs].sort((a,b) => a.title.localeCompare(b.title)).map(song => (
                <div
                  key={song.id}
                  onClick={() => {
                    onSongSelected(song);
                    setShowCatalogOverlay(false);
                  }}
                  className="p-3 bg-black/20 rounded-xl border flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderColor: colors.accent + '11' }}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate">{song.title}</h4>
                    <p className="text-xs opacity-75 truncate">{song.artist}</p>
                    <span className="text-[10px] opacity-60 px-1.5 py-0.5 rounded border border-white/5 inline-block mt-1">
                      {song.genre} (Key: {song.originalKey})
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateActiveSetlist([...activeSetlist, song.id]);
                      alert(`Added "${song.title}" to active setlist`);
                    }}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105"
                    style={{ borderColor: colors.accent + '44', color: colors.accent }}
                  >
                    + Setlist
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
