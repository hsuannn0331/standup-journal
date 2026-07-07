import { useCallback, useEffect, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DailyEntry, emptyEntry } from '../types';

// Firestore layout:
//   users/{uid}/entries/{date}   -> DailyEntry
//   users/{uid}/meta/categories  -> { list: Category[] }

export function useEntries(uid: string | null, currentDate: string) {
  const [entry, setEntry] = useState<DailyEntry>(emptyEntry());
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const entryRef = useCallback(
    (date: string) => doc(db, 'users', uid as string, 'entries', date),
    [uid]
  );

  const loadEntry = useCallback(
    async (date: string): Promise<DailyEntry | null> => {
      if (!uid) return null;
      const snap = await getDoc(entryRef(date));
      return snap.exists() ? (snap.data() as DailyEntry) : null;
    },
    [uid, entryRef]
  );

  const listEntryDates = useCallback(async (): Promise<string[]> => {
    if (!uid) return [];
    const snap = await getDocs(collection(db, 'users', uid, 'entries'));
    return snap.docs.map((d) => d.id).sort().reverse();
  }, [uid]);

  const buildNewEntry = useCallback(
    async (date: string): Promise<DailyEntry> => {
      const dates = await listEntryDates();
      const prevDate = dates.filter((d) => d < date).sort().reverse()[0];
      const next = emptyEntry();
      if (prevDate) {
        const prev = await loadEntry(prevDate);
        if (prev?.today) {
          next.yesterday = prev.today.map((i) => ({
            id: Math.random().toString(36).slice(2, 9),
            text: i.text,
            tags: [...(i.tags || [])],
          }));
        }
      }
      return next;
    },
    [listEntryDates, loadEntry]
  );

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let e = await loadEntry(currentDate);
      if (!e) e = await buildNewEntry(currentDate);
      if (!cancelled) {
        setEntry(e as DailyEntry);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, currentDate]);

  const scheduleSave = useCallback(
    (next: DailyEntry) => {
      setEntry(next);
      if (!uid) return;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        setDoc(entryRef(currentDate), next).catch((err) =>
          console.error('Failed to save entry', err)
        );
      }, 500);
    },
    [uid, currentDate, entryRef]
  );

  const deleteEntry = useCallback(
    async (date: string) => {
      if (!uid) return;
      await deleteDoc(entryRef(date));
    },
    [uid, entryRef]
  );

  return { entry, setEntry: scheduleSave, loading, loadEntry, listEntryDates, deleteEntry };
}
