import React, { useState, useEffect } from 'react';
import { radarrApi } from '../services/api';
import '../styles/Downloads.css';

const Downloads = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueue();
    // Refresh every 10 seconds
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      setError(null);
      const data = await radarrApi.getQueue();
      setQueue(data.records || []);
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
      return { class: 'status-downloading', label: 'Téléchargement en cours' };
    }
    if (status === 'paused') {
      return { class: 'status-paused', label: 'En pause' };
    }
    if (status === 'queued') {
      return { class: 'status-queued', label: 'En file d\'attente' };
    }
    if (status === 'completed' && trackedDownloadState === 'importPending') {
      return { class: 'status-importing', label: 'Import en attente' };
    }
    if (status === 'completed' && trackedDownloadState === 'importBlocked') {
      return { class: 'status-blocked', label: 'Import bloqué' };
    }
    if (status === 'completed' && trackedDownloadStatus === 'warning') {
      return { class: 'status-warning', label: 'Terminé avec avertissements' };
    }
    if (status === 'completed') {
      return { class: 'status-completed', label: 'Téléchargé' };
    }
    if (status === 'failed') {
      return { class: 'status-failed', label: 'Échec' };
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
    if (!timeleft || timeleft === '00:00:00') return 'Terminé';
    return timeleft;
  };

  const getProgress = (size, sizeleft) => {
    if (!size || size === 0) return 100;
    const progress = ((size - sizeleft) / size) * 100;
    return Math.max(0, Math.min(100, progress));
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
          <p>Movies you download will appear here</p>
        </div>
      ) : (
        <div className="queue-list">
          {queue.map((item) => {
            const statusInfo = getStatusBadge(item);
            const progress = getProgress(item.size, item.sizeleft);

            return (
              <div key={item.id} className="queue-item">
                <div className="queue-item-header">
                  <h3 className="queue-item-title">{item.title}</h3>
                  <span className={`status-badge ${statusInfo.class}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="queue-item-info">
                  <div className="info-row">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{formatSize(item.size)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Time left:</span>
                    <span className="info-value">{formatTimeLeft(item.timeleft)}</span>
                  </div>
                  {item.protocol && (
                    <div className="info-row">
                      <span className="info-label">Protocol:</span>
                      <span className="info-value">{item.protocol}</span>
                    </div>
                  )}
                  {item.downloadClient && (
                    <div className="info-row">
                      <span className="info-label">Client:</span>
                      <span className="info-value">{item.downloadClient}</span>
                    </div>
                  )}
                </div>

                {item.size > 0 && (
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
