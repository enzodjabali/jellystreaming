import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import './VideoPlayer.css';

const VideoPlayer = ({ movie, config, onClose }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const getQualityBitrate = (qualityLevel) => {
    const bitrates = {
      'auto': '20000000',    // 20 Mbps
      '1080p': '10000000',   // 10 Mbps
      '720p': '5000000',     // 5 Mbps
      '480p': '2500000',     // 2.5 Mbps
      '360p': '1000000',     // 1 Mbps
      '240p': '500000'       // 500 kbps
    };
    return bitrates[qualityLevel] || bitrates['auto'];
  };

  const getStreamUrl = (qualityLevel = quality) => {
    // Jellyfin HLS streaming URL (master playlist)
    const deviceId = 'jellystreaming-web-' + Date.now();
    const videoBitrate = getQualityBitrate(qualityLevel);
    
    const params = new URLSearchParams({
      'api_key': config.apiKey,
      'DeviceId': deviceId,
      'MediaSourceId': movie.Id,
      
      // Codec preferences (prioritize h264 for better compatibility)
      'VideoCodec': 'h264,hevc,vp9,av1',
      'AudioCodec': 'aac,mp3,opus',
      
      // Bitrates based on selected quality
      'VideoBitrate': videoBitrate,
      'AudioBitrate': '192000',
      'MaxVideoBitDepth': '8',
      
      'PlaySessionId': deviceId,
      'TranscodingMaxAudioChannels': '2',
      'RequireAvc': 'false',
      'SegmentContainer': 'mp4',
      'MinSegments': '1',
      'BreakOnNonKeyFrames': 'false',
      
      // Additional parameters for better streaming
      'EnableAutoStreamCopy': qualityLevel === 'auto' ? 'true' : 'false',
      'AllowVideoStreamCopy': qualityLevel === 'auto' ? 'true' : 'false',
      'AllowAudioStreamCopy': 'true',
      'SubtitleStreamIndex': movie.HasSubtitles ? '1' : undefined,
      
      // Segment settings
      'SegmentLength': '3',
      'TranscodeReasons': 'ContainerNotSupported'
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

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setShowSettings(false);
    
    // Save current time
    const currentTime = videoRef.current?.currentTime || 0;
    
    // Reload stream with new quality
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    
    // Reinitialize with new quality
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    }, 100);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
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
        debug: false, // Disable debug to reduce console spam
        enableWorker: true,
        lowLatencyMode: false,
        
        // Buffer settings to prevent crashes and improve performance
        maxBufferLength: 20,        // Reduced from 30 to use less memory
        maxMaxBufferLength: 40,     // Reduced from 60 to use less memory
        maxBufferSize: 60 * 1000 * 1000, // 60 MB buffer size
        maxBufferHole: 0.5,         // Max hole in buffer
        
        // Fragment loading optimizations
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        levelLoadingRetryDelay: 1000,
        
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,     // More retries for 404 errors
        fragLoadingRetryDelay: 1000,
        
        // Audio/Video sync settings
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        
        // Enable progressive streaming
        progressive: true,
        
        // Disable unnecessary features
        enableSoftwareAES: true,
        enableWebVTT: true,
        startFragPrefetch: true
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        video.play().catch(err => {
          console.warn('Autoplay blocked, user interaction required');
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data.type, data.details);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting recovery...');
              // Try to recover by restarting load
              setTimeout(() => {
                if (hlsRef.current) {
                  hls.startLoad();
                }
              }, 1000);
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery...');
              // Try to recover media error
              hls.recoverMediaError();
              break;
              
            default:
              // Cannot recover, destroy and show error
              console.error('Unrecoverable error');
              setError('Playback failed. Please try another movie or refresh the page.');
              if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
              }
              break;
          }
        } else if (data.details === 'fragLoadError' || data.details === 'fragParsingError') {
          // Non-fatal fragment errors, just log them
          console.warn('Fragment load issue (non-fatal):', data.details);
        }
      });

      // Handle buffer stalls
      hls.on(Hls.Events.BUFFER_STALLED_ERROR, () => {
        console.log('Buffer stalled, reloading...');
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
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
  }, [movie.Id, config, quality]);

  // Handle playback speed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  return (
    <div className="video-player-container">
      <button className="close-button" onClick={onClose}>
        ✕
      </button>

      <button 
        className="settings-button" 
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
      >
        ⚙️
      </button>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3>Quality</h3>
            <div className="settings-options">
              {['auto', '1080p', '720p', '480p', '360p', '240p'].map((q) => (
                <button
                  key={q}
                  className={`settings-option ${quality === q ? 'active' : ''}`}
                  onClick={() => handleQualityChange(q)}
                >
                  {q === 'auto' ? 'Auto' : q}
                  {quality === q && ' ✓'}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3>Playback Speed</h3>
            <div className="settings-options">
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                <button
                  key={speed}
                  className={`settings-option ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}x
                  {playbackSpeed === speed && ' ✓'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
