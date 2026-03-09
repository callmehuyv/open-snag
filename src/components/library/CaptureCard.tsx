import { CaptureRecord } from '../../lib/tauri-api';
import { formatFileSize, formatRelativeDate, truncateFilename } from '../../lib/format';
import {
  Image,
  Video,
  Trash2,
  Edit,
  Check,
} from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface CaptureCardProps {
  capture: CaptureRecord;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onOpen: (capture: CaptureRecord) => void;
  onDelete: (id: string) => void;
  viewMode: 'grid' | 'list';
}

function TypeBadge({ type }: { type: string }) {
  const isRecording = type === 'recording';
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
        isRecording
          ? 'bg-red-500/20 text-red-400'
          : 'bg-blue-500/20 text-blue-400'
      }`}
    >
      {isRecording ? <Video size={10} /> : <Image size={10} />}
      {isRecording ? 'Recording' : 'Screenshot'}
    </span>
  );
}

function Thumbnail({ capture }: { capture: CaptureRecord }) {
  if (capture.thumbnail_path) {
    return (
      <img
        src={convertFileSrc(capture.thumbnail_path)}
        alt={capture.filename}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
      {capture.capture_type === 'recording' ? (
        <Video size={32} className="text-zinc-600" />
      ) : (
        <Image size={32} className="text-zinc-600" />
      )}
    </div>
  );
}

export default function CaptureCard({
  capture,
  isSelected,
  onSelect,
  onOpen,
  onDelete,
  viewMode,
}: CaptureCardProps) {
  if (viewMode === 'list') {
    return (
      <div
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
          isSelected
            ? 'bg-blue-600/20 border border-blue-500/40'
            : 'hover:bg-zinc-800 border border-transparent'
        }`}
        onClick={(e) => onSelect(capture.id, e.shiftKey)}
        onDoubleClick={() => onOpen(capture)}
      >
        {/* Selection checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(capture.id, e.shiftKey);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'border-zinc-600 hover:border-zinc-400'
          }`}
        >
          {isSelected && <Check size={12} />}
        </button>

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-zinc-800">
          <Thumbnail capture={capture} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 truncate">{capture.filename}</p>
        </div>

        <TypeBadge type={capture.capture_type} />

        <span className="text-xs text-zinc-500 w-24 text-right">
          {capture.width}x{capture.height}
        </span>

        <span className="text-xs text-zinc-500 w-16 text-right">
          {formatFileSize(capture.file_size)}
        </span>

        <span className="text-xs text-zinc-500 w-28 text-right">
          {formatRelativeDate(capture.created_at)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(capture);
            }}
            className="p-1.5 rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
            title="Open in editor"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(capture.id);
            }}
            className="p-1.5 rounded text-zinc-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div
      className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-zinc-700 hover:border-zinc-500'
      }`}
      onClick={(e) => onSelect(capture.id, e.shiftKey)}
      onDoubleClick={() => onOpen(capture)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-800 overflow-hidden">
        <Thumbnail capture={capture} />
      </div>

      {/* Selection checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(capture.id, e.shiftKey);
        }}
        className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-blue-600 border-blue-500 text-white opacity-100'
            : 'border-zinc-400 bg-zinc-900/60 opacity-0 group-hover:opacity-100'
        }`}
      >
        {isSelected && <Check size={12} />}
      </button>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(capture);
          }}
          className="p-1.5 rounded bg-zinc-900/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          title="Open in editor"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(capture.id);
          }}
          className="p-1.5 rounded bg-zinc-900/80 text-zinc-300 hover:bg-red-600/80 hover:text-white transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Info overlay */}
      <div className="p-2.5 bg-zinc-850">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm text-zinc-200 truncate flex-1">
            {truncateFilename(capture.filename, 28)}
          </p>
          <TypeBadge type={capture.capture_type} />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{formatRelativeDate(capture.created_at)}</span>
          <span>{formatFileSize(capture.file_size)}</span>
        </div>
      </div>
    </div>
  );
}
