import React, { useState } from 'react';
import { Song, ThemeColors, PayTier } from '../types';
import { Plus, Trash, Edit2, Upload, FileText, Check, Music, BookOpen, AlertCircle } from 'lucide-react';

interface FileMaintenanceProps {
  songs: Song[];
  payTier: PayTier;
  colors: ThemeColors;
  onAddSong: (song: Omit<Song, 'plays'>) => Promise<any>;
  onEditSong: (song: Song) => Promise<any>;
  onDeleteSong: (id: string) => Promise<any>;
  onAddToSetlist: (songId: string) => void;
}

export default function FileMaintenance({
  songs,
  payTier,
  colors,
  onAddSong,
  onEditSong,
  onDeleteSong,
  onAddToSetlist
}: FileMaintenanceProps) {
  // Sorting master list alphabetically by title
  const sortedSongs = [...songs].sort((a, b) => a.title.localeCompare(b.title));

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isBulkImport, setIsBulkImport] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [originalKey, setOriginalKey] = useState('C');
  const [format, setFormat] = useState<'chordpro' | 'text'>('chordpro');
  const [content, setContent] = useState('');

  // Bulk Import state
  const [bulkText, setBulkText] = useState('');
  const [bulkFormat, setBulkFormat] = useState<'chordpro' | 'text'>('chordpro');
  const [bulkMessage, setBulkMessage] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setGenre('');
    setOriginalKey('C');
    setFormat('chordpro');
    setContent('');
    setEditingSong(null);
    setIsCreatingNew(false);
    setIsBulkImport(false);
    setErrorMsg('');
  };

  const startEdit = (song: Song) => {
    setEditingSong(song);
    setTitle(song.title);
    setArtist(song.artist);
    setGenre(song.genre);
    setOriginalKey(song.originalKey);
    setFormat(song.format);
    setContent(song.content);
    setIsCreatingNew(false);
    setIsBulkImport(false);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title is required');
      return;
    }

    if (isCreatingNew && payTier === 'free' && songs.length >= 10) {
      alert('Free Tier Limit: You have reached the maximum of 10 songs. Please subscribe to import/create more songs.');
      return;
    }

    const songData = {
      title: title.trim(),
      artist: artist.trim() || 'Unknown Artist',
      genre: genre.trim() || 'Uncategorized',
      originalKey: originalKey.trim() || 'C',
      format,
      content: content.trim()
    };

    try {
      if (editingSong) {
        await onEditSong({
          ...editingSong,
          ...songData
        });
      } else {
        await onAddSong({
          id: Math.random().toString(36).substring(2, 9),
          ...songData
        });
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving song');
    }
  };

  const handleDelete = async (songId: string) => {
    if (payTier === 'free') {
      alert('Free Tier Restriction: Deleting songs is disabled on the free version. Please upgrade to manage your music catalog freely.');
      return;
    }

    if (confirm('Are you sure you want to delete this song from your catalog?')) {
      try {
        await onDeleteSong(songId);
        if (editingSong?.id === songId) {
          resetForm();
        }
      } catch (err: any) {
        alert(err.message || 'Error deleting song');
      }
    }
  };

  // Bulk import processor
  // Bulk import format expects songs separated by double dashes "---" or clear headers
  const handleBulkImport = async () => {
    if (payTier === 'free' && songs.length >= 10) {
      alert('Free Tier Limit: You have reached the maximum of 10 songs. Please subscribe to bulk import songs.');
      return;
    }

    if (!bulkText.trim()) {
      setBulkMessage('Please paste ChordPro or text content to import');
      return;
    }

    // Split songs by special delimiter '---' or search for `{title:` headers
    const chunks = bulkText.split(/\n---\n|\n===\n/);
    const parsedSongs: Omit<Song, 'plays'>[] = [];

    for (let chunk of chunks) {
      const trimmedChunk = chunk.trim();
      if (!trimmedChunk) continue;

      // Extract title/artist from directives if ChordPro
      let songTitle = '';
      let songArtist = '';
      let songKey = 'C';
      let songGenre = 'Uncategorized';

      if (bulkFormat === 'chordpro') {
        const titleMatch = trimmedChunk.match(/\{title:\s*([^\}]+)\}/i);
        const artistMatch = trimmedChunk.match(/\{artist:\s*([^\}]+)\}/i);
        const keyMatch = trimmedChunk.match(/\{key:\s*([^\}]+)\}/i);
        const genreMatch = trimmedChunk.match(/\{genre:\s*([^\}]+)\}/i);

        if (titleMatch) songTitle = titleMatch[1].trim();
        if (artistMatch) songArtist = artistMatch[1].trim();
        if (keyMatch) songKey = keyMatch[1].trim();
        if (genreMatch) songGenre = genreMatch[1].trim();
      }

      // Fallback if not specified in directive or plain text
      if (!songTitle) {
        const firstLine = trimmedChunk.split('\n')[0].replace(/[{}]/g, '');
        if (firstLine.includes('-')) {
          const parts = firstLine.split('-');
          songArtist = parts[0].trim();
          songTitle = parts[1].trim();
        } else {
          songTitle = firstLine.trim();
        }
      }

      parsedSongs.push({
        id: Math.random().toString(36).substring(2, 9),
        title: songTitle || 'Untitled Import',
        artist: songArtist || 'Unknown Artist',
        genre: songGenre,
        originalKey: songKey,
        format: bulkFormat,
        content: trimmedChunk
      });
    }

    // Limit to 10 if on free tier
    let importList = parsedSongs;
    if (payTier === 'free') {
      const availableSlots = Math.max(0, 10 - songs.length);
      importList = parsedSongs.slice(0, availableSlots);
      if (parsedSongs.length > availableSlots) {
        alert(`Free Tier Limit: Capped at 10 songs. Only imported ${availableSlots} songs.`);
      }
    }

    // Process additions
    for (let s of importList) {
      await onAddSong(s);
    }

    setBulkMessage(`Successfully imported ${importList.length} songs!`);
    setBulkText('');
    setTimeout(() => {
      setBulkMessage('');
      setIsBulkImport(false);
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto" id="file-maintenance-view">
      {/* LEFT: MASTER SONG LIST (Alphabetical) */}
      <div 
        className="md:col-span-5 p-5 rounded-2xl border flex flex-col h-[75vh]"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '11', color: colors.text }}
      >
        <div className="flex items-center justify-between mb-4 border-b pb-3 border-white/5">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--primary-color)]" style={{ color: colors.primary }} />
              Master Song Catalog
            </h3>
            <p className="text-xs opacity-65 mt-0.5">{songs.length} total songs</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsCreatingNew(true);
            }}
            className="p-2 rounded-xl text-white transition-all hover:scale-105"
            style={{ backgroundColor: colors.primary }}
            title="Create New Song"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {payTier === 'free' && (
          <div className="p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-1.5 leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Free Version Limit:</strong> Up to 10 songs max. Deletions disabled. Experiencing performer dashboard is fully unlocked!
            </span>
          </div>
        )}

        {/* Search bar inside list */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 scrollbar-thin">
          {sortedSongs.map(song => (
            <div
              key={song.id}
              onClick={() => startEdit(song)}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                editingSong?.id === song.id ? 'bg-white/10' : 'bg-black/15 hover:bg-white/5'
              }`}
              style={{ borderColor: editingSong?.id === song.id ? colors.primary : colors.accent + '11' }}
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm truncate">{song.title}</h4>
                <p className="text-xs opacity-75 truncate">{song.artist}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] opacity-60">
                  <span className="px-1.5 py-0.5 rounded border border-white/10">{song.genre}</span>
                  <span className="px-1.5 py-0.5 rounded border border-white/10">Key: {song.originalKey}</span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onAddToSetlist(song.id)}
                  className="p-1.5 rounded-lg border text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  style={{ borderColor: colors.accent + '44', color: colors.accent }}
                  title="Add to Active Setlist"
                >
                  + Setlist
                </button>
                <button
                  onClick={() => handleDelete(song.id)}
                  disabled={payTier === 'free'}
                  className={`p-1.5 rounded-lg border transition-all hover:scale-105 cursor-pointer ${
                    payTier === 'free' ? 'opacity-30 cursor-not-allowed' : 'text-red-400 hover:bg-red-500/10'
                  }`}
                  style={{ borderColor: payTier === 'free' ? 'transparent' : '#f8717144' }}
                  title="Delete Song"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {songs.length === 0 && (
            <div className="text-center py-12 opacity-60 text-sm">
              <Music className="w-10 h-10 mx-auto opacity-30 mb-2" />
              Your catalog is currently empty.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: EDIT / IMPORT / CREATE PANEL */}
      <div 
        className="md:col-span-7 p-6 rounded-2xl border flex flex-col h-[75vh]"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.accent + '11', color: colors.text }}
      >
        <div className="flex gap-4 border-b pb-4 mb-4 border-white/5 justify-between items-center">
          <h3 className="text-xl font-bold">
            {isBulkImport ? 'Bulk Import Songs' : isCreatingNew ? 'Create New Song' : editingSong ? `Editing: ${editingSong.title}` : 'Select a Song to Edit'}
          </h3>

          <div className="flex gap-2">
            {!isBulkImport && (
              <button
                onClick={() => {
                  resetForm();
                  setIsBulkImport(true);
                }}
                className="px-3.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 hover:bg-white/5 cursor-pointer"
                style={{ borderColor: colors.accent + '33', color: colors.accent }}
              >
                <Upload className="w-3.5 h-3.5" />
                Bulk Import
              </button>
            )}
            {isBulkImport && (
              <button
                onClick={resetForm}
                className="px-3.5 py-1.5 rounded-lg border text-xs font-bold hover:bg-white/5 cursor-pointer"
                style={{ borderColor: colors.accent + '33' }}
              >
                Back to Edit
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {isBulkImport ? (
            /* Bulk Import Interface */
            <div className="space-y-4">
              {bulkMessage && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex items-center gap-1.5 font-semibold">
                  <Check className="w-4 h-4" />
                  {bulkMessage}
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setBulkFormat('chordpro')}
                  className="flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: bulkFormat === 'chordpro' ? colors.primary : 'transparent',
                    color: bulkFormat === 'chordpro' ? '#ffffff' : colors.text,
                    borderColor: bulkFormat === 'chordpro' ? colors.primary : colors.accent + '22'
                  }}
                >
                  ChordPro Format (.pro)
                </button>
                <button
                  onClick={() => setBulkFormat('text')}
                  className="flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer"
                  style={{
                    backgroundColor: bulkFormat === 'text' ? colors.primary : 'transparent',
                    color: bulkFormat === 'text' ? '#ffffff' : colors.text,
                    borderColor: bulkFormat === 'text' ? colors.primary : colors.accent + '22'
                  }}
                >
                  Plain Text / Lyrics (.txt)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold opacity-75 mb-1.5 uppercase">Paste Songs separated by triple dashes "---"</label>
                <textarea
                  rows={10}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={
                    bulkFormat === 'chordpro'
                      ? `{title: Ace In The Hole}\n{artist: George Strait}\n[G]You've got to have an [C]ace...\n\n---\n\n{title: Hotel California}\n{artist: Eagles}\n[Bm]On a dark desert highway...`
                      : `George Strait - Ace In The Hole\nYou've got to have an ace...\n\n---\n\nEagles - Hotel California\nOn a dark desert highway...`
                  }
                  className="w-full p-4 bg-black/25 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1"
                  style={{ borderColor: colors.accent + '22' }}
                />
              </div>

              <button
                onClick={handleBulkImport}
                className="w-full py-3 rounded-xl font-bold bg-[var(--accent-color)] text-white transition-all hover:brightness-110 cursor-pointer shadow-lg"
                style={{ backgroundColor: colors.accent }}
              >
                Parse & Import Songs
              </button>
            </div>
          ) : isCreatingNew || editingSong ? (
            /* Single Song Creation / Editing Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-1">Song Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Wonderwall"
                    className="w-full px-4 py-2 bg-black/20 border rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: colors.accent + '22' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-1">Artist</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. Oasis"
                    className="w-full px-4 py-2 bg-black/20 border rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: colors.accent + '22' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-1">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Rock, Country"
                    className="w-full px-4 py-2 bg-black/20 border rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: colors.accent + '22' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-1">Original Key</label>
                  <input
                    type="text"
                    value={originalKey}
                    onChange={(e) => setOriginalKey(e.target.value)}
                    placeholder="e.g. G, Bm, F#"
                    className="w-full px-4 py-2 bg-black/20 border rounded-lg text-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: colors.accent + '22' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold opacity-75 uppercase mb-1">File Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as 'chordpro' | 'text')}
                    className="w-full px-3 py-2 bg-black/20 border rounded-lg text-sm focus:outline-none cursor-pointer text-white"
                    style={{ borderColor: colors.accent + '22' }}
                  >
                    <option value="chordpro" className="bg-slate-800">ChordPro [C]</option>
                    <option value="text" className="bg-slate-800">Plain Text / Chords</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold opacity-75 uppercase">Lyrics and Chords Chart</label>
                  <span className="text-[10px] opacity-60">
                    {format === 'chordpro' ? 'Use [G] bracket tags for chords inline' : 'Chords on lines above the lyrics'}
                  </span>
                </div>
                <textarea
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    format === 'chordpro'
                      ? '[G]Almost heaven, [F#m]West Virginia\n[E]Blue Ridge Mountains...'
                      : 'G             F#m\nAlmost heaven, West Virginia\nE\nBlue Ridge Mountains...'
                  }
                  className="w-full p-4 bg-black/25 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 leading-relaxed"
                  style={{ borderColor: colors.accent + '22' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: colors.accent + '44' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110 cursor-pointer shadow-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  Save Song
                </button>
              </div>
            </form>
          ) : (
            /* Idle screen */
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-65 flex-1">
              <FileText className="w-16 h-16 opacity-25 mb-4" />
              <h4 className="font-bold text-lg mb-1">No Song Selected</h4>
              <p className="text-xs max-w-sm">
                Select any song from the master catalog on the left to edit its lyrics/chords or add it to the active setlist. Tap the "+" button above to create a new song or bulk import.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
