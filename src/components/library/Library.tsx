import { useState, useCallback, useRef } from 'react';
import { useCaptureStore } from '../../stores/captureStore';
import { useLibrary } from '../../hooks/useLibrary';
import { CaptureRecord } from '../../lib/tauri-api';
import CaptureCard from './CaptureCard';
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  Camera,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  X,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

export default function Library() {
  const { setCurrentView, setCurrentCapture } = useCaptureStore();
  const {
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    deleteCapture,
    deleteMultiple,
    filteredCaptures,
  } = useLibrary();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedRef = useRef<string | null>(null);

  const handleSelect = useCallback(
    (id: string, shiftKey: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (shiftKey && lastSelectedRef.current) {
          // Range select
          const ids = filteredCaptures.map((c) => c.id);
          const startIdx = ids.indexOf(lastSelectedRef.current);
          const endIdx = ids.indexOf(id);
          if (startIdx !== -1 && endIdx !== -1) {
            const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
            for (let i = lo; i <= hi; i++) {
              next.add(ids[i]);
            }
          }
        } else {
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }

        lastSelectedRef.current = id;
        return next;
      });
    },
    [filteredCaptures]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredCaptures.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCaptures.map((c) => c.id)));
    }
  }, [filteredCaptures, selectedIds.size]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await deleteMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, deleteMultiple]);

  const handleOpen = useCallback(
    (_capture: CaptureRecord) => {
      // Load the capture's file as an image into the editor
      // For now, we read the filepath via convertFileSrc but the editor expects base64.
      // We set a placeholder; the editor can be extended to handle file paths.
      setCurrentCapture(null);
      setCurrentView('editor');
    },
    [setCurrentCapture, setCurrentView]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteCapture(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [deleteCapture]
  );

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-lg font-semibold">Library</h1>

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-zinc-700/50 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search captures..."
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'screenshot' | 'recording')}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">All types</option>
              <option value="screenshot">Screenshots</option>
              <option value="recording">Recordings</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-zinc-700 border border-zinc-600 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`p-1.5 rounded-lg border border-zinc-600 bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors ${
              sortOrder === 'asc' ? 'rotate-180' : ''
            }`}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown size={14} />
          </button>

          {/* Selection actions */}
          {hasSelection && (
            <>
              <div className="w-px h-6 bg-zinc-600 mx-1" />
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                {selectedIds.size === filteredCaptures.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs text-zinc-500">{selectedIds.size} selected</span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-medium transition-colors"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        ) : filteredCaptures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Camera size={48} className="text-zinc-600 mb-4" />
            {searchQuery || filterType !== 'all' ? (
              <>
                <p className="text-lg font-medium text-zinc-400 mb-1">No matches found</p>
                <p className="text-sm text-zinc-500">
                  Try adjusting your search or filters.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-zinc-400 mb-1">No captures yet</p>
                <p className="text-sm text-zinc-500">
                  Take a screenshot to get started!
                </p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCaptures.map((capture) => (
              <CaptureCard
                key={capture.id}
                capture={capture}
                isSelected={selectedIds.has(capture.id)}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onDelete={handleDelete}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* List header */}
            <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-zinc-500 font-medium border-b border-zinc-700/50">
              <div className="w-5" />
              <div className="w-16">Thumb</div>
              <div className="flex-1">Filename</div>
              <div className="w-20">Type</div>
              <div className="w-24 text-right">Dimensions</div>
              <div className="w-16 text-right">Size</div>
              <div className="w-28 text-right">Date</div>
              <div className="w-16" />
            </div>
            {filteredCaptures.map((capture) => (
              <CaptureCard
                key={capture.id}
                capture={capture}
                isSelected={selectedIds.has(capture.id)}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onDelete={handleDelete}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
