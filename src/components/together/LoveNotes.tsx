import React, { useState } from 'react';
import { LoveNote, NoteType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../lib/storage';
import { roomService } from '../../lib/roomService';
import { formatDatePretty } from '../../lib/utils';
import { Mail, Lock, Unlock, PenLine } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../layout/Modal';
import { Input, Textarea } from '../ui/Input';

interface LoveNotesProps {
  notes: LoveNote[];
  onUpdate: () => void;
}

export const LoveNotes: React.FC<LoveNotesProps> = ({ notes, onUpdate }) => {
  const { user, partner, couple } = useAuth();
  const { success } = useToast();

  const [selectedNote, setSelectedNote] = useState<LoveNote | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('general');

  const handleOpenNote = async (note: LoveNote) => {
    setSelectedNote(note);
    if (!note.is_opened) {
      await roomService.markLoveNoteOpened(note.id, couple?.id);
      onUpdate();
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    await roomService.createLoveNote({
      coupleId: couple?.id || 'couple_main',
      senderId: user?.id || 'user_me',
      senderName: user?.name || 'Kai',
      title,
      content,
      noteType,
      unlockDate: null
    });

    success(`Surat cinta terkirim ke ${partner?.name || 'pasanganmu'}! 💌`);
    setIsCreateOpen(false);
    setTitle('');
    setContent('');
    onUpdate();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Love Letters & Open When</h3>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Intimate letters, reminders, and "open when" notes left for each other.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} variant="primary" size="md" className="w-full sm:w-auto">
          <PenLine className="w-4 h-4 mr-1.5" />
          <span>Write Letter</span>
        </Button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {notes.map(note => {
          return (
            <div
              key={note.id}
              onClick={() => handleOpenNote(note)}
              className="bg-surface border border-border rounded-3xl p-4 sm:p-5 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group active:scale-[0.99]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider">
                    {note.note_type.replace(/_/g, ' ')}
                  </span>
                  <span className="p-1.5 rounded-lg bg-surface-subtle text-foreground-muted">
                    {note.is_opened ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-terracotta-500" />}
                  </span>
                </div>

                <h4 className="font-serif text-base sm:text-lg font-semibold text-foreground group-hover:text-terracotta-600 transition-colors">
                  {note.title}
                </h4>

                <p className="text-xs text-foreground-muted line-clamp-3 leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-foreground-subtle">
                <span>From <strong>{note.sender_name}</strong></span>
                <span>{formatDatePretty(note.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Read Note Modal */}
      <Modal
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        maxWidth="lg"
      >
        {selectedNote && (
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <span className="text-xs font-semibold text-terracotta-600 dark:text-terracotta-400 uppercase tracking-wider">
                {selectedNote.note_type.replace(/_/g, ' ')}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mt-1">
                {selectedNote.title}
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                From {selectedNote.sender_name} • {formatDatePretty(selectedNote.created_at)}
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-terracotta-50/40 dark:bg-terracotta-950/30 border border-terracotta-200/60 dark:border-terracotta-800/60 font-serif text-sm sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap">
              {selectedNote.content}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => setSelectedNote(null)} className="w-full sm:w-auto">
                Close Note
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Write Letter Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Write a Love Letter"
        subtitle="Leave a surprise message for your partner to open."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateNote} className="space-y-3.5">
          <Input
            label="Letter Title"
            placeholder="e.g. Open when you miss me, Midnight thought from Tokyo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Letter Category
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as NoteType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-terracotta-500"
            >
              <option value="general">General Love Letter</option>
              <option value="open_when_miss">Open When You Miss Me</option>
              <option value="open_when_sad">Open When You Have a Hard Day</option>
              <option value="anniversary">Anniversary Note</option>
            </select>
          </div>

          <Textarea
            label="Letter Content"
            placeholder="Pour your thoughts and feelings here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
          />

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!title || !content}>
              Seal & Send Letter
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
