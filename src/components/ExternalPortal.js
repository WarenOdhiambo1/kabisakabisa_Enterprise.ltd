import React from 'react';
import { Container, Typography, Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const ExternalPortal = ({ url, title, onClose }) => {
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 2, height: 'calc(100vh - 120px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} color="primary">
          <Close />
        </IconButton>
      </Box>
      <Box sx={{ height: 'calc(100% - 60px)', border: '1px solid #ddd', borderRadius: 1 }}>
        <iframe
          src={url}
          width="100%"
          height="100%"
          frameBorder="0"
          title={title}
          style={{ borderRadius: '4px' }}
        />
      </Box>
    </Container>
  );
};

export default ExternalPortal;