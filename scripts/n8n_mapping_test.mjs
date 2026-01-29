#!/usr/bin/env node
/* eslint-disable no-console */

function mapChannels(existingChannels, youtubeResponse) {
  const existing = existingChannels.map((channel) => channel.youtube_channel_id);
  const existingSet = new Set(existing);
  const channels = youtubeResponse.items || [];
  return channels
    .map((channel) => ({
      name: channel.snippet?.title || 'Canal',
      youtubeChannelId: channel.id,
    }))
    .filter((item) => item.youtubeChannelId && !existingSet.has(item.youtubeChannelId));
}

function mapVideos(cronoChannels, existingVideos, youtubeResponse) {
  const channelMap = new Map(cronoChannels.map((channel) => [channel.youtube_channel_id, channel.id]));
  const existingSet = new Set(existingVideos.map((video) => video.youtube_video_id));
  const videos = youtubeResponse.items || [];
  return videos
    .map((video) => {
      const youtubeChannelId = video.snippet?.channelId;
      const channelId = youtubeChannelId ? channelMap.get(youtubeChannelId) : null;
      return {
        channelId,
        youtubeVideoId: video.id?.videoId,
        title: video.snippet?.title || 'Video',
        description: video.snippet?.description || null,
        publishedAt: video.snippet?.publishedAt || null,
      };
    })
    .filter((item) => item.youtubeVideoId && item.channelId && !existingSet.has(item.youtubeVideoId));
}

function buildDateRange() {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const start = new Date(end);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function mapAnalytics(analyticsRows, sourceItems, endDate) {
  return analyticsRows
    .map((row, index) => {
      const views = parseInt(row[0] || '0', 10);
      const watchTimeMinutes = parseInt(row[1] || '0', 10);
      const avgViewDurationSeconds = parseInt(row[2] || '0', 10);
      const source = sourceItems[index] || {};
      return {
        videoId: source.videoId || null,
        date: endDate,
        views,
        watchTimeMinutes,
        avgViewDurationSeconds,
      };
    })
    .filter((item) => item.videoId);
}

const mockCronoChannels = [
  { id: 'c1', youtube_channel_id: 'UC111' },
  { id: 'c2', youtube_channel_id: 'UC222' },
];

const mockExistingChannels = [
  { youtube_channel_id: 'UC111' },
];

const mockYoutubeChannels = {
  items: [
    { id: 'UC111', snippet: { title: 'Canal A' } },
    { id: 'UC222', snippet: { title: 'Canal B' } },
  ],
};

const mockExistingVideos = [
  { youtube_video_id: 'vidA' },
];

const mockYoutubeVideos = {
  items: [
    { id: { videoId: 'vidA' }, snippet: { channelId: 'UC111', title: 'Video A', publishedAt: '2026-01-01T00:00:00Z' } },
    { id: { videoId: 'vidB' }, snippet: { channelId: 'UC222', title: 'Video B', publishedAt: '2026-01-02T00:00:00Z' } },
  ],
};

const mockAnalyticsRows = [
  ['10', '120', '45'],
  ['5', '60', '30'],
];

const mockSourceItems = [
  { videoId: 'v1' },
  { videoId: 'v2' },
];

const dateRange = buildDateRange();

console.log('Map Channels ->', mapChannels(mockExistingChannels, mockYoutubeChannels));
console.log('Map Videos ->', mapVideos(mockCronoChannels, mockExistingVideos, mockYoutubeVideos));
console.log('Build Date Range ->', dateRange);
console.log('Map Analytics ->', mapAnalytics(mockAnalyticsRows, mockSourceItems, dateRange.endDate));
