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
  const previousContent = useRef({});

  useEffect(() => {
    const storedUrls = JSON.parse(localStorage.getItem('monitoredUrls')) || [];
    setMonitoredUrls(storedUrls);
  }, []);

  useEffect(() => {
    localStorage.setItem('monitoredUrls', JSON.stringify(monitoredUrls));
  }, [monitoredUrls]);

  const addUrlToMonitor = () => {
    if (newUrl && !monitoredUrls.some((item) => item.url === newUrl)) {
      setMonitoredUrls([...monitoredUrls, { url: newUrl, interval: defaultInterval, isMonitoring: false }]);
      setNewUrl('');
    }
  };

  const fetchPageContent = async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
  
      // Extract meaningful text (ignore scripts, styles, and metadata)
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      
      // Get only visible text content
      const visibleText = doc.body.innerText.replace(/\s+/g, ' ').trim();
  
      return visibleText;
    } catch (error) {
      console.error("Error fetching URL:", error);
      return null;
    }
  };
  
  const getDiff = (oldText, newText) => {
    const oldWords = oldText.split(" ");
    const newWords = newText.split(" ");
    let diffStart = 0;
  
    while (diffStart < oldWords.length && diffStart < newWords.length && oldWords[diffStart] === newWords[diffStart]) {
      diffStart++;
    }
  
    const oldDiff = oldWords.slice(diffStart, diffStart + 20).join(" ");
    const newDiff = newWords.slice(diffStart, diffStart + 20).join(" ");
  
    return { oldDiff, newDiff };
  };
  
  const checkForUpdates = async (url) => {
    const newContent = await fetchPageContent(url);
  
    if (newContent && previousContent.current[url] && previousContent.current[url] !== newContent) {
      const { oldDiff, newDiff } = getDiff(previousContent.current[url], newContent);
  
      setAlerts([
        ...alerts,
        {
          message: `Update detected on ${url}`,
          old: `Old: ${oldDiff}...`,
          new: `New: ${newDiff}...`,
        },
      ]);
    }
  
    previousContent.current[url] = newContent;
  };
  

  const startMonitoringUrl = (urlToMonitor) => {
    setMonitoredUrls(monitoredUrls.map((item) => item.url === urlToMonitor ? { ...item, isMonitoring: true } : item));
    monitoringIntervals.current[urlToMonitor] = setInterval(() => checkForUpdates(urlToMonitor), defaultInterval);
  };

  const stopMonitoringUrl = (urlToStop) => {
    setMonitoredUrls(monitoredUrls.map((item) => item.url === urlToStop ? { ...item, isMonitoring: false } : item));
    clearInterval(monitoringIntervals.current[urlToStop]);
    delete monitoringIntervals.current[urlToStop];
  };

  useEffect(() => {
    Object.keys(monitoringIntervals.current).forEach((url) => checkForUpdates(url));
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center', fontFamily: 'Arial, sans-serif', p: 4, borderRadius: 3 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="outlined" sx={{ p: 4, mb: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 3, backdropFilter: 'blur(15px)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Webpage Monitor</Typography>
          <TextField fullWidth label="URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} sx={{ mt: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          <TextField fullWidth label="Interval (ms)" type="number" value={defaultInterval} onChange={(e) => setDefaultInterval(parseInt(e.target.value, 10))} sx={{ mt: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          <Select fullWidth value={alertType} onChange={(e) => setAlertType(e.target.value)} sx={{ mt: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
            <MenuItem value="notification">Browser Notification</MenuItem>
            <MenuItem value="in-app">In-App Message</MenuItem>
            <MenuItem value="sound">Sound</MenuItem>
          </Select>
          <Button variant="contained" onClick={addUrlToMonitor} sx={{ width: '100%', mt: 3, background: 'linear-gradient(90deg, #ff4081, #ff79b0)', color: '#fff', fontSize: '1.2rem', p: 1.5, borderRadius: 3 }}>Add URL</Button>
        </Card>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="outlined" sx={{ p: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 3, backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>Currently Monitoring</Typography>
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
                  <IconButton color="error" onClick={() => setMonitoredUrls(monitoredUrls.filter((i) => i.url !== item.url))}><Delete /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Card>
      </motion.div>

      <Snackbar open={alerts.length > 0} autoHideDuration={10000} onClose={() => setAlerts([])}>
  <Alert severity="warning">
    {alerts.length > 0 && (
      <>
        <Typography variant="body1">{alerts[alerts.length - 1].message}</Typography>
        <Typography variant="body2" sx={{ color: 'red' }}>{alerts[alerts.length - 1].old}</Typography>
        <Typography variant="body2" sx={{ color: 'green' }}>{alerts[alerts.length - 1].new}</Typography>
      </>
    )}
  </Alert>
</Snackbar>

    </Container>
  );
}

export default PageMonitor;
