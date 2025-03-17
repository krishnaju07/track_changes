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
      return text;
    } catch (error) {
      console.error('Error fetching URL:', error);
      return null;
    }
  };

  const sendTelegramAlert = (message) => {
    const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
    const chatId = 'YOUR_CHAT_ID';
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
  };

  const diffText = (oldText, newText) => {
    return `Old: ${oldText.substring(0, 100)}...\nNew: ${newText.substring(0, 100)}...`;
  };

  const checkForUpdates = async (url) => {
    const newContent = await fetchPageContent(url);
    if (newContent && previousContent.current[url] && previousContent.current[url] !== newContent) {
      const difference = diffText(previousContent.current[url], newContent);
      const alertMessage = `Update detected on ${url}\n${difference}`;
      setAlerts([...alerts, { message: alertMessage, old: previousContent.current[url], new: newContent }]);
      if (alertType === 'notification') {
        new Notification('Page Update', { body: alertMessage });
      } else if (alertType === 'telegram') {
        sendTelegramAlert(alertMessage);
      }
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
            <MenuItem value="telegram">Telegram Bot</MenuItem>
          </Select>
          <Button variant="contained" onClick={addUrlToMonitor} sx={{ width: '100%', mt: 3, background: 'linear-gradient(90deg, #ff4081, #ff79b0)', color: '#fff', fontSize: '1.2rem', p: 1.5, borderRadius: 3 }}>Add URL</Button>
        </Card>
      </motion.div>

      <Snackbar open={alerts.length > 0} autoHideDuration={6000} onClose={() => setAlerts([])}>
        <Alert severity="warning">{alerts.length > 0 && alerts[alerts.length - 1].message}</Alert>
      </Snackbar>
    </Container>
  );
}

export default PageMonitor;