let pendingVideoUrls: (string | null)[] = [];
let pendingVideoLabels: string[] = [];

export const setVideoUrls = (urls: (string | null)[]) => {
  pendingVideoUrls = urls;
};

export const getVideoUrls = (): (string | null)[] => {
  return pendingVideoUrls;
};

export const setVideoLabels = (labels: string[]) => {
  pendingVideoLabels = labels;
};

export const getVideoLabels = (): string[] => {
  return pendingVideoLabels;
};