import React, { useState } from 'react';
import { DailyQuestion as DailyQuestionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../lib/storage';
import { MessageCircle, Heart, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../../lib/utils';

interface DailyQuestionProps {
  dailyQuestion: DailyQuestionType;
  onUpdate: () => void;
}

export const DailyQuestion: React.FC<DailyQuestionProps> = ({ dailyQuestion, onUpdate }) => {
  const { user, partner } = useAuth();
  const { success } = useToast();

  const [myAnswer, setMyAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = user?.id || 'user_kai';
  const partnerId = partner?.id || 'user_elena';

  const hasMyAnswer = !!dailyQuestion.answers[userId];
  const hasPartnerAnswer = !!dailyQuestion.answers[partnerId];
  const bothAnswered = hasMyAnswer && hasPartnerAnswer;

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    setIsSubmitting(true);
    const updated: DailyQuestionType = {
      ...dailyQuestion,
      answers: {
        ...dailyQuestion.answers,
        [userId]: {
          userName: user?.name || 'Kai',
          answer: myAnswer.trim(),
          answeredAt: new Date().toISOString()
        }
      }
    };

    storage.setDailyQuestion(updated);
    playSuccessChime();
    confetti({ particleCount: 30, spread: 50 });
    success('Answer shared with your partner! 🤍');
    setIsSubmitting(false);
    onUpdate();
  };

  return (
    <div className="bg-surface border border-border rounded-3xl p-4 sm:p-8 shadow-soft space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 sm:pb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 truncate">
          <span className="p-1.5 sm:p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500 shrink-0">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div className="truncate">
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground truncate">Daily Question</h3>
            <p className="text-[11px] sm:text-xs text-foreground-muted truncate">Answers unlock when both of you share.</p>
          </div>
        </div>

        <span className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full bg-surface-subtle border border-border font-medium text-foreground-muted shrink-0">
          {dailyQuestion.date}
        </span>
      </div>

      {/* The Question Prompt */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle/80 border border-border text-center space-y-1.5 sm:space-y-2">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-400">
          Today's Prompt
        </span>
        <h4 className="font-serif text-lg sm:text-2xl font-medium text-foreground max-w-xl mx-auto leading-snug sm:leading-relaxed">
          "{dailyQuestion.question}"
        </h4>
      </div>

      {/* Answer Form or Answers Reveal */}
      {!hasMyAnswer ? (
        <form onSubmit={handleSubmitAnswer} className="space-y-3">
          <Textarea
            label="Your Answer"
            placeholder="Write honestly from the heart..."
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isSubmitting || !myAnswer.trim()}>
              <Send className="w-4 h-4 mr-2" />
              <span>Share My Answer</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            
            {/* My Answer */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-terracotta-50/50 dark:bg-terracotta-950/40 border border-terracotta-200/80 dark:border-terracotta-800/80 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-terracotta-800 dark:text-terracotta-200">
                  {user?.name || 'You'}
                </span>
                <span className="text-[10px] text-foreground-subtle">Shared</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed italic">
                "{dailyQuestion.answers[userId]?.answer}"
              </p>
            </div>

            {/* Partner's Answer */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-subtle border border-border space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {partner?.name || 'Elena'}
                </span>
                <span className="text-[10px] text-foreground-subtle">
                  {hasPartnerAnswer ? 'Shared' : 'Thinking...'}
                </span>
              </div>

              {hasPartnerAnswer ? (
                <p className="text-xs sm:text-sm text-foreground leading-relaxed italic">
                  "{dailyQuestion.answers[partnerId]?.answer}"
                </p>
              ) : (
                <div className="py-3 text-center text-xs text-foreground-muted">
                  Waiting for {partner?.name || 'your partner'} to reply to unlock!
                </div>
              )}
            </div>

          </div>

          {bothAnswered && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs text-center font-medium flex items-center justify-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
              <span>Both answered! Another memory added to your journey.</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
