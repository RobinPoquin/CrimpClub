import { useState, useEffect } from 'react';
import { getAscentsPaginated, getAscents } from '../../lib/db';

export function useAscents(userId) {
  const [ascents, setAscents]         = useState([]);
  const [allAscents, setAllAscents]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [page, setPage]               = useState(0);
  const [refresh, setRefresh]         = useState(0); // compteur pour forcer le rechargement

  useEffect(() => {
    if (!userId) return;
    async function load() {
      setLoading(true);
      try {
        const [paginated, all] = await Promise.all([
          getAscentsPaginated(userId, 0),
          getAscents(userId),
        ]);
        setAscents(paginated);
        setAllAscents(all);
        setPage(0);
        setHasMore(paginated.length === 20);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, refresh]); // se relance quand refresh change

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data     = await getAscentsPaginated(userId, nextPage);
      setAscents(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === 20);
    } finally {
      setLoadingMore(false);
    }
  }

  // Incrémente refresh pour forcer le rechargement
  function reload() { setRefresh(r => r + 1); }

  return { ascents, allAscents, loading, loadingMore, hasMore, reload, loadMore };
}