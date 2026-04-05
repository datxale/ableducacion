import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  AudioFile,
  CheckCircle,
  CloudUpload,
  Close,
  FolderOpen,
  InsertDriveFile,
  PictureAsPdf,
  Search,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { listUploadedAssets, uploadFile } from '../../utils/uploads';

const getAssetName = (asset) =>
  asset?.original_filename || asset?.filename || asset?.stored_filename || asset?.url?.split('/').pop() || 'Archivo';

const getAssetKey = (asset) => String(asset?.id || asset?.asset_id || asset?.url || getAssetName(asset));

const normalizeSelectedAssets = (assets = []) =>
  assets
    .filter((asset) => asset?.url)
    .map((asset) => ({
      ...asset,
      original_filename: getAssetName(asset),
      media_kind: asset.media_kind || 'file',
    }));

const formatBytes = (value) => {
  if (!value || Number.isNaN(Number(value))) return '';
  const size = Number(value);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const ACCEPT_BY_MEDIA_KIND = {
  image: 'image/*',
  video: 'video/*,.mp4,.webm,.mov,.m4v,.avi,.ogg',
  pdf: '.pdf,application/pdf',
  audio: 'audio/*',
  document: '.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt',
  file: '',
};

const buildUploadAccept = (allowedMediaKinds = []) => {
  if (!allowedMediaKinds.length || allowedMediaKinds.includes('all') || allowedMediaKinds.includes('file')) {
    return undefined;
  }

  const acceptValues = allowedMediaKinds
    .map((kind) => ACCEPT_BY_MEDIA_KIND[kind])
    .filter(Boolean);

  return acceptValues.length ? acceptValues.join(',') : undefined;
};

const getUploadErrorMessage = (err, fallback) => {
  const statusCode = err?.response?.status;
  const detail = err?.response?.data?.detail;

  if (statusCode === 413) {
    return 'El archivo excede el limite permitido por el servidor. Intenta nuevamente en unos segundos.';
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return fallback;
};

const renderAssetPreview = (asset) => {
  if (!asset?.url) {
    return <InsertDriveFile sx={{ fontSize: 42, color: '#607d8b' }} />;
  }

  if (asset.media_kind === 'image') {
    return (
      <Box
        component="img"
        src={asset.url}
        alt={getAssetName(asset)}
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  if (asset.media_kind === 'video') {
    return (
      <Box
        component="video"
        src={asset.url}
        muted
        playsInline
        sx={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
      />
    );
  }

  if (asset.media_kind === 'pdf') {
    return <PictureAsPdf sx={{ fontSize: 42, color: '#d32f2f' }} />;
  }

  if (asset.media_kind === 'audio') {
    return <AudioFile sx={{ fontSize: 42, color: '#6a1b9a' }} />;
  }

  return <InsertDriveFile sx={{ fontSize: 42, color: '#607d8b' }} />;
};

const AssetLibraryDialog = ({
  open,
  onClose,
  onSelect,
  title = 'Biblioteca de archivos',
  category = 'general',
  categoryOptions = [],
  multiple = false,
  selectedAssets = [],
  allowedMediaKinds = ['all'],
  helperText = '',
}) => {
  const { isAdmin } = useAuth();

  const normalizedCategoryOptions = useMemo(() => {
    const options = categoryOptions.length > 0
      ? categoryOptions
      : [{ value: category, label: category }];
    const hasAll = options.some((option) => option.value === 'all');
    return hasAll ? options : [{ value: 'all', label: 'Todas' }, ...options];
  }, [category, categoryOptions]);

  const mediaKindOptions = useMemo(() => {
    const baseOptions = [
      { value: 'all', label: 'Todos' },
      { value: 'image', label: 'Imagenes' },
      { value: 'video', label: 'Videos' },
      { value: 'pdf', label: 'PDF' },
      { value: 'document', label: 'Documentos' },
      { value: 'file', label: 'Archivos' },
    ];

    if (allowedMediaKinds.includes('all')) {
      return baseOptions;
    }

    return baseOptions.filter((option) => allowedMediaKinds.includes(option.value));
  }, [allowedMediaKinds]);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(category || 'all');
  const [mediaFilter, setMediaFilter] = useState(
    allowedMediaKinds.length === 1 && !allowedMediaKinds.includes('all')
      ? allowedMediaKinds[0]
      : 'all'
  );
  const [selectedMap, setSelectedMap] = useState({});

  useEffect(() => {
    if (!open) return;
    setCategoryFilter(category || 'all');
    setMediaFilter(
      allowedMediaKinds.length === 1 && !allowedMediaKinds.includes('all')
        ? allowedMediaKinds[0]
        : 'all'
    );
    setSearch('');
    setError('');
    const normalized = normalizeSelectedAssets(selectedAssets);
    setSelectedMap(Object.fromEntries(normalized.map((asset) => [getAssetKey(asset), asset])));
  }, [allowedMediaKinds, category, open, selectedAssets]);

  const fetchAssets = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError('');
    try {
      const nextAssets = await listUploadedAssets({
        category: categoryFilter || 'all',
        search: search.trim() || undefined,
        media_kind: mediaFilter || 'all',
      });
      setAssets(nextAssets);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar la biblioteca de archivos.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, mediaFilter, open, search]);

  useEffect(() => {
    if (!open) return;
    fetchAssets();
  }, [fetchAssets, open]);

  const visibleAssets = useMemo(() => {
    if (!search.trim()) return assets;
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => getAssetName(asset).toLowerCase().includes(term));
  }, [assets, search]);

  const selectedAssetsList = useMemo(
    () => Object.values(selectedMap),
    [selectedMap]
  );

  const previewAsset = selectedAssetsList[0] || visibleAssets[0] || null;
  const uploadAccept = useMemo(() => buildUploadAccept(allowedMediaKinds), [allowedMediaKinds]);

  const uploadCategory = useMemo(() => {
    if (categoryFilter && categoryFilter !== 'all') return categoryFilter;
    return category || normalizedCategoryOptions.find((option) => option.value !== 'all')?.value || 'general';
  }, [category, categoryFilter, normalizedCategoryOptions]);

  const handleToggleAsset = (asset) => {
    const key = getAssetKey(asset);
    if (multiple) {
      setSelectedMap((current) => {
        if (current[key]) {
          const nextState = { ...current };
          delete nextState[key];
          return nextState;
        }
        return { ...current, [key]: asset };
      });
      return;
    }

    setSelectedMap({ [key]: asset });
  };

  const handleUploadFiles = async (files) => {
    const validFiles = Array.from(files || []);
    if (validFiles.length === 0) return;

    setUploading(true);
    setError('');
    try {
      const uploadedAssets = [];
      for (const file of validFiles) {
        const uploaded = await uploadFile(file, uploadCategory);
        uploadedAssets.push({
          ...uploaded,
          original_filename: uploaded.filename,
          media_kind: uploaded.media_kind,
        });
      }

      await fetchAssets();

      const nextMap = multiple
        ? {
            ...selectedMap,
            ...Object.fromEntries(uploadedAssets.map((asset) => [getAssetKey(asset), asset])),
          }
        : { [getAssetKey(uploadedAssets[uploadedAssets.length - 1])]: uploadedAssets[uploadedAssets.length - 1] };

      setSelectedMap(nextMap);
    } catch (err) {
      setError(getUploadErrorMessage(err, 'No se pudo subir el archivo.'));
    } finally {
      setUploading(false);
      setDragging(false);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    await handleUploadFiles(event.dataTransfer.files);
  };

  const handleConfirm = () => {
    onSelect(selectedAssetsList);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography fontWeight={800}>{title}</Typography>
          {helperText ? (
            <Typography variant="body2" color="text.secondary">
              {helperText}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: '18px',
                borderStyle: 'dashed',
                borderColor: dragging ? '#1976d2' : '#cfd8dc',
                background: dragging ? '#e3f2fd' : '#fafafa',
                textAlign: 'center',
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={handleDrop}
            >
              <CloudUpload sx={{ fontSize: 38, color: dragging ? '#1976d2' : '#90a4ae', mb: 1 }} />
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                Arrastra archivos aqui o subelos a la biblioteca
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {multiple ? 'Puedes elegir varios archivos.' : 'Selecciona un archivo por vez.'}
              </Typography>
              {uploadAccept ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Tipos permitidos: {uploadAccept}
                </Typography>
              ) : null}
              <Button component="label" variant="contained" startIcon={<CloudUpload />} disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Subir archivo'}
                <input
                  hidden
                  type="file"
                  accept={uploadAccept}
                  multiple={multiple}
                  onChange={(event) => {
                    handleUploadFiles(event.target.files);
                    event.target.value = '';
                  }}
                />
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Buscar archivo"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Carpeta</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Carpeta"
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    {normalizedCategoryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={mediaFilter}
                    label="Tipo"
                    onChange={(event) => setMediaFilter(event.target.value)}
                  >
                    {mediaKindOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <FolderOpen sx={{ color: '#455a64' }} />
              <Typography fontWeight={800}>
                Biblioteca {loading ? '(cargando...)' : `(${visibleAssets.length})`}
              </Typography>
            </Box>
            {visibleAssets.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '18px', textAlign: 'center' }}>
                <Typography fontWeight={700}>No hay archivos para este filtro.</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sube uno nuevo o cambia la carpeta y el tipo.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {visibleAssets.map((asset) => {
                  const key = getAssetKey(asset);
                  const isSelected = Boolean(selectedMap[key]);
                  return (
                    <Grid item xs={12} sm={6} lg={4} key={key}>
                      <Paper
                        variant="outlined"
                        onClick={() => handleToggleAsset(asset)}
                        sx={{
                          p: 1.5,
                          borderRadius: '18px',
                          cursor: 'pointer',
                          borderColor: isSelected ? '#1976d2' : '#eceff1',
                          boxShadow: isSelected ? '0 0 0 2px rgba(25,118,210,0.16)' : 'none',
                        }}
                      >
                        <Box
                          sx={{
                            height: 120,
                            borderRadius: '14px',
                            overflow: 'hidden',
                            mb: 1.25,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f5f7fa',
                          }}
                        >
                          {renderAssetPreview(asset)}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                            {getAssetName(asset)}
                          </Typography>
                          {isSelected ? <CheckCircle sx={{ color: '#1976d2', fontSize: 18 }} /> : null}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                          <Chip size="small" label={asset.category} />
                          <Chip size="small" label={asset.media_kind} />
                          {asset.size_bytes ? <Chip size="small" label={formatBytes(asset.size_bytes)} /> : null}
                        </Box>
                        {isAdmin && asset.owner_name ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Subido por {asset.owner_name}
                          </Typography>
                        ) : null}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '18px', height: '100%' }}>
              <Typography fontWeight={800} sx={{ mb: 1.5 }}>
                Vista previa
              </Typography>
              {!previewAsset ? (
                <Typography variant="body2" color="text.secondary">
                  Selecciona un archivo para ver su detalle.
                </Typography>
              ) : (
                <>
                  <Box
                    sx={{
                      height: 180,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f7fa',
                    }}
                  >
                    {renderAssetPreview(previewAsset)}
                  </Box>
                  <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                    {getAssetName(previewAsset)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {previewAsset.url}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                    <Chip size="small" label={previewAsset.category} />
                    <Chip size="small" label={previewAsset.media_kind} />
                    {previewAsset.size_bytes ? <Chip size="small" label={formatBytes(previewAsset.size_bytes)} /> : null}
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => window.open(previewAsset.url, '_blank', 'noopener,noreferrer')}
                  >
                    Abrir archivo
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedAssetsList.length === 0}
        >
          {multiple
            ? `Usar ${selectedAssetsList.length} archivo${selectedAssetsList.length === 1 ? '' : 's'}`
            : 'Usar archivo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssetLibraryDialog;
