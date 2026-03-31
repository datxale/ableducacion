import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

import { detectNewsMediaKind, normalizeNewsBlocks } from '../../utils/news';

const gradientFallback = 'linear-gradient(135deg, #4ECDC4 0%, #2B7DE9 100%)';

export const NewsCoverMedia = ({
  item,
  height = 280,
  overlay = 'linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.45))',
  sx = {},
  children = null,
  autoPlay = true,
}) => {
  const mediaUrl = item?.image_url;
  const mediaKind = detectNewsMediaKind(mediaUrl, item?.cover_media_type);

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        overflow: 'hidden',
        background: gradientFallback,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...sx,
      }}
    >
      {mediaUrl && mediaKind === 'image' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${mediaUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      {mediaUrl && mediaKind === 'video' && (
        <Box
          component="video"
          src={mediaUrl}
          muted
          autoPlay={autoPlay}
          loop={autoPlay}
          playsInline
          controls={!autoPlay}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            background: '#000',
          }}
        />
      )}
      <Box sx={{ position: 'absolute', inset: 0, background: overlay }} />
      {children ? <Box sx={{ position: 'absolute', inset: 0 }}>{children}</Box> : null}
    </Box>
  );
};

export const NewsContentBlocks = ({ item }) => {
  const blocks = normalizeNewsBlocks(item?.content_blocks);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {item?.content && (
        <Typography sx={{ color: 'text.secondary', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
          {item.content}
        </Typography>
      )}

      {blocks.map((block, index) => {
        if (block.block_type === 'text') {
          return (
            <Typography key={`news-block-${index}`} sx={{ color: 'text.secondary', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {block.text}
            </Typography>
          );
        }

        if (block.block_type === 'image') {
          return (
            <Paper key={`news-block-${index}`} variant="outlined" sx={{ borderRadius: '22px', overflow: 'hidden', boxShadow: 'none' }}>
              <Box
                component="img"
                src={block.media_url}
                alt={block.caption || 'Imagen de noticia'}
                sx={{ width: '100%', display: 'block', background: '#f5f7fa' }}
              />
              {block.caption && (
                <Typography sx={{ p: 1.75, color: 'text.secondary', fontSize: '0.95rem' }}>
                  {block.caption}
                </Typography>
              )}
            </Paper>
          );
        }

        return (
          <Paper key={`news-block-${index}`} variant="outlined" sx={{ borderRadius: '22px', overflow: 'hidden', boxShadow: 'none' }}>
            <Box
              component="video"
              src={block.media_url}
              controls
              playsInline
              sx={{ width: '100%', display: 'block', background: '#000' }}
            />
            {block.caption && (
              <Typography sx={{ p: 1.75, color: 'text.secondary', fontSize: '0.95rem' }}>
                {block.caption}
              </Typography>
            )}
          </Paper>
        );
      })}
    </Box>
  );
};
