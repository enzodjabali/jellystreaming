import React, { useState, useEffect } from 'react';
import { radarrApi, sonarrApi } from '../services/api';
import '../styles/Downloads.css';

const Downloads = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueue();
    // Refresh every 5 seconds
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      setError(null);
      
      // Fetch both Radarr and Sonarr queues in parallel
      const [radarrData, sonarrData] = await Promise.all([
        (async () => {
          try {
            await radarrApi.refreshMonitoredDownloads();
            return await radarrApi.getQueue();
          } catch (err) {
            console.error('Error fetching Radarr queue:', err);
            return { records: [] };
          }
        })(),
        (async () => {
          try {
            await sonarrApi.refreshMonitoredDownloads();
            return await sonarrApi.getQueue();
          } catch (err) {
            console.error('Error fetching Sonarr queue:', err);
            return { records: [] };
          }
        })()
      ]);
      
      // Filter to only show active downloads
      const radarrDownloads = (radarrData.records || [])
        .filter(item => 
          item.status === 'downloading' || 
          item.status === 'queued' || 
          item.status === 'paused'
        )
        .map(item => ({ ...item, type: 'movie' }));
      
      const sonarrDownloads = (sonarrData.records || [])
        .filter(item => 
          item.status === 'downloading' || 
          item.status === 'queued' || 
          item.status === 'paused'
        );
      
      // Group Sonarr episodes by series
      const groupedSeries = {};
      sonarrDownloads.forEach(item => {
        const seriesKey = `${item.seriesId}-${item.seasonNumber || 'unknown'}`;
        if (!groupedSeries[seriesKey]) {
          groupedSeries[seriesKey] = {
            id: seriesKey,
            type: 'series',
            seriesId: item.seriesId,
            title: item.series?.title || item.title?.split(' - ')[0] || 'Unknown Series',
            seasonNumber: item.seasonNumber || item.episode?.seasonNumber,
            episodes: [],
            totalSize: 0,
            totalSizeLeft: 0,
            status: item.status,
            added: item.added
          };
        }
        groupedSeries[seriesKey].episodes.push(item);
        groupedSeries[seriesKey].totalSize += item.size || 0;
        groupedSeries[seriesKey].totalSizeLeft += item.sizeleft || 0;
        // Use the most recent status (downloading > queued > paused)
        if (item.status === 'downloading') {
          groupedSeries[seriesKey].status = 'downloading';
        } else if (item.status === 'queued' && groupedSeries[seriesKey].status !== 'downloading') {
          groupedSeries[seriesKey].status = 'queued';
        }
      });
      
      const groupedSonarrDownloads = Object.values(groupedSeries);
      
      // Combine and sort by queued time
      const combinedQueue = [...radarrDownloads, ...groupedSonarrDownloads]
        .sort((a, b) => new Date(b.added || 0) - new Date(a.added || 0));
      
      setQueue(combinedQueue);
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError('Failed to load download queue');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (item) => {
    const { status, trackedDownloadStatus, trackedDownloadState } = item;

    if (status === 'downloading') {
      return { class: 'status-downloading', label: 'Downloading' };
    }
    if (status === 'paused') {
      return { class: 'status-paused', label: 'Paused' };
    }
    if (status === 'queued') {
      return { class: 'status-queued', label: 'Queued' };
    }
    if (status === 'completed' && trackedDownloadState === 'importPending') {
      return { class: 'status-importing', label: 'Import Pending' };
    }
    if (status === 'completed' && trackedDownloadState === 'importBlocked') {
      return { class: 'status-blocked', label: 'Import Blocked' };
    }
    if (status === 'completed' && trackedDownloadStatus === 'warning') {
      return { class: 'status-warning', label: 'Completed with Warnings' };
    }
    if (status === 'completed') {
      return { class: 'status-completed', label: 'Completed' };
    }
    if (status === 'failed') {
      return { class: 'status-failed', label: 'Failed' };
    }
    
    return { class: 'status-unknown', label: status };
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeLeft = (timeleft) => {
    if (!timeleft || timeleft === '00:00:00') return 'Completed';
    return timeleft;
  };

  const getProgress = (item) => {
    if (item.type === 'series') {
      // For grouped series, calculate total progress
      const size = item.totalSize;
      const sizeleft = item.totalSizeLeft;
      if (!size || size === 0) return 100;
      const progress = ((size - sizeleft) / size) * 100;
      return Math.max(0, Math.min(100, progress));
    } else {
      // For movies
      const size = item.size;
      const sizeleft = item.sizeleft;
      if (!size || size === 0) return 100;
      const progress = ((size - sizeleft) / size) * 100;
      return Math.max(0, Math.min(100, progress));
    }
  };

  const getSeriesTitle = (item) => {
    if (item.type === 'series') {
      const episodeCount = item.episodes.length;
      const seasonNum = item.seasonNumber || '?';
      return `${item.title} - Season ${seasonNum} (${episodeCount} episode${episodeCount !== 1 ? 's' : ''})`;
    }
    return item.title;
  };

  const getTimeLeft = (item) => {
    if (item.type === 'series') {
      // Find the episode with the longest time left
      const maxTimeLeft = item.episodes.reduce((max, ep) => {
        if (!ep.timeleft || ep.timeleft === '00:00:00') return max;
        if (!max || ep.timeleft > max) return ep.timeleft;
        return max;
      }, null);
      return maxTimeLeft || '00:00:00';
    }
    return item.timeleft;
  };

  if (loading) {
    return (
      <div className="downloads-page">
        <div className="downloads-header">
          <h1>Downloads</h1>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading downloads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="downloads-page">
        <div className="downloads-header">
          <h1>Downloads</h1>
        </div>
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchQueue} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="downloads-page">
      <div className="downloads-header">
        <h1>Downloads</h1>
        <p className="subtitle">
          {queue.length} {queue.length === 1 ? 'download' : 'downloads'} in queue
        </p>
        <button onClick={fetchQueue} className="refresh-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Refresh
        </button>
      </div>

      {queue.length === 0 ? (
        <div className="empty-queue">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <h2>No active downloads</h2>
          <p>Movies and TV shows you download will appear here</p>
        </div>
      ) : (
        <div className="queue-list">
          {queue.map((item) => {
            const statusInfo = getStatusBadge(item);
            const progress = getProgress(item);
            const displayTitle = getSeriesTitle(item);
            const timeLeft = getTimeLeft(item);
            const totalSize = item.type === 'series' ? item.totalSize : item.size;

            return (
              <div key={`${item.type}-${item.id}`} className="queue-item">
                <div className="queue-item-header">
                  <div className="title-with-type">
                    <h3 className="queue-item-title">{displayTitle}</h3>
                    <span className={`type-badge ${item.type === 'movie' ? 'type-movie' : 'type-series'}`}>
                      {item.type === 'movie' ? 'MOVIE' : 'TV SHOW'}
                    </span>
                  </div>
                  <span className={`status-badge ${statusInfo.class}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="queue-item-info">
                  <div className="info-row">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{formatSize(totalSize)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Time left:</span>
                    <span className="info-value">{formatTimeLeft(timeLeft)}</span>
                  </div>
                </div>

                {totalSize > 0 && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{progress.toFixed(1)}%</span>
                  </div>
                )}

                {item.statusMessages && item.statusMessages.length > 0 && (
                  <div className="status-messages">
                    {item.statusMessages.map((msg, idx) => (
                      <div key={idx} className="status-message">
                        {msg.title && <strong>{msg.title}</strong>}
                        {msg.messages && msg.messages.length > 0 && (
                          <ul>
                            {msg.messages.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Downloads;
