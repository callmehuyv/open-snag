import { useState, useEffect, useCallback, useMemo } from 'react';
import { CaptureRecord, getCaptures, deleteCapture as apiDeleteCapture } from '../lib/tauri-api';

type FilterType = 'all' | 'screenshot' | 'recording';
type SortBy = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

export function useLibrary() {
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const loadCaptures = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCaptures();
      setCaptures(result);
    } catch (error) {
      console.error('Failed to load captures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCaptureFn = useCallback(async (id: string) => {
    try {
      await apiDeleteCapture(id);
      await loadCaptures();
    } catch (error) {
      console.error('Failed to delete capture:', error);
    }
  }, [loadCaptures]);

  const deleteMultiple = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => apiDeleteCapture(id)));
      await loadCaptures();
    } catch (error) {
      console.error('Failed to delete captures:', error);
    }
  }, [loadCaptures]);

  const filteredCaptures = useMemo(() => {
    let result = [...captures];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((c) => c.capture_type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.filename.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          cmp = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          cmp = a.file_size - b.file_size;
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [captures, filterType, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadCaptures();
  }, [loadCaptures]);

  return {
    captures,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    loadCaptures,
    deleteCapture: deleteCaptureFn,
    deleteMultiple,
    filteredCaptures,
  };
}
