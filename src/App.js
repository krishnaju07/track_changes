import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Select, MenuItem, Card, Typography, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Snackbar, Alert } from '@mui/material';
import { Delete, PlayArrow, Stop } from '@mui/icons-material';
import { motion } from 'framer-motion';

function PageMonitor() {
  const [monitoredUrls, setMonitoredUrls] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [defaultInterval, setDefaultInterval] = useState(5000);
  const [alertType, setAlertType] = useState('notification');
  const [alerts, setAlerts] = useState([]);
  const monitoringIntervals = useRef({});
  const previousContents = useRef({});

  useEffect(() => {
    const storedUrls = JSON.parse(localStorage.getItem('monitoredUrls')) || [];
    setMonitoredUrls(storedUrls);
  }, []);

  useEffect(() => {
    localStorage.setItem('monitoredUrls', JSON.stringify(monitoredUrls));
  }, [monitoredUrls]);

  const handleNewUrlChange = (event) => setNewUrl(event.target.value);
  const handleIntervalChange = (event) => setDefaultInterval(parseInt(event.target.value, 10) || 5000);
  const handleAlertTypeChange = (event) => setAlertType(event.target.value);

  const addUrlToMonitor = () => {
    if (newUrl && !monitoredUrls.some((item) => item.url === newUrl)) {
      setMonitoredUrls([...monitoredUrls, { url: newUrl, interval: defaultInterval, isMonitoring: false }]);
      setNewUrl('');
    } else {
      alert('URL already monitored or empty');
    }
  };

  const removeUrl = (urlToRemove) => {
    stopMonitoringUrl(urlToRemove);
    setMonitoredUrls(monitoredUrls.filter((item) => item.url !== urlToRemove));
    delete monitoringIntervals.current[urlToRemove];
    delete previousContents.current[urlToRemove];
  };

  const startMonitoringUrl = (urlToMonitor) => {
    const updatedUrls = monitoredUrls.map((item) => item.url === urlToMonitor ? { ...item, isMonitoring: true } : item);
    setMonitoredUrls(updatedUrls);
    monitoringIntervals.current[urlToMonitor] = setInterval(() => fetchPageContent(urlToMonitor), defaultInterval);
    navigator.serviceWorker.register('/service-worker.js');
    navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage({ action: 'startMonitoring', url: urlToMonitor, interval: defaultInterval });
    });
  };

  const stopMonitoringUrl = (urlToStop) => {
    setMonitoredUrls(monitoredUrls.map((item) => item.url === urlToStop ? { ...item, isMonitoring: false } : item));
    clearInterval(monitoringIntervals.current[urlToStop]);
    delete monitoringIntervals.current[urlToStop];
    navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage({ action: 'stopMonitoring', url: urlToStop });
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#fff', background: 'linear-gradient(135deg, #1f1c2c, #928dab)', p: 4, borderRadius: 2 }}>
      <Card variant="outlined" sx={{ p: 4, mb: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Webpage Monitor</Typography>
        <TextField fullWidth label="URL" value={newUrl} onChange={handleNewUrlChange} sx={{ mb: 2, background: '#fff', borderRadius: 1 }} />
        <TextField fullWidth label="Interval (ms)" type="number" value={defaultInterval} onChange={handleIntervalChange} sx={{ mb: 2, background: '#fff', borderRadius: 1 }} />
        <Select fullWidth value={alertType} onChange={handleAlertTypeChange} sx={{ mb: 2, background: '#fff', borderRadius: 1 }}>
          <MenuItem value="notification">Browser Notification</MenuItem>
          <MenuItem value="in-app">In-App Message</MenuItem>
          <MenuItem value="sound">Sound</MenuItem>
        </Select>
        <Button variant="contained" onClick={addUrlToMonitor} sx={{ width: '100%', background: '#ff4081', color: '#fff', fontSize: '1.2rem', p: 1.5, borderRadius: 2 }}>Add URL</Button>
      </Card>
      <Card variant="outlined" sx={{ p: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Currently Monitoring</Typography>
        <List>
          {monitoredUrls.map((item) => (
            <ListItem key={item.url} component={motion.div} whileHover={{ scale: 1.05 }} sx={{ mb: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <ListItemText primary={item.url} secondary={item.isMonitoring ? 'Monitoring' : 'Paused'} />
              <ListItemSecondaryAction>
                {item.isMonitoring ? (
                  <IconButton color="secondary" onClick={() => stopMonitoringUrl(item.url)}><Stop /></IconButton>
                ) : (
                  <IconButton color="primary" onClick={() => startMonitoringUrl(item.url)}><PlayArrow /></IconButton>
                )}
                <IconButton color="error" onClick={() => removeUrl(item.url)}><Delete /></IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Card>
      <Snackbar open={alerts.length > 0} autoHideDuration={6000} onClose={() => setAlerts([])}>
        <Alert severity="warning">{alerts.length > 0 && alerts[alerts.length - 1].message}</Alert>
      </Snackbar>
    </Container>
  );
}

export default PageMonitor;
