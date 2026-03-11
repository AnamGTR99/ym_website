"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UploadFieldProps {
  label: string;
  accept: string;
  maxSizeMB: number;
  uploadUrl: string;
  trackId: string;
  currentValue?: string | null;
  onUploaded: (result: string) => void;
}

export default function UploadField({
  label,
  accept,
  maxSizeMB,
  uploadUrl,
  trackId,
  currentValue,
  onUploaded,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      // Client-side size check
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB.`
        );
        return;
      }

      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("trackId", trackId);

      try {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        const result = await new Promise<string>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(data.url ?? data.path);
              } else {
                reject(new Error(data.error ?? "Upload failed"));
              }
            } catch {
              reject(new Error(`Server error (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));

          xhr.open("POST", uploadUrl);
          xhr.send(formData);
        });

        xhrRef.current = null;
        onUploaded(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed"
        );
      } finally {
        setUploading(false);
      }
    },
    [maxSizeMB, trackId, uploadUrl, onUploaded]
  );

  // Abort in-flight XHR on unmount
  useEffect(() => {
    return () => {
      if (xhrRef.current) xhrRef.current.abort();
    };
  }, []);

  const handleFile = (file: File | undefined) => {
    if (file) upload(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [upload]
  );

  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-white bg-zinc-800/50"
            : "border-zinc-700 hover:border-zinc-500"
        }`}
      >
        {uploading ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Uploading... {progress}%</p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-zinc-400">
              Drop file here or click to browse
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {accept} &middot; Max {maxSizeMB}MB
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Current file indicator */}
      {currentValue && !uploading && (
        <p className="text-xs text-zinc-500 mt-1 truncate">
          Current: {currentValue}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
