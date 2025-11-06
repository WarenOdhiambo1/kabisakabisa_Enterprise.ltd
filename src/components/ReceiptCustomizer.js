import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ColorPicker
} from '@mui/material';
import { Print, Palette, Save } from '@mui/icons-material';

const ReceiptCustomizer = () => {
  const [settings, setSettings] = useState({
    companyName: 'BSN MANAGER',
    logo: '',
    primaryColor: '#1976d2',
    secondaryColor: '#f5f5f5',
    fontFamily: 'Arial',
    fontSize: '12px',
    showLogo: true,
    showBorder: true,
    paperSize: 'A4'
  });

  const [previewData] = useState({
    receiptNo: 'RCP-001',
    date: new Date().toLocaleDateString(),
    customer: 'Walk-in Customer',
    items: [
      { name: 'Product A', qty: 2, price: 500, total: 1000 },
      { name: 'Product B', qty: 1, price: 750, total: 750 }
    ],
    subtotal: 1750,
    tax: 280,
    total: 2030
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateReceiptHTML = () => {
    return `
      <div style="
        font-family: ${settings.fontFamily};
        font-size: ${settings.fontSize};
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
        border: ${settings.showBorder ? '2px solid ' + settings.primaryColor : 'none'};
        background: white;
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: ${settings.primaryColor}; margin: 0;">${settings.companyName}</h2>
          <p style="margin: 5px 0;">Official Receipt</p>
        </div>
        
        <div style="background: ${settings.secondaryColor}; padding: 10px; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span>Receipt No:</span>
            <strong>${previewData.receiptNo}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Date:</span>
            <span>${previewData.date}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Customer:</span>
            <span>${previewData.customer}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background: ${settings.primaryColor}; color: white;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
              <th style="padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${previewData.items.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;">${item.name}</td>
                <td style="padding: 8px; text-align: center;">${item.qty}</td>
                <td style="padding: 8px; text-align: right;">KSH ${item.price}</td>
                <td style="padding: 8px; text-align: right;">KSH ${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="border-top: 2px solid ${settings.primaryColor}; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Subtotal:</span>
            <span>KSH ${previewData.subtotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>VAT (16%):</span>
            <span>KSH ${previewData.tax}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 16px; color: ${settings.primaryColor};">
            <span>TOTAL:</span>
            <span>KSH ${previewData.total}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #666;">
          <p>Thank you for your business!</p>
          <p>Powered by BSN Manager</p>
        </div>
      </div>
    `;
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Receipt Preview</title></head>
        <body>${generateReceiptHTML()}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Receipt Customizer
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customization Settings
              </Typography>

              <TextField
                fullWidth
                label="Company Name"
                value={settings.companyName}
                onChange={(e) => handleSettingChange('companyName', e.target.value)}
                margin="normal"
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth margin="normal">
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={settings.fontFamily}
                  onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                >
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                  <MenuItem value="Courier New">Courier New</MenuItem>
                  <MenuItem value="Helvetica">Helvetica</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Font Size</InputLabel>
                <Select
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                >
                  <MenuItem value="10px">Small (10px)</MenuItem>
                  <MenuItem value="12px">Medium (12px)</MenuItem>
                  <MenuItem value="14px">Large (14px)</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={() => localStorage.setItem('receiptSettings', JSON.stringify(settings))}
                >
                  Save Settings
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={printReceipt}
                >
                  Print Preview
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Receipt Preview
              </Typography>
              <Paper 
                sx={{ 
                  p: 2, 
                  minHeight: 400,
                  border: '1px solid #ddd'
                }}
                dangerouslySetInnerHTML={{ __html: generateReceiptHTML() }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReceiptCustomizer;