import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { jellyfinApi } from '../services/api';
import '../styles/SeriesPlayer.css';

const SeriesPlayer = ({ series, onClose }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configData = await jellyfinApi.getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchSeasons = async () => {
      if (!config || !series) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${config.jellyfinUrl}/Shows/${series.Id}/Seasons?userId=${config.userId}&api_key=${config.apiKey}`
        );
        const data = await response.json();
        
        const seasonList = data.Items || [];
        // Filter out specials (season 0) and sort by season number
        const validSeasons = seasonList
          .filter(s => s.IndexNumber > 0)
          .sort((a, b) => a.IndexNumber - b.IndexNumber);
        
        setSeasons(validSeasons);
        
        // Auto-select first season
        if (validSeasons.length > 0) {
          setSelectedSeason(validSeasons[0]);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [config, series]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!config || !selectedSeason) return;

      try {
        const response = await fetch(
          `${config.jellyfinUrl}/Shows/${series.Id}/Episodes?seasonId=${selectedSeason.Id}&userId=${config.userId}&api_key=${config.apiKey}`
        );
        const data = await response.json();
        
        const episodeList = (data.Items || []).sort((a, b) => a.IndexNumber - b.IndexNumber);
        setEpisodes(episodeList);
        
        // Auto-select first episode
        if (episodeList.length > 0) {
          setSelectedEpisode(episodeList[0]);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };

    fetchEpisodes();
  }, [config, selectedSeason, series]);

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getStreamUrl = (episode) => {
    if (!config || !episode) return '';
    
    const deviceId = 'jellystreaming-web-' + Date.now();
    const videoBitrate = '10000000'; // 10 Mbps
    
    const paramsObj = {
      'api_key': config.apiKey,
      'DeviceId': deviceId,
      'MediaSourceId': episode.Id,
      
      'VideoCodec': 'h264,hevc,vp9,av1',
      'AudioCodec': 'aac,mp3,opus',
      
      'VideoBitrate': videoBitrate,
      'AudioBitrate': '192000',
      'MaxVideoBitDepth': '8',
      
      'PlaySessionId': deviceId,
      'TranscodingMaxAudioChannels': '2',
      'RequireAvc': 'false',
      'SegmentContainer': 'mp4',
      'MinSegments': '1',
      'BreakOnNonKeyFrames': 'false',
      
      'EnableAutoStreamCopy': 'true',
      'AllowVideoStreamCopy': 'true',
      'AllowAudioStreamCopy': 'true',
      
      'SegmentLength': '3',
      'TranscodeReasons': 'ContainerNotSupported'
    };
    
    const params = new URLSearchParams(paramsObj);
    return `${config.jellyfinUrl}/videos/${episode.Id}/master.m3u8?${params.toString()}`;
  };

  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
    setSelectedEpisode(null);
  };

  const handleEpisodeChange = (episode) => {
    setSelectedEpisode(episode);
  };

  // Initialize HLS for the selected episode
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedEpisode || !config) return;

    const streamUrl = getStreamUrl(selectedEpisode);
    console.log('Initializing HLS stream for episode:', selectedEpisode.Name, streamUrl);

    // Destroy previous HLS instance if it exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        
        maxBufferLength: 20,
        maxMaxBufferLength: 40,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        manifestLoadingRetryDelay: 1000,
        
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        levelLoadingRetryDelay: 1000,
        
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        
        progressive: true,
        enableSoftwareAES: true,
        startFragPrefetch: true
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed for episode:', selectedEpisode.Name);
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
              setTimeout(() => {
                if (hlsRef.current) {
                  hls.startLoad();
                }
              }, 1000);
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
              
            default:
              console.error('Unrecoverable error, destroying HLS instance');
              if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
              }
              break;
          }
        }
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } 
    // For Safari with native HLS support
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.error('Autoplay failed:', err);
        });
      });
    } else {
      console.error('HLS is not supported in this browser');
    }
  }, [selectedEpisode, config]);

  if (loading || !config) {
    return (
      <div className="video-player-overlay">
        <div className="video-player-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-overlay">
      <div className="video-player-container series-player">
        <button className="close-player" onClick={onClose}>×</button>
        
        <div className="series-player-header">
          <h2>{series.Name}</h2>
          {selectedEpisode && (
            <h3>
              S{selectedSeason.IndexNumber}E{selectedEpisode.IndexNumber} - {selectedEpisode.Name}
            </h3>
          )}
        </div>

        <div className="series-player-layout">
          {/* Video Player */}
          <div className="series-video-container">
            {selectedEpisode ? (
              <video
                ref={videoRef}
                key={selectedEpisode.Id}
                controls
                className="video-element"
                poster={`${config.jellyfinUrl}/Items/${selectedEpisode.Id}/Images/Primary?api_key=${config.apiKey}`}
                crossOrigin="anonymous"
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="no-episode-selected">
                Select an episode to start watching
              </div>
            )}
          </div>

          {/* Episode Selector Sidebar */}
          <div className="series-sidebar">
            {/* Season Selector */}
            <div className="season-selector">
              <h4>Seasons</h4>
              <div className="season-list">
                {seasons.map((season) => (
                  <button
                    key={season.Id}
                    className={`season-button ${selectedSeason?.Id === season.Id ? 'active' : ''}`}
                    onClick={() => handleSeasonChange(season)}
                  >
                    Season {season.IndexNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode List */}
            <div className="episode-selector">
              <h4>Episodes</h4>
              <div className="episode-list">
                {episodes.map((episode) => (
                  <div
                    key={episode.Id}
                    className={`episode-item ${selectedEpisode?.Id === episode.Id ? 'active' : ''}`}
                    onClick={() => handleEpisodeChange(episode)}
                  >
                    <div className="episode-number">
                      {episode.IndexNumber}
                    </div>
                    <div className="episode-info">
                      <div className="episode-name">{episode.Name}</div>
                      {episode.RunTimeTicks && (
                        <div className="episode-runtime">
                          {Math.round(episode.RunTimeTicks / 600000000)} min
                        </div>
                      )}
                    </div>
                    {episode.UserData?.Played && (
                      <div className="episode-watched">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesPlayer;
