import { supabase } from './supabase';
import { storage } from './storage';
import { 
  Memory, 
  LoveNote, 
  Milestone, 
  Countdown, 
  BucketListItem, 
  DailyQuestion,
  NoteType,
  HeartMessage,
  AppNotification
} from '../types';
import { isUuid, generateUuid, generateInviteCode } from './utils';

// Helper to check if current environment is using a remote Supabase couple
export const isRemoteCouple = (coupleId?: string | null): boolean => {
  return Boolean(coupleId && isUuid(coupleId));
};

// Helper to resolve partner ID from couple room
export const resolvePartnerIdAsync = async (coupleId: string, senderId: string): Promise<string | null> => {
  if (!isRemoteCouple(coupleId)) return null;
  try {
    const { data } = await supabase
      .from('couples')
      .select('member_ids')
      .eq('id', coupleId)
      .maybeSingle();

    if (data?.member_ids && Array.isArray(data.member_ids)) {
      const partnerId = data.member_ids.find((id: string) => id !== senderId);
      return partnerId || null;
    }
  } catch (err) {
    console.warn('Error resolving partner ID:', err);
  }
  return null;
};

// ==========================================
// 1. MEMORIES SERVICE (SHARED ROOM PHOTOS & STRIPS)
// ==========================================

export const roomService = {
  // Fetch memories with Supabase as source of truth, fallback to room-scoped storage cache
  fetchMemories: async (coupleId?: string | null): Promise<Memory[]> => {
    if (!coupleId) {
      return storage.getMemories(null);
    }

    if (!isRemoteCouple(coupleId)) {
      return storage.getMemories(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching memories from Supabase, using cache:', error.message);
        return storage.getMemories(coupleId);
      }

      if (data) {
        const memories: Memory[] = data.map((row: any) => ({
          id: row.id,
          couple_id: row.couple_id,
          created_by: row.couple_id,
          creator_name: 'Pasangan',
          title: row.title || 'Kenangan Bersama',
          caption: row.caption || '',
          media_url: row.media_url,
          media_type: (row.media_type as 'image' | 'usframe_strip') || 'image',
          date: row.memory_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          location: row.location || undefined,
          category: row.category || 'Kencan',
          is_favorite: Boolean(row.is_favorite),
          created_at: row.created_at || new Date().toISOString()
        }));

        storage.setMemories(memories, coupleId);
        return memories;
      }
    } catch (err) {
      console.warn('Supabase fetch memories error:', err);
    }

    return storage.getMemories(coupleId);
  },

  createMemory: async (memory: {
    coupleId: string;
    uploaderId: string;
    receiverId?: string;
    creatorName?: string;
    title: string;
    caption: string;
    location?: string;
    mediaUrl: string;
    mediaType?: 'image' | 'usframe_strip';
    category?: string;
    isFavorite?: boolean;
    date?: string;
  }): Promise<Memory> => {
    const isRemote = isRemoteCouple(memory.coupleId);
    const newId = isRemote ? generateUuid() : 'mem_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const dateStr = memory.date || createdAt.split('T')[0];

    let finalMediaUrl = memory.mediaUrl;
    let storagePath: string | undefined = undefined;

    // 1. Upload to Supabase Cloud Storage if mediaUrl is a local dataURL or Blob
    if (isRemote && (memory.mediaUrl.startsWith('data:') || memory.mediaUrl.startsWith('blob:'))) {
      try {
        const uploadResult = await (await import('./cloudStorage')).cloudStorage.uploadMemoryImage(
          memory.mediaUrl,
          memory.coupleId,
          memory.mediaType === 'usframe_strip' ? 'strip' : 'photo'
        );
        finalMediaUrl = uploadResult.publicUrl;
        storagePath = uploadResult.storagePath;
      } catch (uploadErr: any) {
        console.warn('Direct bucket upload failed, using optimized media URL for cloud persistence:', uploadErr.message);
        finalMediaUrl = memory.mediaUrl;
      }
    }

    const newMemory: Memory = {
      id: newId,
      couple_id: memory.coupleId,
      created_by: memory.uploaderId,
      creator_name: memory.creatorName,
      title: memory.title,
      caption: memory.caption,
      media_url: finalMediaUrl,
      storage_path: storagePath,
      media_type: memory.mediaType || 'image',
      date: dateStr,
      location: memory.location,
      category: memory.category || 'Kencan',
      is_favorite: Boolean(memory.isFavorite),
      created_at: createdAt
    };

    if (isRemote) {
      try {
        const { error } = await supabase
          .from('memories')
          .insert([{
            id: newId,
            couple_id: memory.coupleId,
            title: memory.title,
            caption: memory.caption,
            location: memory.location || null,
            media_url: finalMediaUrl,
            media_type: memory.mediaType || 'image',
            category: memory.category || 'Kencan',
            is_favorite: Boolean(memory.isFavorite),
            memory_date: dateStr
          }])
          .select()
          .maybeSingle();

        if (error) {
          console.error('Failed to sync memory to Supabase:', error);
          throw new Error('Gagal menyimpan memori ke database server: ' + error.message);
        }

        // 2. Save to room-scoped local cache ONLY AFTER cloud persistence succeeds
        storage.addMemory(newMemory, memory.coupleId);

        // 3. Deliver personal notification to partner
        const targetReceiverId = memory.receiverId || (await resolvePartnerIdAsync(memory.coupleId, memory.uploaderId));
        if (targetReceiverId) {
          await roomService.createNotification({
            roomId: memory.coupleId,
            senderId: memory.uploaderId,
            senderName: memory.creatorName,
            receiverId: targetReceiverId,
            type: 'photo_shared',
            title: `📸 Foto Kenangan Baru (${memory.creatorName || 'Pasangan'})`,
            body: memory.title || 'Foto baru ditambahkan ke Brankas Kenangan.',
            referenceId: newId
          }).catch(() => null);
        }

        // Broadcast realtime notification to room partner
        const channel = supabase.channel(`couple_room_${memory.coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'memory', memoryId: newId, uploaderId: memory.uploaderId }
        }).catch(() => null);

      } catch (err: any) {
        console.error('Supabase createMemory network error:', err);
        throw err;
      }
    } else {
      storage.addMemory(newMemory, memory.coupleId);
    }

    // Award Couple Streak & Pet XP
    if (memory.coupleId) {
      import('./streakService').then(({ streakService }) => {
        streakService.recordActivity(memory.coupleId, 'memory_added', memory.uploaderId).catch(() => null);
      });
    }

    return newMemory;
  },

  toggleMemoryFavorite: async (id: string, isFavorite: boolean, coupleId?: string | null): Promise<void> => {
    const list = storage.getMemories(coupleId);
    const updated = list.map(m => m.id === id ? { ...m, is_favorite: isFavorite } : m);
    storage.setMemories(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('memories')
          .update({ is_favorite: isFavorite })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase toggleMemoryFavorite error:', err);
      }
    }
  },

  deleteMemory: async (id: string, coupleId?: string | null): Promise<void> => {
    const list = storage.getMemories(coupleId);
    const target = list.find(m => m.id === id);
    const updated = list.filter(m => m.id !== id);
    storage.setMemories(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('memories')
          .delete()
          .eq('id', id);

        if (target?.storage_path) {
          (await import('./cloudStorage')).cloudStorage.deleteFile('memories', target.storage_path).catch(() => null);
        }

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'memory_deleted', memoryId: id }
        }).catch(() => null);
      } catch (err) {
        console.error('Supabase deleteMemory error:', err);
      }
    }
  },

  subscribeToMemories: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_memories_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type === 'memory' || payload.payload?.type === 'memory_deleted') {
          onUpdate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 2. LOVE NOTES & LETTERS SERVICE (SHARED ROOM LETTERS)
  // ==========================================

  fetchLoveNotes: async (coupleId?: string | null): Promise<LoveNote[]> => {
    if (!coupleId || !isRemoteCouple(coupleId)) {
      return storage.getLoveNotes(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('love_letters')
        .select('*, profiles:sender_id(name)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching love letters from Supabase:', error.message);
        return storage.getLoveNotes(coupleId);
      }

      if (data) {
        const notes: LoveNote[] = data.map((row: any) => ({
          id: row.id,
          couple_id: row.couple_id,
          sender_id: row.sender_id,
          sender_name: row.profiles?.name || 'Pasangan',
          title: row.title,
          content: row.content,
          note_type: 'general',
          unlock_date: null,
          is_opened: Boolean(row.is_opened),
          created_at: row.created_at || new Date().toISOString()
        }));

        storage.setLoveNotes(notes, coupleId);
        return notes;
      }
    } catch (err) {
      console.warn('Supabase fetch love notes error:', err);
    }

    return storage.getLoveNotes(coupleId);
  },

  createLoveNote: async (note: {
    coupleId: string;
    senderId: string;
    receiverId?: string;
    senderName?: string;
    title: string;
    content: string;
    noteType: NoteType;
    unlockDate?: string | null;
  }): Promise<LoveNote> => {
    const isRemote = isRemoteCouple(note.coupleId);
    const newId = isRemote ? generateUuid() : 'note_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    const newNote: LoveNote = {
      id: newId,
      couple_id: note.coupleId,
      sender_id: note.senderId,
      sender_name: note.senderName || 'Pasangan',
      title: note.title,
      content: note.content,
      note_type: note.noteType,
      unlock_date: note.unlockDate || null,
      is_opened: false,
      created_at: createdAt
    };

    if (isRemote) {
      try {
        const { error } = await supabase
          .from('love_letters')
          .insert([{
            id: newId,
            couple_id: note.coupleId,
            sender_id: note.senderId,
            title: note.title,
            content: note.content,
            is_opened: false
          }]);

        if (error) {
          console.error('Supabase createLoveNote error:', error);
          throw new Error('Gagal menyimpan surat cinta: ' + error.message);
        }

        storage.addLoveNote(newNote, note.coupleId);

        // Deliver personal notification to partner inbox
        const targetReceiverId = note.receiverId || (await resolvePartnerIdAsync(note.coupleId, note.senderId));
        if (targetReceiverId) {
          await roomService.createNotification({
            roomId: note.coupleId,
            senderId: note.senderId,
            senderName: note.senderName,
            receiverId: targetReceiverId,
            type: 'love_letter',
            title: `💌 Surat Cinta Baru (${note.senderName || 'Pasangan'})`,
            body: note.title,
            referenceId: newId
          }).catch(() => null);
        }

        // Broadcast to partner
        const channel = supabase.channel(`couple_room_${note.coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'love_letter_received',
          payload: { 
            letterId: newId, 
            senderId: note.senderId, 
            senderName: note.senderName, 
            title: note.title 
          }
        }).catch(() => null);

      } catch (err: any) {
        console.error('Supabase createLoveNote error:', err);
        throw err;
      }
    } else {
      storage.addLoveNote(newNote, note.coupleId);
    }

    // Award Couple Streak & Pet XP
    if (note.coupleId) {
      import('./streakService').then(({ streakService }) => {
        streakService.recordActivity(note.coupleId, 'letter_sent', note.senderId).catch(() => null);
      });
    }

    return newNote;
  },

  markLoveNoteOpened: async (id: string, coupleId?: string | null): Promise<void> => {
    const list = storage.getLoveNotes(coupleId);
    const updated = list.map(n => n.id === id ? { ...n, is_opened: true } : n);
    storage.setLoveNotes(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('love_letters')
          .update({ is_opened: true })
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'letter_opened', letterId: id }
        }).catch(() => null);
      } catch (err) {
        console.error('Supabase markLoveNoteOpened error:', err);
      }
    }
  },

  deleteLoveNote: async (id: string, coupleId?: string | null): Promise<void> => {
    const list = storage.getLoveNotes(coupleId);
    const updated = list.filter(n => n.id !== id);
    storage.setLoveNotes(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('love_letters')
          .delete()
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'letter_deleted', letterId: id }
        }).catch(() => null);
      } catch (err) {
        console.error('Supabase deleteLoveNote error:', err);
      }
    }
  },

  subscribeToLoveNotes: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_letters_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'love_letters',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .on('broadcast', { event: 'love_letter_received' }, () => {
        onUpdate();
      })
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type?.startsWith('letter')) {
          onUpdate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 3. HEART MESSAGES & PULSE HISTORY (SHARED ROOM KANGEN)
  // ==========================================

  fetchHeartMessages: async (coupleId?: string | null): Promise<HeartMessage[]> => {
    if (!coupleId || !isRemoteCouple(coupleId)) {
      return storage.getHeartMessages(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('heart_notes')
        .select('*, profiles:sender_id(name)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching heart notes from Supabase:', error.message);
        return storage.getHeartMessages(coupleId);
      }

      if (data) {
        const msgs: HeartMessage[] = data.map((row: any) => ({
          id: row.id,
          couple_id: row.couple_id,
          sender_id: row.sender_id,
          sender_name: row.profiles?.name || 'Pasangan',
          content: row.note || row.content || 'Aku kangen kamu 🤍',
          mood_emoji: '🤍',
          created_at: row.created_at || new Date().toISOString()
        }));

        storage.setHeartMessages(msgs, coupleId);
        return msgs;
      }
    } catch (err) {
      console.warn('Supabase fetchHeartMessages error:', err);
    }

    return storage.getHeartMessages(coupleId);
  },

  createHeartMessage: async (msg: {
    coupleId: string;
    senderId: string;
    receiverId?: string;
    senderName?: string;
    content: string;
    moodEmoji?: string;
  }): Promise<HeartMessage> => {
    const isRemote = isRemoteCouple(msg.coupleId);
    const newId = isRemote ? generateUuid() : 'msg_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    const newMsg: HeartMessage = {
      id: newId,
      couple_id: msg.coupleId,
      sender_id: msg.senderId,
      sender_name: msg.senderName || 'Kamu',
      content: msg.content,
      mood_emoji: msg.moodEmoji || '🤍',
      created_at: createdAt
    };

    if (isRemote) {
      try {
        // 1. Insert into shared room heart_notes table (shared history with column "note")
        const { error } = await supabase
          .from('heart_notes')
          .insert([{
            id: newId,
            couple_id: msg.coupleId,
            sender_id: msg.senderId,
            category: 'heart_pulse',
            note: msg.content
          }]);

        if (error) {
          console.error('Supabase createHeartMessage error:', error);
          throw new Error('Gagal mengirim sinyal kangen: ' + error.message);
        }

        storage.addHeartMessage(newMsg, msg.coupleId);

        // 2. Deliver personal notification to receiver
        const targetReceiverId = msg.receiverId || (await resolvePartnerIdAsync(msg.coupleId, msg.senderId));
        if (targetReceiverId) {
          await roomService.createNotification({
            roomId: msg.coupleId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            receiverId: targetReceiverId,
            type: 'miss_you',
            title: `💌 ${msg.senderName || 'Pasanganmu'} Kangen Kamu 🤍`,
            body: msg.content,
            referenceId: newId
          }).catch(() => null);
        }
      } catch (err: any) {
        console.warn('Supabase createHeartMessage error:', err);
        throw err;
      }
    } else {
      storage.addHeartMessage(newMsg, msg.coupleId);
    }

    // Award Couple Streak & Pet XP
    if (msg.coupleId) {
      import('./streakService').then(({ streakService }) => {
        streakService.recordActivity(msg.coupleId, 'kangen', msg.senderId).catch(() => null);
      });
    }

    return newMsg;
  },

  subscribeToHeartMessages: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_heart_notes_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'heart_notes',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 4. TIMELINE / MILESTONES SERVICE (SHARED ROOM TIMELINE)
  // ==========================================

  fetchMilestones: async (coupleId?: string | null): Promise<Milestone[]> => {
    if (!coupleId || !isRemoteCouple(coupleId)) {
      return storage.getMilestones(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: true });

      if (error) {
        console.warn('Error fetching milestones from Supabase:', error.message);
        return storage.getMilestones(coupleId);
      }

      if (data) {
        const milestones: Milestone[] = data.map((row: any) => ({
          id: row.id,
          couple_id: row.couple_id,
          title: row.title,
          description: row.description || '',
          date: row.date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          location: row.location || undefined,
          image_url: row.image_url || undefined,
          category: row.category || 'dating',
          created_at: row.created_at || new Date().toISOString()
        }));

        storage.setMilestones(milestones, coupleId);
        return milestones;
      }
    } catch (err) {
      console.warn('Supabase fetch milestones error:', err);
    }

    return storage.getMilestones(coupleId);
  },

  createMilestone: async (m: {
    coupleId: string;
    title: string;
    description: string;
    date: string;
    location?: string;
    imageUrl?: string;
    category?: string;
  }): Promise<Milestone> => {
    const isRemote = isRemoteCouple(m.coupleId);
    const newId = isRemote ? generateUuid() : 'm_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    let finalImageUrl = m.imageUrl;
    if (isRemote && m.imageUrl && (m.imageUrl.startsWith('data:') || m.imageUrl.startsWith('blob:'))) {
      try {
        const uploadResult = await (await import('./cloudStorage')).cloudStorage.uploadMemoryImage(
          m.imageUrl,
          m.coupleId,
          'milestone'
        );
        finalImageUrl = uploadResult.publicUrl;
      } catch (err) {
        console.warn('Milestone image upload warning:', err);
      }
    }

    const newMilestone: Milestone = {
      id: newId,
      couple_id: m.coupleId,
      title: m.title,
      description: m.description,
      date: m.date,
      location: m.location,
      image_url: finalImageUrl,
      category: m.category || 'dating',
      created_at: createdAt
    };

    storage.addMilestone(newMilestone, m.coupleId);

    if (isRemote) {
      try {
        await supabase
          .from('milestones')
          .insert([{
            id: newId,
            couple_id: m.coupleId,
            title: m.title,
            description: m.description,
            date: m.date,
            location: m.location || null,
            image_url: finalImageUrl || null,
            category: m.category || 'dating'
          }]);

        const channel = supabase.channel(`couple_room_${m.coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'milestone', milestoneId: newId }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase createMilestone error:', err);
      }
    }

    return newMilestone;
  },

  deleteMilestone: async (id: string, coupleId?: string | null): Promise<void> => {
    const list = storage.getMilestones(coupleId);
    const updated = list.filter(m => m.id !== id);
    storage.setMilestones(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('milestones')
          .delete()
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'milestone_deleted', milestoneId: id }
        }).catch(() => null);
      } catch (err) {
        console.error('Supabase deleteMilestone error:', err);
      }
    }
  },

  subscribeToMilestones: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_milestones_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type?.startsWith('milestone')) {
          onUpdate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 5. COUNTDOWNS SERVICE (SHARED ROOM COUNTDOWNS)
  // ==========================================

  fetchCountdowns: async (coupleId?: string | null): Promise<Countdown[]> => {
    if (!coupleId || !isRemoteCouple(coupleId)) {
      return storage.getCountdowns(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('countdowns')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching countdowns from Supabase:', error.message);
        return storage.getCountdowns(coupleId);
      }

      if (data) {
        const countdowns: Countdown[] = data.map((row: any) => ({
          id: row.id,
          couple_id: row.couple_id,
          title: row.title,
          target_date: row.target_date,
          icon: row.icon || '✈️',
          category: row.category || 'meet',
          is_pinned: Boolean(row.is_pinned),
          created_by: row.created_by || '',
          created_at: row.created_at || new Date().toISOString()
        }));

        storage.setCountdowns(countdowns, coupleId);
        return countdowns;
      }
    } catch (err) {
      console.warn('Supabase fetch countdowns error:', err);
    }

    return storage.getCountdowns(coupleId);
  },

  createCountdown: async (c: {
    coupleId: string;
    createdBy?: string;
    title: string;
    targetDate: string;
    icon?: string;
    category?: string;
    isPinned?: boolean;
  }): Promise<Countdown> => {
    const isRemote = isRemoteCouple(c.coupleId);
    const newId = isRemote ? generateUuid() : 'count_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    const newCountdown: Countdown = {
      id: newId,
      couple_id: c.coupleId,
      title: c.title,
      target_date: c.targetDate,
      icon: c.icon || '✈️',
      category: c.category || 'meet',
      is_pinned: Boolean(c.isPinned),
      created_by: c.createdBy || '',
      created_at: createdAt
    };

    storage.addCountdown(newCountdown, c.coupleId);

    if (isRemote) {
      try {
        if (c.isPinned) {
          await supabase
            .from('countdowns')
            .update({ is_pinned: false })
            .eq('couple_id', c.coupleId);
        }

        await supabase
          .from('countdowns')
          .insert([{
            id: newId,
            couple_id: c.coupleId,
            created_by: isUuid(c.createdBy) ? c.createdBy : null,
            title: c.title,
            target_date: c.targetDate,
            icon: c.icon || '✈️',
            category: c.category || 'meet',
            is_pinned: Boolean(c.isPinned)
          }]);

        const channel = supabase.channel(`couple_room_${c.coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'countdown', countdownId: newId }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase createCountdown error:', err);
      }
    }

    return newCountdown;
  },

  pinCountdown: async (id: string, coupleId?: string | null): Promise<void> => {
    const list = storage.getCountdowns(coupleId);
    const updated = list.map(c => ({ ...c, is_pinned: c.id === id }));
    storage.setCountdowns(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('countdowns')
          .update({ is_pinned: false })
          .eq('couple_id', coupleId);

        await supabase
          .from('countdowns')
          .update({ is_pinned: true })
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'countdown_pinned', countdownId: id }
        }).catch(() => null);
      } catch (err) {
        console.error('Supabase pinCountdown error:', err);
      }
    }
  },

  deleteCountdown: async (id: string, coupleId?: string | null): Promise<void> => {
    const list = storage.getCountdowns(coupleId);
    const updated = list.filter(c => c.id !== id);
    storage.setCountdowns(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('countdowns')
          .delete()
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'countdown_deleted', countdownId: id }
        }).catch(() => null);
      } catch (err) {
        console.error('Supabase deleteCountdown error:', err);
      }
    }
  },

  subscribeToCountdowns: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_countdowns_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'countdowns',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type?.startsWith('countdown')) {
          onUpdate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 6. BUCKET LIST SERVICE (SHARED ROOM BUCKET LIST)
  // ==========================================

  fetchBucketList: async (coupleId?: string | null): Promise<BucketListItem[]> => {
    if (!coupleId || !isRemoteCouple(coupleId)) {
      return storage.getBucketList(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('bucket_list_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching bucket list from Supabase:', error.message);
        return storage.getBucketList(coupleId);
      }

      if (data) {
        const items: BucketListItem[] = data.map((row: any) => ({
          id: row.id,
          couple_id: row.couple_id,
          title: row.title,
          category: row.category || 'trip',
          completed: Boolean(row.completed),
          target_location: row.target_location || undefined,
          completed_at: row.completed_at || null,
          created_by: row.created_by || ''
        }));

        storage.setBucketList(items, coupleId);
        return items;
      }
    } catch (err) {
      console.warn('Supabase fetch bucket list error:', err);
    }

    return storage.getBucketList(coupleId);
  },

  createBucketListItem: async (item: {
    coupleId: string;
    createdBy?: string;
    title: string;
    category?: 'trip' | 'food' | 'activity' | 'future' | string;
    targetLocation?: string;
  }): Promise<BucketListItem> => {
    const isRemote = isRemoteCouple(item.coupleId);
    const newId = isRemote ? generateUuid() : 'b_' + Math.random().toString(36).substring(2, 9);

    const newItem: BucketListItem = {
      id: newId,
      couple_id: item.coupleId,
      title: item.title,
      category: item.category || 'trip',
      completed: false,
      target_location: item.targetLocation || undefined,
      completed_at: null,
      created_by: item.createdBy || ''
    };

    const current = storage.getBucketList(item.coupleId);
    storage.setBucketList([...current, newItem], item.coupleId);

    if (isRemote) {
      try {
        await supabase
          .from('bucket_list_items')
          .insert([{
            id: newId,
            couple_id: item.coupleId,
            created_by: isUuid(item.createdBy) ? item.createdBy : null,
            title: item.title,
            category: item.category || 'trip',
            completed: false,
            target_location: item.targetLocation || null
          }]);

        const channel = supabase.channel(`couple_room_${item.coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'bucket_item', itemId: newId }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase createBucketListItem error:', err);
      }
    }

    // Award Couple Streak & Pet XP
    if (item.coupleId) {
      import('./streakService').then(({ streakService }) => {
        streakService.recordActivity(item.coupleId, 'bucket_item', item.createdBy).catch(() => null);
      });
    }

    return newItem;
  },

  toggleBucketListItem: async (id: string, completed: boolean, coupleId?: string | null): Promise<void> => {
    const dateStr = completed ? new Date().toISOString().split('T')[0] : null;
    const current = storage.getBucketList(coupleId);
    const updated = current.map(item => item.id === id ? { ...item, completed, completed_at: dateStr } : item);
    storage.setBucketList(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('bucket_list_items')
          .update({
            completed,
            completed_at: dateStr
          })
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'bucket_item_toggled', itemId: id, completed }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase toggleBucketListItem error:', err);
      }
    }
  },

  deleteBucketListItem: async (id: string, coupleId?: string | null): Promise<void> => {
    const current = storage.getBucketList(coupleId);
    const updated = current.filter(item => item.id !== id);
    storage.setBucketList(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('bucket_list_items')
          .delete()
          .eq('id', id);

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'bucket_item_deleted', itemId: id }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase deleteBucketListItem error:', err);
      }
    }
  },

  subscribeToBucketList: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_bucket_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bucket_list_items',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type?.startsWith('bucket')) {
          onUpdate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 7. DAILY QUESTIONS SERVICE (SHARED ROOM PROMPTS)
  // ==========================================

  fetchDailyQuestion: async (coupleId?: string | null, dateStr?: string): Promise<DailyQuestion> => {
    const today = dateStr || new Date().toISOString().split('T')[0];

    const localDq = storage.getDailyQuestion(coupleId);
    let mergedAnswers: Record<string, { userName: string; answer: string; answeredAt: string }> = {
      ...(localDq?.answers || {})
    };

    if (coupleId && isRemoteCouple(coupleId)) {
      try {
        // 1. Fetch answers stored from all couple members' profiles in cloud DB
        const { data: members } = await supabase
          .from('profiles')
          .select('id, name, status_activity')
          .eq('couple_id', coupleId);

        if (members && members.length > 0) {
          for (const m of members) {
            if (m.status_activity && m.status_activity.startsWith('DQ:')) {
              try {
                const parsed = JSON.parse(m.status_activity.substring(3));
                if (parsed.date === today && parsed.answer) {
                  mergedAnswers[m.id] = {
                    userName: m.name || 'Pasangan',
                    answer: parsed.answer,
                    answeredAt: parsed.answeredAt || new Date().toISOString()
                  };
                }
              } catch {}
            }
          }
        }

        // 2. Also try fetching from daily_questions table if present
        const { data: tableData } = await supabase
          .from('daily_questions')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('question_date', today)
          .maybeSingle();

        if (tableData?.answers) {
          mergedAnswers = {
            ...mergedAnswers,
            ...tableData.answers
          };
        }
      } catch (err) {
        console.warn('Supabase fetch daily question sync warning:', err);
      }
    }

    const finalDq: DailyQuestion = {
      id: localDq?.id || 'dq_' + today,
      couple_id: coupleId || 'couple_main',
      date: today,
      question: localDq?.question || 'Hal kecil apa dari pasanganmu yang paling kamu syukuri hari ini?',
      answers: mergedAnswers
    };

    storage.setDailyQuestion(finalDq, coupleId);
    return finalDq;
  },

  submitDailyQuestionAnswer: async (
    coupleId: string,
    userId: string,
    userName: string,
    answer: string,
    questionText?: string,
    dateStr?: string
  ): Promise<DailyQuestion> => {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const isRemote = isRemoteCouple(coupleId);

    // Fetch existing answers first to merge seamlessly without overwriting partner
    const existing = await roomService.fetchDailyQuestion(coupleId, today);
    const updatedAnswers = {
      ...(existing.answers || {}),
      [userId]: {
        userName,
        answer: answer.trim(),
        answeredAt: new Date().toISOString()
      }
    };

    const updatedDq: DailyQuestion = {
      ...existing,
      couple_id: coupleId,
      date: today,
      question: questionText || existing.question || 'Hal kecil apa dari pasanganmu yang paling kamu syukuri hari ini?',
      answers: updatedAnswers
    };

    storage.setDailyQuestion(updatedDq, coupleId);

    if (isRemote) {
      try {
        // 1. Save user's answer into profiles.status_activity in cloud DB (100% persistent cross-device)
        const dqPayload = 'DQ:' + JSON.stringify({
          date: today,
          answer: answer.trim(),
          answeredAt: new Date().toISOString()
        });

        await supabase
          .from('profiles')
          .update({ status_activity: dqPayload })
          .eq('id', userId);

        // 2. Also try daily_questions table if accessible
        try {
          await supabase
            .from('daily_questions')
            .upsert({
              couple_id: coupleId,
              question_date: today,
              question: updatedDq.question,
              answers: updatedAnswers
            }, { onConflict: 'couple_id,question_date' });
        } catch {}

        // 3. Broadcast instant Realtime sync to partner's screen
        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'daily_question_sync',
          payload: {
            coupleId,
            userId,
            userName,
            dailyQuestion: updatedDq
          }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase submitDailyQuestionAnswer error:', err);
      }
    }

    // Award Couple Streak & Pet XP
    if (coupleId) {
      import('./streakService').then(({ streakService }) => {
        streakService.recordActivity(coupleId, 'daily_question', userId).catch(() => null);
      });
    }

    return updatedDq;
  },

  subscribeToDailyQuestions: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`couple_room_${coupleId}`)
      .on('broadcast', { event: 'daily_question_sync' }, (payload) => {
        if (payload.payload?.dailyQuestion) {
          const remoteDq = payload.payload.dailyQuestion;
          const currentLocal = storage.getDailyQuestion(coupleId);
          const mergedAnswers = {
            ...(currentLocal?.answers || {}),
            ...(remoteDq.answers || {})
          };
          const mergedDq = {
            ...remoteDq,
            answers: mergedAnswers
          };
          storage.setDailyQuestion(mergedDq, coupleId);
          onUpdate();
        }
      })
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type?.startsWith('daily_question')) {
          onUpdate();
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 8. PERSONAL USER NOTIFICATIONS (INBOX)
  // ==========================================

  createNotification: async (notif: {
    roomId: string;
    senderId: string;
    senderName?: string;
    receiverId: string;
    type: string;
    title: string;
    body: string;
    referenceId?: string;
  }): Promise<AppNotification | null> => {
    if (!notif.receiverId || notif.senderId === notif.receiverId) return null;
    const isRemote = isRemoteCouple(notif.roomId) && isUuid(notif.receiverId);
    const newId = isRemote ? generateUuid() : 'notif_' + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();

    const newNotif: AppNotification = {
      id: newId,
      room_id: notif.roomId,
      sender_id: notif.senderId,
      sender_name: notif.senderName || 'Pasangan',
      receiver_id: notif.receiverId,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      reference_id: notif.referenceId,
      is_read: false,
      created_at: createdAt
    };

    if (isRemote) {
      try {
        await supabase
          .from('notifications')
          .insert([{
            id: newId,
            room_id: notif.roomId,
            sender_id: notif.senderId,
            receiver_id: notif.receiverId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            reference_id: notif.referenceId || null,
            is_read: false
          }]);
      } catch (err) {
        console.warn('Supabase createNotification error:', err);
      }
    }

    return newNotif;
  },

  fetchUserNotifications: async (userId?: string | null): Promise<AppNotification[]> => {
    if (!userId || !isUuid(userId)) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles:sender_id(name)')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.warn('Error fetching notifications:', error.message);
        return [];
      }

      if (data) {
        return data.map((row: any) => ({
          id: row.id,
          room_id: row.room_id,
          sender_id: row.sender_id,
          sender_name: row.profiles?.name || 'Pasangan',
          receiver_id: row.receiver_id,
          type: row.type,
          title: row.title,
          body: row.body,
          reference_id: row.reference_id,
          is_read: Boolean(row.is_read),
          created_at: row.created_at || new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchUserNotifications error:', err);
    }

    return [];
  },

  markNotificationRead: async (id: string): Promise<void> => {
    if (!isUuid(id)) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase markNotificationRead error:', err);
    }
  },

  subscribeToUserNotifications: (userId: string | null | undefined, onNotification: (notif: AppNotification) => void) => {
    if (!userId || !isUuid(userId)) return () => {};

    const channel = supabase
      .channel(`realtime_user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`
        },
        async (payload: any) => {
          const row = payload.new;
          if (row) {
            let senderName = 'Pasangan';
            try {
              const { data: p } = await supabase.from('profiles').select('name').eq('id', row.sender_id).maybeSingle();
              if (p?.name) senderName = p.name;
            } catch {}

            const notifItem: AppNotification = {
              id: row.id,
              room_id: row.room_id,
              sender_id: row.sender_id,
              sender_name: senderName,
              receiver_id: row.receiver_id,
              type: row.type,
              title: row.title,
              body: row.body,
              reference_id: row.reference_id,
              is_read: Boolean(row.is_read),
              created_at: row.created_at
            };

            onNotification(notifItem);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 9. SERVER-VALIDATED UNIQUE INVITE CODE
  // ==========================================

  generateUniqueInviteCodeAsync: async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = generateInviteCode();
      
      const localCouples = storage.getCouplesDB();
      const existsLocal = Object.values(localCouples).some(
        c => c.invite_code?.toUpperCase() === code.toUpperCase()
      );

      if (existsLocal) {
        attempts++;
        continue;
      }

      try {
        const { data, error } = await supabase
          .from('couples')
          .select('id')
          .eq('invite_code', code.toUpperCase())
          .maybeSingle();

        if (!error && !data) {
          return code;
        }
      } catch (err) {
        return code;
      }

      attempts++;
    }

    return generateInviteCode();
  }
};
