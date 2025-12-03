import React, { useEffect, useState } from 'react';
import { tmdbTVApi, jellyfinTVApi, sonarrApi } from '../services/api';
import '../styles/MovieModal.css'; // Reuse movie modal styles for now

const SeriesModal = ({ series, onClose, onPlay }) => {
  const [tvDetails, setTvDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sonarrSeries, setSonarrSeries] = useState(null);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [queueItem, setQueueItem] = useState(null);
  const [jellyfinSeries, setJellyfinSeries] = useState(null);
  const [tvdbId, setTvdbId] = useState(null);
  const [rootFolderPath, setRootFolderPath] = useState(null);

  // Check if this is a Jellyfin series (has Id) or TMDB series (has id)
  const isJellyfinSeries = series.Id !== undefined;
  const isTMDBSeries = series.id !== undefined && !isJellyfinSeries;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        
        // If it's a TMDB series, it already has all details
        if (isTMDBSeries) {
          setTvDetails(series);
          
          // Fetch external IDs from TMDB to get TVDB ID
          try {
            const response = await fetch(`/api/tmdb/tv/${series.id}/external_ids`);
            const externalIds = await response.json();
            console.log('External IDs from TMDB:', externalIds);
            if (externalIds.tvdb_id) {
              console.log('Found TVDB ID:', externalIds.tvdb_id);
              setTvdbId(externalIds.tvdb_id);
            } else {
              console.warn('No TVDB ID found in external IDs');
            }
          } catch (error) {
            console.error('Error fetching TVDB ID:', error);
          }
          
          // Try to find in Jellyfin by TMDB ID
          try {
            const jellyfinSeries = await jellyfinTVApi.getSeries();
            const matchingSeries = jellyfinSeries.find(s => 
              s.ProviderIds?.Tmdb === series.id.toString()
            );
            if (matchingSeries) {
              setJellyfinSeries(matchingSeries);
            }
          } catch (error) {
            console.log('Series not in Jellyfin yet');
          }
          
          // Check Sonarr by TMDB ID
          try {
            const allSonarrSeries = await sonarrApi.getSeries();
            const existingSeries = allSonarrSeries.find(s => 
              s.tmdbId === series.id
            );
            setSonarrSeries(existingSeries);
            
            if (existingSeries) {
              const queue = await sonarrApi.getQueue();
              const seriesQueue = queue.records?.find(q => q.seriesId === existingSeries.id);
              setQueueItem(seriesQueue);
            }
          } catch (error) {
            console.log('Error checking Sonarr:', error);
          }
        } 
        // If it's a Jellyfin series
        else if (isJellyfinSeries) {
          setJellyfinSeries(series);
          
          // Get TVDB ID from Jellyfin series
          const jellyfinTvdbId = series.ProviderIds?.Tvdb;
          if (jellyfinTvdbId) {
            setTvdbId(jellyfinTvdbId);
          }
          
          if (jellyfinTvdbId) {
            // Check if series exists in Sonarr
            const allSonarrSeries = await sonarrApi.getSeries();
            const existingSeries = allSonarrSeries.find(s => s.tvdbId === parseInt(jellyfinTvdbId));
            setSonarrSeries(existingSeries);
            
            // Check queue for download status
            if (existingSeries) {
              const queue = await sonarrApi.getQueue();
              const seriesQueue = queue.records?.find(q => q.seriesId === existingSeries.id);
              setQueueItem(seriesQueue);
            }
          }

          // Get details from TMDB if we have TMDB ID
          const tmdbId = series.ProviderIds?.Tmdb;
          if (tmdbId) {
            const details = await tmdbTVApi.getTVDetails(tmdbId);
            setTvDetails(details);
          }
        }
      } catch (error) {
        console.error('Error fetching series details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [series, isTMDBSeries, isJellyfinSeries]);

  // Fetch root folder path from Sonarr
  useEffect(() => {
    const fetchRootFolder = async () => {
      try {
        const response = await fetch('/api/sonarr/rootfolders');
        const rootFolders = await response.json();
        if (rootFolders && rootFolders.length > 0) {
          // Use the first root folder
          setRootFolderPath(rootFolders[0].path);
          console.log('Using Sonarr root folder:', rootFolders[0].path);
        }
      } catch (error) {
        console.error('Error fetching root folders:', error);
        // Fallback to /tv if fetch fails
        setRootFolderPath('/tv');
      }
    };

    fetchRootFolder();
  }, []);

  const handleSeasonToggle = (seasonNumber) => {
    if (sonarrSeries) {
      // For existing series, toggle in selectedSeasons (will be merged later)
      setSelectedSeasons(prev => {
        // Start with currently monitored seasons if selectedSeasons is empty
        if (prev.length === 0) {
          const currentlyMonitored = sonarrSeries.seasons
            .filter(s => s.monitored && s.seasonNumber > 0)
            .map(s => s.seasonNumber);
          
          // Toggle the clicked season
          if (currentlyMonitored.includes(seasonNumber)) {
            return currentlyMonitored.filter(s => s !== seasonNumber);
          } else {
            return [...currentlyMonitored, seasonNumber];
          }
        }
        
        // Normal toggle
        if (prev.includes(seasonNumber)) {
          return prev.filter(s => s !== seasonNumber);
        } else {
          return [...prev, seasonNumber];
        }
      });
    } else {
      // For new series
      setSelectedSeasons(prev => {
        if (prev.includes(seasonNumber)) {
          return prev.filter(s => s !== seasonNumber);
        } else {
          return [...prev, seasonNumber];
        }
      });
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Get series identifiers
      const tmdbId = isTMDBSeries ? series.id : (series.ProviderIds?.Tmdb ? parseInt(series.ProviderIds.Tmdb) : null);
      
      console.log('Download attempt:', {
        tvdbId,
        tmdbId,
        isTMDBSeries,
        series,
        isUpdate: !!sonarrSeries
      });

      // If updating existing series
      if (sonarrSeries) {
        // Determine which seasons should be monitored
        let seasonsToMonitor;
        if (selectedSeasons.length === 0) {
          // No changes, keep current monitoring
          seasonsToMonitor = sonarrSeries.seasons.map(s => s.seasonNumber).filter(s => {
            const season = sonarrSeries.seasons.find(ss => ss.seasonNumber === s);
            return season && season.monitored;
          });
        } else {
          // Use selected seasons
          seasonsToMonitor = selectedSeasons;
        }
        
        // Update season monitoring
        const updatedSeasons = sonarrSeries.seasons.map(s => ({
          ...s,
          monitored: s.seasonNumber === 0 ? false : seasonsToMonitor.includes(s.seasonNumber)
        }));

        const updatedSeriesData = {
          ...sonarrSeries,
          seasons: updatedSeasons,
          monitored: true,
          addOptions: {
            searchForMissingEpisodes: true
          }
        };

        await sonarrApi.updateSeries(updatedSeriesData);
        alert('Series updated in Sonarr! New seasons will start downloading.');
        
        // Refresh series data
        const allSonarrSeries = await sonarrApi.getSeries();
        const updated = allSonarrSeries.find(s => s.id === sonarrSeries.id);
        setSonarrSeries(updated);
        setDownloading(false);
        return;
      }

      // Sonarr v3 can work with TVDB ID or TMDB ID
      // Try TVDB first, fallback to TMDB lookup
      if (!tvdbId && !tmdbId) {
        alert('Cannot find TVDB or TMDB ID for this series.');
        setDownloading(false);
        return;
      }

      // Prepare seasons array for new series
      const seasons = tvDetails?.seasons
        ?.filter(s => s.season_number > 0) // Exclude specials
        ?.map(s => ({
          seasonNumber: s.season_number,
          monitored: selectedSeasons.length === 0 || selectedSeasons.includes(s.season_number)
        })) || [];

      // Get series name and year from either TMDB or Jellyfin
      const seriesName = tvDetails?.name || series.Name || series.name;
      const firstAirDate = tvDetails?.first_air_date || series.PremiereDate;
      const year = firstAirDate ? new Date(firstAirDate).getFullYear() : series.ProductionYear;

      // If we have TVDB ID, use it directly
      if (tvdbId) {
        if (!rootFolderPath) {
          alert('Root folder path not yet loaded. Please try again.');
          setDownloading(false);
          return;
        }

        const seriesData = {
          title: seriesName,
          tvdbId: parseInt(tvdbId),
          year: year,
          qualityProfileId: 1,
          rootFolderPath: rootFolderPath,
          monitored: true,
          seasonFolder: true,
          seasons: seasons,
          addOptions: {
            searchForMissingEpisodes: true
          }
        };

        if (tmdbId) {
          seriesData.tmdbId = tmdbId;
        }

        console.log('Adding series to Sonarr:', seriesData);
        await sonarrApi.addSeries(seriesData);
        alert('Series added to Sonarr!');
        
        // Refresh to get updated status
        const allSonarrSeries = await sonarrApi.getSeries();
        const addedSeries = allSonarrSeries.find(s => s.tvdbId === parseInt(tvdbId));
        setSonarrSeries(addedSeries);
      } else if (tmdbId) {
        // Fallback: Use Sonarr lookup by TMDB to get TVDB ID
        console.log('No TVDB ID, trying Sonarr lookup with TMDB ID:', tmdbId);
        
        try {
          const lookupResponse = await fetch(`/api/sonarr/lookup?term=tmdb:${tmdbId}`);
          
          console.log('Sonarr lookup response status:', lookupResponse.status);
          
          if (!lookupResponse.ok) {
            throw new Error(`Sonarr lookup failed with status ${lookupResponse.status}`);
          }
          
          const lookupResults = await lookupResponse.json();
          
          console.log('Sonarr lookup results:', lookupResults);
          
          if (lookupResults && lookupResults.length > 0) {
            const sonarrSeries = lookupResults[0];
            
            // Update seasons monitoring based on user selection
            sonarrSeries.seasons = sonarrSeries.seasons.map(s => ({
              ...s,
              monitored: s.seasonNumber === 0 ? false : (selectedSeasons.length === 0 || selectedSeasons.includes(s.seasonNumber))
            }));
            
            if (!rootFolderPath) {
              alert('Root folder path not yet loaded. Please try again.');
              setDownloading(false);
              return;
            }

            sonarrSeries.qualityProfileId = 1;
            sonarrSeries.rootFolderPath = rootFolderPath;
            sonarrSeries.monitored = true;
            sonarrSeries.seasonFolder = true;
            sonarrSeries.addOptions = {
              searchForMissingEpisodes: true
            };
            
            console.log('Adding series to Sonarr via lookup:', sonarrSeries);
            await sonarrApi.addSeries(sonarrSeries);
            alert('Series added to Sonarr!');
            
            // Refresh to get updated status
            const allSonarrSeries = await sonarrApi.getSeries();
            const addedSeries = allSonarrSeries.find(s => s.tmdbId === tmdbId);
            setSonarrSeries(addedSeries);
          } else {
            alert('Could not find this series in Sonarr\'s database. It might not be available.');
            setDownloading(false);
            return;
          }
        } catch (lookupError) {
          console.error('Sonarr lookup failed:', lookupError);
          alert('Failed to lookup series in Sonarr. Please check your Sonarr connection.');
          setDownloading(false);
          return;
        }
      }
      
    } catch (error) {
      console.error('Error adding series to Sonarr:', error);
      alert('Failed to add series to Sonarr: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePlay = () => {
    // Can only play if we have Jellyfin series
    if (jellyfinSeries) {
      onPlay(jellyfinSeries);
    } else {
      alert('This series is not in your Jellyfin library yet. Download it first!');
    }
  };

  const backdropUrl = tmdbTVApi.getBackdropUrl(tvDetails?.backdrop_path);
  const posterUrl = tmdbTVApi.getImageUrl(tvDetails?.poster_path);
  const seriesName = tvDetails?.name || series.Name || series.name;
  const firstAirDate = tvDetails?.first_air_date || series.PremiereDate;
  const year = firstAirDate ? new Date(firstAirDate).getFullYear() : series.ProductionYear;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {backdropUrl && (
          <div 
            className="modal-backdrop"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="backdrop-gradient"></div>
          </div>
        )}

        <div className="modal-body">
          <div className="modal-info">
            {posterUrl && (
              <img 
                src={posterUrl} 
                alt={seriesName}
                className="modal-poster"
              />
            )}
            
            <div className="modal-details">
              <h2>{seriesName}</h2>
              
              <div className="modal-meta">
                {year && <span>{year}</span>}
                {tvDetails?.content_rating && <span className="rating-badge">{tvDetails.content_rating}</span>}
                {series.OfficialRating && <span className="rating-badge">{series.OfficialRating}</span>}
                {(tvDetails?.vote_average || series.CommunityRating) && (
                  <span className="rating">⭐ {(tvDetails?.vote_average || series.CommunityRating).toFixed(1)}</span>
                )}
                {(tvDetails?.status || series.Status) && (
                  <span className="status-badge">{tvDetails?.status || series.Status}</span>
                )}
              </div>

              {tvDetails?.overview && (
                <p className="modal-overview">{tvDetails.overview}</p>
              )}

              {/* Season Selection */}
              {tvDetails?.seasons && (
                <div className="season-selection">
                  <h3>{sonarrSeries ? 'Seasons Status:' : 'Select Seasons to Download:'}</h3>
                  <div className="seasons-grid">
                    {tvDetails.seasons
                      .filter(s => s.season_number > 0)
                      .map(season => {
                        const sonarrSeason = sonarrSeries?.seasons?.find(s => s.seasonNumber === season.season_number);
                        const isMonitored = sonarrSeason?.monitored || false;
                        const hasFiles = sonarrSeason?.statistics?.episodeFileCount > 0;
                        
                        // Determine checked state
                        const isChecked = sonarrSeries 
                          ? (selectedSeasons.length === 0 ? isMonitored : selectedSeasons.includes(season.season_number))
                          : (selectedSeasons.length === 0 || selectedSeasons.includes(season.season_number));
                        
                        return (
                          <label key={season.id} className="season-checkbox">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSeasonToggle(season.season_number)}
                            />
                            <span>Season {season.season_number}</span>
                            <span className="episode-count">({season.episode_count} episodes)</span>
                            {sonarrSeries && (
                              <span className={`season-status ${hasFiles ? 'downloaded' : isMonitored ? 'monitored' : 'not-monitored'}`}>
                                {hasFiles ? '✓ Downloaded' : isMonitored ? '⬇ Monitored' : ''}
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                  {!sonarrSeries && (
                    <p className="season-note">
                      {selectedSeasons.length === 0 
                        ? "All seasons will be downloaded" 
                        : `${selectedSeasons.length} season(s) selected`}
                    </p>
                  )}
                  {sonarrSeries && (
                    <p className="season-note">
                      Select additional seasons to download
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="modal-actions">
                {jellyfinSeries && (
                  <button 
                    className="btn-play"
                    onClick={handlePlay}
                  >
                    ▶ Watch Now
                  </button>
                )}
                
                {!sonarrSeries ? (
                  <button 
                    className={`btn-download ${downloading ? 'downloading' : ''}`}
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? 'Adding...' : '⬇ Download'}
                  </button>
                ) : (
                  <div className="download-status-with-actions">
                    {queueItem ? (
                      <span className="status-downloading">
                        ⬇ Downloading... {queueItem.sizeleft && queueItem.size 
                          ? `${Math.round((1 - queueItem.sizeleft / queueItem.size) * 100)}%` 
                          : ''}
                      </span>
                    ) : (
                      <span className="status-monitored">✓ In Library</span>
                    )}
                    <button 
                      className={`btn-download-more ${downloading ? 'downloading' : ''}`}
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      {downloading ? 'Updating...' : '⬇ Download More Seasons'}
                    </button>
                  </div>
                )}
              </div>

              {tvDetails?.genres && tvDetails.genres.length > 0 && (
                <div className="modal-genres">
                  {tvDetails.genres.map(genre => (
                    <span key={genre.id} className="genre-tag">{genre.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesModal;
