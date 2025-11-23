import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { GetApp } from '@mui/icons-material';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  return (
    <Snackbar
      open={showInstallPrompt}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity="info"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleInstallClick}
            startIcon={<GetApp />}
          >
            Install App
          </Button>
        }
      >
        Install KABISA Enterprise for quick access!
      </Alert>
    </Snackbar>
  );
};

export default InstallPrompt;