"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "quick-curtains-gallery-likes";

export default function useLikes() {
  const [likedIds, setLikedIds] = useState(() => new Set());

  useEffect(() => {
    try {
      const storedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(storedIds)) {
        setLikedIds(new Set(storedIds));
      }
    } catch (_error) {
      setLikedIds(new Set());
    }
  }, []);

  function toggleLike(id) {
    setLikedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextIds]));
      } catch (_error) {
        // Likes still work for the current session if storage is unavailable.
      }

      return nextIds;
    });
  }

  return {
    isLiked: (id) => likedIds.has(id),
    toggleLike,
  };
}
