import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import './VideoPlayer.css';

const VideoPlayer = ({ movie, config, onClose }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);

  const getStreamUrl = () => {
    // Jellyfin HLS streaming URL (master playlist)
    const deviceId = 'jellystreaming-web-' + Date.now();
    const params = new URLSearchParams({
      'api_key': config.apiKey,
      'DeviceId': deviceId,
      'MediaSourceId': movie.Id,
      'VideoCodec': 'h264,hevc,av1,vp9',
      'AudioCodec': 'aac,mp3,opus',
      'VideoBitrate': '139616000',
      'AudioBitrate': '384000',
      'PlaySessionId': deviceId,
      'TranscodingMaxAudioChannels': '2',
      'RequireAvc': 'false',
      'Tag': movie.ImageTags?.Primary || '',
      'SegmentContainer': 'mp4',
      'MinSegments': '2',
      'BreakOnNonKeyFrames': 'true'
    });
    
    return `${config.jellyfinUrl}/videos/${movie.Id}/master.m3u8?${params.toString()}`;
  };

  const getSubtitlesUrl = () => {
    if (!movie.HasSubtitles) return null;
    return `${config.jellyfinUrl}/Videos/${movie.Id}/Subtitles/0/Stream.vtt?api_key=${config.apiKey}`;
  };

  const formatRuntime = (ticks) => {
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const streamUrl = getStreamUrl();
    console.log('Stream URL:', streamUrl);

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, attempting to play...');
        video.play().catch(err => {
          console.error('Autoplay failed:', err);
          setError('Click play to start the video');
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, cannot recover');
              setError('Failed to load video stream');
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    } 
    // For Safari, which has native HLS support
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.error('Autoplay failed:', err);
          setError('Click play to start the video');
        });
      });
    } else {
      setError('HLS is not supported in this browser');
    }
  }, [movie.Id, config]);

  return (
    <div className="video-player-container">
      <button className="close-button" onClick={onClose}>
        ✕
      </button>

      <div className="video-wrapper">
        {error && (
          <div className="video-error">
            <p>{error}</p>
          </div>
        )}
        <video
          ref={videoRef}
          controls
          className="video-element"
          poster={`${config.jellyfinUrl}/Items/${movie.Id}/Images/Backdrop?api_key=${config.apiKey}`}
          crossOrigin="anonymous"
          playsInline
        >
          {movie.HasSubtitles && (
            <track
              label="Subtitles"
              kind="subtitles"
              srcLang="fr"
              src={getSubtitlesUrl()}
            />
          )}
        </video>
      </div>

      <div className="movie-details">
        <h2>{movie.Name}</h2>
        <div className="details-meta">
          {movie.ProductionYear && <span>{movie.ProductionYear}</span>}
          {movie.OfficialRating && <span className="rating-badge">{movie.OfficialRating}</span>}
          {movie.RunTimeTicks && <span>{formatRuntime(movie.RunTimeTicks)}</span>}
          {movie.CommunityRating && (
            <span className="community-rating">
              ⭐ {movie.CommunityRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
