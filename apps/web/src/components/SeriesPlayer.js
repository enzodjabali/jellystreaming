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
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(-1);
  const [tracksLoaded, setTracksLoaded] = useState(false);

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

  // Fetch audio and subtitle tracks for selected episode
  useEffect(() => {
    const fetchMediaStreams = async () => {
      if (!config || !selectedEpisode) return;

      try {
        setTracksLoaded(false);
        console.log('Fetching media streams for episode:', selectedEpisode.Id);
        const response = await fetch(
          `${config.jellyfinUrl}/Items/${selectedEpisode.Id}/PlaybackInfo?UserId=${config.userId}&api_key=${config.apiKey}`
        );
        const data = await response.json();
        
        if (data.MediaSources && data.MediaSources.length > 0) {
          const mediaSource = data.MediaSources[0];
          
          // Extract audio tracks
          const audio = mediaSource.MediaStreams.filter(s => s.Type === 'Audio').map((stream, index) => ({
            index: stream.Index,
            displayIndex: index,
            language: stream.Language || 'Unknown',
            displayTitle: stream.DisplayTitle || `Audio ${index + 1}`,
            codec: stream.Codec,
            channels: stream.Channels,
            isDefault: stream.IsDefault
          }));
          
          // Extract subtitle tracks with "Off" option
          const subtitles = [
            { index: -1, displayIndex: -1, language: 'Off', displayTitle: 'Off', isDefault: true }
          ].concat(
            mediaSource.MediaStreams.filter(s => s.Type === 'Subtitle').map((stream, index) => ({
              index: stream.Index,
              displayIndex: index,
              language: stream.Language || 'Unknown',
              displayTitle: stream.DisplayTitle || `Subtitle ${index + 1}`,
              codec: stream.Codec,
              isDefault: false
            }))
          );
          
          setAudioTracks(audio);
          setSubtitleTracks(subtitles);
          
          // Set default tracks
          const defaultAudio = audio.find(a => a.isDefault) || audio[0];
          if (defaultAudio) {
            setSelectedAudioTrack(defaultAudio.index);
          }
          
          setSelectedSubtitleTrack(-1);
        }
        
        setTracksLoaded(true);
      } catch (error) {
        console.error('Error fetching media streams:', error);
        setTracksLoaded(true);
      }
    };
    
    fetchMediaStreams();
  }, [selectedEpisode, config]);

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

  const getQualityBitrate = (qualityLevel) => {
    const bitrates = {
      'auto': '20000000',
      '1080p': '10000000',
      '720p': '5000000',
      '480p': '2500000',
      '360p': '1000000',
      '240p': '500000'
    };
    return bitrates[qualityLevel] || bitrates['auto'];
  };

  const getStreamUrl = (episode, qualityLevel = quality) => {
    if (!config || !episode) return '';
    
    const deviceId = 'jellystreaming-web-' + Date.now();
    const videoBitrate = getQualityBitrate(qualityLevel);
    
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
      
      'EnableAutoStreamCopy': qualityLevel === 'auto' ? 'true' : 'false',
      'AllowVideoStreamCopy': qualityLevel === 'auto' ? 'true' : 'false',
      'AllowAudioStreamCopy': 'true',
      
      'SegmentLength': '3',
      'TranscodeReasons': 'ContainerNotSupported'
    };
    
    // Add audio track index if available
    if (selectedAudioTrack !== null && selectedAudioTrack !== undefined) {
      paramsObj['AudioStreamIndex'] = selectedAudioTrack;
    }
    
    // Add subtitle track if enabled
    if (selectedSubtitleTrack !== null && selectedSubtitleTrack !== -1) {
      paramsObj['SubtitleStreamIndex'] = selectedSubtitleTrack;
      paramsObj['SubtitleMethod'] = 'Encode';
    }
    
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

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setShowSettings(false);
    
    const currentTime = videoRef.current?.currentTime || 0;
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    
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

  const handleAudioTrackChange = (trackIndex) => {
    setSelectedAudioTrack(trackIndex);
    setShowSettings(false);
    
    const currentTime = videoRef.current?.currentTime || 0;
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    }, 100);
  };

  const handleSubtitleTrackChange = (trackIndex) => {
    setSelectedSubtitleTrack(trackIndex);
    setShowSettings(false);
    
    const currentTime = videoRef.current?.currentTime || 0;
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    }, 100);
  };

  // Handle playback speed changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Initialize HLS for the selected episode
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedEpisode || !config || !tracksLoaded) return;

    const streamUrl = getStreamUrl(selectedEpisode);
    console.log('Initializing HLS stream for episode:', selectedEpisode.Name);

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
        
        // Enable subtitles if selected
        if (selectedSubtitleTrack !== null && selectedSubtitleTrack !== -1) {
          setTimeout(() => {
            if (video.textTracks && video.textTracks.length > 0) {
              for (let i = 0; i < video.textTracks.length; i++) {
                video.textTracks[i].mode = 'showing';
              }
            }
          }, 500);
        } else {
          setTimeout(() => {
            if (video.textTracks && video.textTracks.length > 0) {
              for (let i = 0; i < video.textTracks.length; i++) {
                video.textTracks[i].mode = 'hidden';
              }
            }
          }, 500);
        }
        
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
  }, [selectedEpisode, config, quality, selectedAudioTrack, selectedSubtitleTrack, tracksLoaded]);

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

            {audioTracks.length > 0 && (
              <div className="settings-section">
                <h3>Audio</h3>
                <div className="settings-options">
                  {audioTracks.map((track) => (
                    <button
                      key={track.index}
                      className={`settings-option ${selectedAudioTrack === track.index ? 'active' : ''}`}
                      onClick={() => handleAudioTrackChange(track.index)}
                    >
                      {track.displayTitle}
                      {selectedAudioTrack === track.index && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {subtitleTracks.length > 0 && (
              <div className="settings-section">
                <h3>Subtitles</h3>
                <div className="settings-options">
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.index}
                      className={`settings-option ${selectedSubtitleTrack === track.index ? 'active' : ''}`}
                      onClick={() => handleSubtitleTrackChange(track.index)}
                    >
                      {track.displayTitle}
                      {selectedSubtitleTrack === track.index && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
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
