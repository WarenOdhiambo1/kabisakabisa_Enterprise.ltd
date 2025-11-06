import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  LinearProgress,
  Typography
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { documentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const QuickUpload = ({ defaultCategory = 'general', buttonText = 'Upload Document' }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    category: defaultCategory,
    description: '',
    tags: ''
  });

  const categories = [
    { value: 'tax_invoices', label: 'Tax Invoices' },
    { value: 'receipts', label: 'Receipts' },
    { value: 'delivery_notes', label: 'Delivery Notes' },
    { value: 'compliance_certificates', label: 'Certificates' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'financial_reports', label: 'Reports' },
    { value: 'employee_documents', label: 'Employee Docs' },
    { value: 'vehicle_documents', label: 'Vehicle Docs' },
    { value: 'general', label: 'General' }
  ];

  const uploadMutation = useMutation(
    (formData) => documentsAPI.uploadDocument(formData),
    {
      onSuccess: () => {
        toast.success('Document uploaded successfully!');
        handleClose();
        queryClient.invalidateQueries('documents');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Upload failed');
      }
    }
  );

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('category', uploadData.category);
    formData.append('description', uploadData.description);
    formData.append('tags', uploadData.tags);

    uploadMutation.mutate(formData);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFile(null);
    setUploadData({ category: defaultCategory, description: '', tags: '' });
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CloudUpload />}
        onClick={() => setOpen(true)}
        size="small"
      >
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Quick Upload</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              style={{ marginBottom: '16px', width: '100%' }}
            />
            
            {selectedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={uploadData.category}
                onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              margin="normal"
              value={uploadData.description}
              onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Tags"
              margin="normal"
              value={uploadData.tags}
              onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="invoice, important"
            />
          </Box>
          
          {uploadMutation.isLoading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploadMutation.isLoading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickUpload;