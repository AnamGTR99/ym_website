/**
 * Server-side MIME validation via magic bytes.
 * Client-supplied file.type is trivially spoofable — verify actual content.
 */

const SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  // Audio
  { mime: "audio/mpeg", bytes: [0xff, 0xfb] }, // MP3 frame sync
  { mime: "audio/mpeg", bytes: [0xff, 0xf3] }, // MP3 frame sync (alt)
  { mime: "audio/mpeg", bytes: [0xff, 0xf2] }, // MP3 frame sync (alt)
  { mime: "audio/mpeg", bytes: [0x49, 0x44, 0x33] }, // ID3 tag header
  { mime: "audio/wav", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  { mime: "audio/aac", bytes: [0xff, 0xf1] }, // AAC ADTS
  { mime: "audio/aac", bytes: [0xff, 0xf9] }, // AAC ADTS (alt)
  { mime: "audio/mp4", bytes: [0x00, 0x00, 0x00] }, // ftyp box (offset checked below)

  // Images
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (+ WEBP at offset 8)
];

export async function detectMimeType(
  file: File
): Promise<string | null> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 3) return null;

  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      // Disambiguate RIFF: WAV vs WEBP
      if (sig.mime === "audio/wav" || sig.mime === "image/webp") {
        if (bytes.length >= 12) {
          const subtype = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
          if (subtype === "WAVE") return "audio/wav";
          if (subtype === "WEBP") return "image/webp";
        }
        continue;
      }
      return sig.mime;
    }
  }

  return null;
}

const AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/mp4",
]);

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isValidAudioMime(mime: string | null): boolean {
  return mime !== null && AUDIO_MIMES.has(mime);
}

export function isValidImageMime(mime: string | null): boolean {
  return mime !== null && IMAGE_MIMES.has(mime);
}
