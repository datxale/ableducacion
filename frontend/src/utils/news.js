export const detectNewsMediaKind = (url, preferredType = '') => {
  if (preferredType === 'video' || preferredType === 'image') {
    return preferredType;
  }

  const lower = (url || '').toLowerCase().split('?')[0];
  if (
    lower.endsWith('.mp4')
    || lower.endsWith('.webm')
    || lower.endsWith('.mov')
    || lower.endsWith('.m4v')
    || lower.endsWith('.ogg')
  ) {
    return 'video';
  }

  return 'image';
};

export const createEmptyNewsBlock = (blockType = 'text') => ({
  block_type: blockType,
  text: '',
  media_url: '',
  caption: '',
});

export const normalizeNewsBlocks = (blocks) => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter((block) => block && typeof block === 'object')
    .map((block) => ({
      block_type: ['text', 'image', 'video'].includes(block.block_type) ? block.block_type : 'text',
      text: block.text || '',
      media_url: block.media_url || '',
      caption: block.caption || '',
    }));
};
