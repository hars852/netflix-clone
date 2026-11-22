// firebaseService.js - Pure Frontend User Data via Firebase Firestore & LocalStorage
import { db, auth } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

const LOCAL_WATCHLIST_KEY = 'netflix_user_watchlist';
const LOCAL_HISTORY_KEY = 'netflix_user_history';

/**
 * Get the current logged-in user UID safely
 */
const getCurrentUid = () => {
  return auth.currentUser ? auth.currentUser.uid : 'guest';
};

/**
 * Fetch Watchlist items for current user (Firestore with localStorage fallback)
 */
export const getUserWatchlist = async () => {
  const uid = getCurrentUid();
  const localItems = JSON.parse(localStorage.getItem(`${LOCAL_WATCHLIST_KEY}_${uid}`) || '[]');

  if (uid === 'guest') {
    return localItems;
  }

  try {
    const colRef = collection(db, 'users', uid, 'watchlist');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data()));
      // Update local storage cache
      localStorage.setItem(`${LOCAL_WATCHLIST_KEY}_${uid}`, JSON.stringify(items));
      return items;
    }
    return localItems;
  } catch (err) {
    console.warn('Firestore watchlist read error, falling back to local cache:', err.message);
    return localItems;
  }
};

/**
 * Add or Remove an item from the Watchlist
 */
export const toggleUserWatchlist = async (item) => {
  const uid = getCurrentUid();
  let localList = JSON.parse(localStorage.getItem(`${LOCAL_WATCHLIST_KEY}_${uid}`) || '[]');
  const mediaId = String(item.mediaId || item.id);
  const exists = localList.some((i) => String(i.mediaId || i.id) === mediaId);

  const cleanItem = {
    mediaId,
    id: mediaId,
    mediaType: item.mediaType || item.type || 'movie',
    title: item.title || 'Untitled',
    posterUrl: item.posterUrl || '',
    backdropUrl: item.backdropUrl || '',
    year: item.year || '',
    rating: item.rating || '',
    addedAt: new Date().toISOString()
  };

  if (exists) {
    localList = localList.filter((i) => String(i.mediaId || i.id) !== mediaId);
    localStorage.setItem(`${LOCAL_WATCHLIST_KEY}_${uid}`, JSON.stringify(localList));

    if (uid !== 'guest') {
      try {
        await deleteDoc(doc(db, 'users', uid, 'watchlist', mediaId));
      } catch (err) {
        console.warn('Firestore watchlist delete warning:', err.message);
      }
    }
    return { success: true, inWatchlist: false };
  } else {
    localList.unshift(cleanItem);
    localStorage.setItem(`${LOCAL_WATCHLIST_KEY}_${uid}`, JSON.stringify(localList));

    if (uid !== 'guest') {
      try {
        await setDoc(doc(db, 'users', uid, 'watchlist', mediaId), {
          ...cleanItem,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn('Firestore watchlist write warning:', err.message);
      }
    }
    return { success: true, inWatchlist: true, item: cleanItem };
  }
};

/**
 * Save playback progress and watch history
 */
export const saveUserProgress = async ({ mediaId, mediaType = 'movie', title, posterUrl, progress, duration }) => {
  const uid = getCurrentUid();
  const idStr = String(mediaId);

  // Store in localStorage for instant resume on player
  localStorage.setItem(`netflix_progress_${idStr}`, String(progress));

  const historyEntry = {
    mediaId: idStr,
    id: idStr,
    mediaType,
    title,
    posterUrl,
    progress,
    duration,
    updatedAt: new Date().toISOString()
  };

  let localHistory = JSON.parse(localStorage.getItem(`${LOCAL_HISTORY_KEY}_${uid}`) || '[]');
  localHistory = localHistory.filter((h) => String(h.mediaId || h.id) !== idStr);
  localHistory.unshift(historyEntry);
  if (localHistory.length > 30) localHistory.pop();
  localStorage.setItem(`${LOCAL_HISTORY_KEY}_${uid}`, JSON.stringify(localHistory));

  if (uid !== 'guest') {
    try {
      await setDoc(doc(db, 'users', uid, 'history', idStr), {
        ...historyEntry,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore watch history write warning:', err.message);
    }
  }
};

/**
 * Retrieve watch history
 */
export const getUserWatchHistory = async () => {
  const uid = getCurrentUid();
  const localHistory = JSON.parse(localStorage.getItem(`${LOCAL_HISTORY_KEY}_${uid}`) || '[]');

  if (uid === 'guest') return localHistory;

  try {
    const colRef = collection(db, 'users', uid, 'history');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data()));
      items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      localStorage.setItem(`${LOCAL_HISTORY_KEY}_${uid}`, JSON.stringify(items));
      return items;
    }
    return localHistory;
  } catch (err) {
    console.warn('Firestore watch history read warning:', err.message);
    return localHistory;
  }
};
