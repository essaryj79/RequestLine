const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function getNoteAndModifier(chordPart: string): { root: string; remainder: string } {
  if (chordPart.length === 0) return { root: '', remainder: '' };
  
  // Root can be 2 chars if it has # or b
  let root = chordPart[0];
  let remainder = chordPart.substring(1);
  
  if (chordPart.length > 1 && (chordPart[1] === '#' || chordPart[1] === 'b')) {
    root = chordPart.substring(0, 2);
    remainder = chordPart.substring(2);
  }
  
  return { root, remainder };
}

function transposeNote(note: string, semitones: number): string {
  if (!note) return '';
  
  // Clean note root
  let index = SHARPS.indexOf(note);
  let isFlat = false;
  
  if (index === -1) {
    index = FLATS.indexOf(note);
    if (index !== -1) {
      isFlat = true;
    }
  }
  
  if (index === -1) return note; // Return as is if not found
  
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return isFlat ? FLATS[newIndex] : SHARPS[newIndex];
}

export function transposeSingleChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  
  // Handle slash chords, e.g. C/G or D/F#
  if (chord.includes('/')) {
    const parts = chord.split('/');
    return parts.map(part => transposeSingleChord(part, semitones)).join('/');
  }
  
  const { root, remainder } = getNoteAndModifier(chord);
  if (!root) return chord;
  
  const transposedRoot = transposeNote(root, semitones);
  return transposedRoot + remainder;
}

export function transposeChordPro(content: string, semitones: number): string {
  if (semitones === 0) return content;
  
  // ChordPro format uses [G] to specify chords. Let's find matches and transpose.
  return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
    try {
      const transposed = transposeSingleChord(chord, semitones);
      return `[${transposed}]`;
    } catch {
      return match;
    }
  });
}

// Simple ChordPro parser to extract song metadata and format lyrics
export interface ParsedChordProLine {
  type: 'directive' | 'comment' | 'lyric';
  originalText: string;
  directiveName?: string;
  directiveValue?: string;
  segments?: { chord?: string; text: string }[];
}

export function parseChordPro(content: string): ParsedChordProLine[] {
  const lines = content.split('\n');
  const parsedLines: ParsedChordProLine[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Directives like {title: Ace In The Hole}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const content = trimmed.substring(1, trimmed.length - 1);
      const colonIndex = content.indexOf(':');
      if (colonIndex !== -1) {
        const name = content.substring(0, colonIndex).trim().toLowerCase();
        const val = content.substring(colonIndex + 1).trim();
        parsedLines.push({
          type: 'directive',
          originalText: line,
          directiveName: name,
          directiveValue: val
        });
      } else {
        parsedLines.push({
          type: 'directive',
          originalText: line,
          directiveName: content.trim().toLowerCase(),
          directiveValue: ''
        });
      }
      continue;
    }
    
    // Comments
    if (trimmed.startsWith('#')) {
      parsedLines.push({
        type: 'comment',
        originalText: line
      });
      continue;
    }
    
    // Lyrics line with inline chords [C]Hello [G]world
    // Segment the line into chords and texts
    const segments: { chord?: string; text: string }[] = [];
    let currentChord = '';
    let currentText = '';
    let inChord = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '[') {
        if (currentChord || currentText) {
          segments.push({ chord: currentChord || undefined, text: currentText });
          currentChord = '';
          currentText = '';
        }
        inChord = true;
      } else if (char === ']') {
        inChord = false;
      } else {
        if (inChord) {
          currentChord += char;
        } else {
          currentText += char;
        }
      }
    }
    
    if (currentChord || currentText) {
      segments.push({ chord: currentChord || undefined, text: currentText });
    }
    
    parsedLines.push({
      type: 'lyric',
      originalText: line,
      segments: segments.length > 0 ? segments : [{ text: line }]
    });
  }
  
  return parsedLines;
}
