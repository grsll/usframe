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
  HeartMessage
} from '../types';
import { isUuid, generateUuid, generateInviteCode } from './utils';

// Helper to check if current environment is using a remote Supabase couple
export const isRemoteCouple = (coupleId?: string | null): boolean => {
  return Boolean(coupleId && isUuid(coupleId));
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
        .select('*, profiles:uploader_id(name)')
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
          created_by: row.uploader_id,
          creator_name: row.profiles?.name || 'Pasangan',
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

    const newMemory: Memory = {
      id: newId,
      couple_id: memory.coupleId,
      created_by: memory.uploaderId,
      creator_name: memory.creatorName,
      title: memory.title,
      caption: memory.caption,
      media_url: memory.mediaUrl,
      media_type: memory.mediaType || 'image',
      date: dateStr,
      location: memory.location,
      category: memory.category || 'Kencan',
      is_favorite: Boolean(memory.isFavorite),
      created_at: createdAt
    };

    // Save to room-scoped local cache
    storage.addMemory(newMemory, memory.coupleId);

    if (isRemote) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .insert([{
            id: newId,
            couple_id: memory.coupleId,
            uploader_id: memory.uploaderId,
            title: memory.title,
            caption: memory.caption,
            location: memory.location || null,
            media_url: memory.mediaUrl,
            media_type: memory.mediaType || 'image',
            category: memory.category || 'Kencan',
            is_favorite: Boolean(memory.isFavorite),
            memory_date: dateStr
          }])
          .select('*, profiles:uploader_id(name)')
          .maybeSingle();

        if (error) {
          console.error('Failed to sync memory to Supabase:', error);
        } else if (data) {
          newMemory.creator_name = data.profiles?.name || memory.creatorName;
        }

        // Broadcast realtime notification to room partner
        const channel = supabase.channel(`couple_room_${memory.coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'memory', memoryId: newId, uploaderId: memory.uploaderId }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase createMemory network error:', err);
      }
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
    const updated = list.filter(m => m.id !== id);
    storage.setMemories(updated, coupleId);

    if (isRemoteCouple(coupleId) && isUuid(id)) {
      try {
        await supabase
          .from('memories')
          .delete()
          .eq('id', id);

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
          note_type: (row.letter_type as NoteType) || 'general',
          unlock_date: row.unlock_date || null,
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

    storage.addLoveNote(newNote, note.coupleId);

    if (isRemote) {
      try {
        await supabase
          .from('love_letters')
          .insert([{
            id: newId,
            couple_id: note.coupleId,
            sender_id: note.senderId,
            title: note.title,
            letter_type: note.noteType,
            content: note.content,
            unlock_date: note.unlockDate || null,
            is_opened: false
          }]);

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

      } catch (err) {
        console.error('Supabase createLoveNote error:', err);
      }
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
          content: row.content,
          mood_emoji: row.mood_emoji || '🤍',
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

    storage.addHeartMessage(newMsg, msg.coupleId);

    if (isRemote) {
      try {
        await supabase
          .from('heart_notes')
          .insert([{
            id: newId,
            couple_id: msg.coupleId,
            sender_id: msg.senderId,
            category: 'heart_pulse',
            mood_emoji: msg.moodEmoji || '🤍',
            content: msg.content,
            is_shared: true
          }]);
      } catch (err) {
        console.warn('Supabase createHeartMessage error:', err);
      }
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

    const newMilestone: Milestone = {
      id: newId,
      couple_id: m.coupleId,
      title: m.title,
      description: m.description,
      date: m.date,
      location: m.location,
      image_url: m.imageUrl,
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
            image_url: m.imageUrl || null,
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

    if (!coupleId || !isRemoteCouple(coupleId)) {
      return storage.getDailyQuestion(coupleId);
    }

    try {
      const { data, error } = await supabase
        .from('daily_questions')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('question_date', today)
        .maybeSingle();

      if (data) {
        const dq: DailyQuestion = {
          id: data.id,
          couple_id: data.couple_id,
          date: data.question_date,
          question: data.question,
          answers: data.answers || {}
        };
        storage.setDailyQuestion(dq, coupleId);
        return dq;
      } else {
        const localDq = storage.getDailyQuestion(coupleId);
        return localDq;
      }
    } catch (err) {
      console.warn('Supabase fetch daily question error:', err);
    }

    return storage.getDailyQuestion(coupleId);
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

    const current = storage.getDailyQuestion(coupleId);
    const updatedAnswers = {
      ...(current.answers || {}),
      [userId]: {
        userName,
        answer,
        answeredAt: new Date().toISOString()
      }
    };

    const updatedDq: DailyQuestion = {
      ...current,
      couple_id: coupleId,
      date: today,
      question: questionText || current.question || 'Hal kecil apa dari pasanganmu yang paling kamu syukuri hari ini?',
      answers: updatedAnswers
    };

    storage.setDailyQuestion(updatedDq, coupleId);

    if (isRemote) {
      try {
        await supabase
          .from('daily_questions')
          .upsert({
            couple_id: coupleId,
            question_date: today,
            question: updatedDq.question,
            answers: updatedAnswers
          }, { onConflict: 'couple_id,question_date' });

        const channel = supabase.channel(`couple_room_${coupleId}`);
        channel.send({
          type: 'broadcast',
          event: 'room_data_changed',
          payload: { type: 'daily_question_answered', userId, userName }
        }).catch(() => null);

      } catch (err) {
        console.error('Supabase submitDailyQuestionAnswer error:', err);
      }
    }

    return updatedDq;
  },

  subscribeToDailyQuestions: (coupleId: string | null | undefined, onUpdate: () => void) => {
    if (!isRemoteCouple(coupleId)) return () => {};

    const channel = supabase
      .channel(`realtime_dq_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_questions',
          filter: `couple_id=eq.${coupleId}`
        },
        () => {
          onUpdate();
        }
      )
      .on('broadcast', { event: 'room_data_changed' }, (payload) => {
        if (payload.payload?.type?.startsWith('daily_question')) {
          onUpdate();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ==========================================
  // 8. SERVER-VALIDATED UNIQUE INVITE CODE
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
