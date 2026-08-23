import React, { useState } from 'react';
import { Modal } from '../layout/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PetType, CouplePet } from '../../types';
import { PET_DEFINITIONS } from '../../lib/petConstants';
import { Sparkles, Check, Heart } from 'lucide-react';

interface PetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: CouplePet;
  onSave: (params: { name: string; type: PetType }) => Promise<void>;
}

export const PetCustomizerModal: React.FC<PetCustomizerModalProps> = ({
  isOpen,
  onClose,
  pet,
  onSave
}) => {
  const [name, setName] = useState(pet.name);
  const [selectedType, setSelectedType] = useState<PetType>(pet.type);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type: selectedType
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const petTypes = Object.values(PET_DEFINITIONS);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Peliharaan Cinta Kita 🐾"
      subtitle="Pilih karakter dan beri nama untuk hewan peliharaan bersama kalian."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Character Type Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Pilih Karakter Peliharaan
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {petTypes.map((item) => {
              const isSelected = selectedType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(item.type);
                    if (name === pet.name || !name.trim()) {
                      setName(item.defaultName);
                    }
                  }}
                  className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 ${
                    isSelected
                      ? 'bg-terracotta-50/60 dark:bg-terracotta-950/40 border-terracotta-500 ring-2 ring-terracotta-500/20 shadow-xs'
                      : 'bg-surface border-border hover:border-border-focus'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl animate-bounce-subtle">{item.avatarEmoji}</span>
                  <span className="text-xs font-bold text-foreground">{item.defaultName}</span>
                  <span className="text-[10px] text-foreground-muted line-clamp-1">{item.description}</span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-terracotta-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pet Name Input */}
        <Input
          label="Nama Panggilan Peliharaan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="contoh: Mochi, Piyo, Lulu, Boba"
          required
          helperText={`Karakter saat ini: ${PET_DEFINITIONS[selectedType]?.avatarEmoji} ${PET_DEFINITIONS[selectedType]?.defaultName}`}
        />

        {/* Save Button */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSaving || !name.trim()}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan ✨'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
