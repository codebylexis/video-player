// Simple in-memory store to pass video URLs between pages
let pendingVideoUrls: (string | null)[] = [];

export const setVideoUrls = (urls: (string | null)[]) => {
  pendingVideoUrls = urls;
};

export const getVideoUrls = (): (string | null)[] => {
  return pendingVideoUrls;
};