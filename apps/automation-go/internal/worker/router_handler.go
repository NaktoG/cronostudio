package worker

import "context"

type RouterHandler struct {
	DefaultHandler         Handler
	YouTubeChannelsHandler Handler
	YouTubeVideosHandler   Handler
	YouTubeAnalyticsDailyHandler Handler
}

func (h RouterHandler) Handle(ctx context.Context, job Job) error {
	switch job.JobType {
	case "youtube.sync.channels":
		if h.YouTubeChannelsHandler != nil {
			return h.YouTubeChannelsHandler.Handle(ctx, job)
		}
	case "youtube.sync.videos":
		if h.YouTubeVideosHandler != nil {
			return h.YouTubeVideosHandler.Handle(ctx, job)
		}
	case "youtube.analytics.ingest.daily":
		if h.YouTubeAnalyticsDailyHandler != nil {
			return h.YouTubeAnalyticsDailyHandler.Handle(ctx, job)
		}
	}

	if h.DefaultHandler == nil {
		return nil
	}
	return h.DefaultHandler.Handle(ctx, job)
}
