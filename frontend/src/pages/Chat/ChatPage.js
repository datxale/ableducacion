import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Forum, Send } from '@mui/icons-material';

import axiosInstance from '../../api/axios';
import Footer from '../../components/Layout/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const ChatPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadContacts = async (query = '') => {
    try {
      setLoadingContacts(true);
      const response = await axiosInstance.get('/chat/contacts', { params: query.trim() ? { search: query.trim() } : undefined });
      const items = response.data || [];
      setContacts(items);
      setSelectedContact((current) => {
        if (!current) return items[0] || null;
        return items.find((item) => item.id === current.id) || items[0] || null;
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los contactos del chat.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadMessages = async (contactId) => {
    if (!contactId) return;
    try {
      setLoadingMessages(true);
      const response = await axiosInstance.get(`/chat/messages/${contactId}`);
      setMessages(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los mensajes.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadContacts(search);
    const interval = setInterval(() => loadContacts(search), 12000);
    return () => clearInterval(interval);
  }, [search]);

  useEffect(() => {
    if (!selectedContact?.id) return undefined;
    loadMessages(selectedContact.id);
    const interval = setInterval(() => loadMessages(selectedContact.id), 5000);
    return () => clearInterval(interval);
  }, [selectedContact?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!selectedContact?.id || !draft.trim()) return;
    try {
      setSending(true);
      await axiosInstance.post('/chat/messages', {
        recipient_id: selectedContact.id,
        content: draft.trim(),
      });
      setDraft('');
      loadMessages(selectedContact.id);
      loadContacts(search);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const selectedContactMeta = useMemo(
    () => contacts.find((item) => item.id === selectedContact?.id) || selectedContact,
    [contacts, selectedContact]
  );

  if (loadingContacts && !contacts.length) {
    return <LoadingSpinner message="Cargando chat..." />;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #00897b 0%, #26a69a 100%)', py: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ background: 'rgba(255,255,255,0.2)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
              <Forum sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#fff' }}>
                Chat interno
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.88)' }}>
                Conversacion directa entre estudiantes, docentes y administracion.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid #eef1f5' }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Contactos</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar contacto..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Box>
              <List sx={{ p: 1 }}>
                {contacts.length === 0 ? (
                  <Typography sx={{ p: 2.5 }} color="text.secondary">No hay contactos disponibles.</Typography>
                ) : contacts.map((contact) => (
                  <ListItemButton
                    key={contact.id}
                    selected={selectedContact?.id === contact.id}
                    onClick={() => setSelectedContact(contact)}
                    sx={{ borderRadius: '16px', mb: 0.5, alignItems: 'flex-start' }}
                  >
                    <Avatar sx={{ mr: 1.5, bgcolor: '#00897b', width: 38, height: 38 }}>
                      {contact.full_name?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <ListItemText
                      primary={<Typography fontWeight={700}>{contact.full_name}</Typography>}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {contact.last_message || contact.email}
                          </Typography>
                          {!!contact.unread_count && (
                            <Typography variant="caption" sx={{ color: '#e91e63', fontWeight: 800 }}>
                              {contact.unread_count} sin leer
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', minHeight: 620 }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid #eef1f5', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#1976d2' }}>
                  {selectedContactMeta?.full_name?.[0]?.toUpperCase() || 'C'}
                </Avatar>
                <Box>
                  <Typography fontWeight={800}>
                    {selectedContactMeta?.full_name || 'Selecciona un contacto'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedContactMeta?.email || 'Escoge a quien deseas escribir'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flexGrow: 1, p: 2.5, overflowY: 'auto', background: 'linear-gradient(180deg, #f8fffe 0%, #f9fbff 100%)' }}>
                {loadingMessages && !messages.length ? (
                  <LoadingSpinner message="Cargando mensajes..." />
                ) : !selectedContact ? (
                  <Typography color="text.secondary">Selecciona un contacto para iniciar una conversacion.</Typography>
                ) : messages.length === 0 ? (
                  <Typography color="text.secondary">Todavia no hay mensajes. Puedes iniciar la conversacion.</Typography>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    return (
                      <Box key={message.id} sx={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', mb: 1.5 }}>
                        <Box
                          sx={{
                            maxWidth: '78%',
                            px: 2,
                            py: 1.5,
                            borderRadius: isOwn ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                            bgcolor: isOwn ? '#1976d2' : '#fff',
                            color: isOwn ? '#fff' : '#10213a',
                            boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
                          }}
                        >
                          <Typography sx={{ whiteSpace: 'pre-line' }}>{message.content}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.72, display: 'block', mt: 0.75 }}>
                            {new Date(message.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </Box>

              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder={selectedContact ? 'Escribe tu mensaje...' : 'Selecciona un contacto'}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!selectedContact || sending}
                />
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={sendMessage}
                  disabled={!selectedContact || !draft.trim() || sending}
                  sx={{ borderRadius: '16px', px: 3 }}
                >
                  Enviar
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default ChatPage;
