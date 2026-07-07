import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Category, DEFAULT_CATEGORIES } from '../types';

export function useCategories(uid: string | null) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const catDoc = useCallback(() => doc(db, 'users', uid as string, 'meta', 'categories'), [uid]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const snap = await getDoc(catDoc());
      if (snap.exists()) {
        setCategories((snap.data().list as Category[]) || DEFAULT_CATEGORIES);
      } else {
        await setDoc(catDoc(), { list: DEFAULT_CATEGORIES });
        setCategories(DEFAULT_CATEGORIES);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const save = useCallback(
    (next: Category[]) => {
      setCategories(next);
      if (!uid) return;
      setDoc(catDoc(), { list: next }).catch((err) =>
        console.error('Failed to save categories', err)
      );
    },
    [uid, catDoc]
  );

  return { categories, saveCategories: save };
}
