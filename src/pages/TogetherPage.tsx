import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { roomService } from '../lib/roomService';
import { DailyQuestion } from '../components/together/DailyQuestion';
import { LoveNotes } from '../components/together/LoveNotes';
import { MoodTracker } from '../components/together/MoodTracker';
import { BucketList } from '../components/together/BucketList';
import { CountdownManager } from '../components/together/CountdownManager';
import { MessageCircle, Mail, Smile, Compass, Clock } from 'lucide-react';

export const TogetherPage: React.FC = () => {
  const { couple } = useAuth();
  const [activeTab, setActiveTab] = useState<'prompt' | 'notes' | 'mood' | 'bucket' | 'countdowns'>('prompt');

  const [dailyQuestion, setDailyQuestion] = useState(() => storage.getDailyQuestion());
  const [notes, setNotes] = useState(() => storage.getLoveNotes());
  const [bucketList, setBucketList] = useState(() => storage.getBucketList());
  const [countdowns, setCountdowns] = useState(() => storage.getCountdowns());

  const refreshAll = useCallback(async () => {
    const [freshDq, freshNotes, freshBucket, freshCounts] = await Promise.all([
      roomService.fetchDailyQuestion(couple?.id),
      roomService.fetchLoveNotes(couple?.id),
      roomService.fetchBucketList(couple?.id),
      roomService.fetchCountdowns(couple?.id)
    ]);
    setDailyQuestion(freshDq);
    setNotes(freshNotes);
    setBucketList(freshBucket);
    setCountdowns(freshCounts);
  }, [couple?.id]);

  useEffect(() => {
    refreshAll();

    const unsubLetters = roomService.subscribeToLoveNotes(couple?.id, refreshAll);
    const unsubDq = roomService.subscribeToDailyQuestions(couple?.id, refreshAll);
    const unsubBucket = roomService.subscribeToBucketList(couple?.id, refreshAll);
    const unsubCounts = roomService.subscribeToCountdowns(couple?.id, refreshAll);

    return () => {
      unsubLetters();
      unsubDq();
      unsubBucket();
      unsubCounts();
    };
  }, [refreshAll, couple?.id]);

  const tabs = [
    { id: 'prompt', label: 'Daily Prompt', icon: MessageCircle },
    { id: 'notes', label: 'Love Letters', icon: Mail },
    { id: 'mood', label: 'Mood & Presence', icon: Smile },
    { id: 'bucket', label: 'Bucket List', icon: Compass },
    { id: 'countdowns', label: 'Countdowns', icon: Clock },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in max-w-5xl mx-auto">
      
      {/* Subnavigation Bar with Mobile Horizontal Scroll */}
      <div className="flex p-1 sm:p-1.5 bg-surface border border-border rounded-2xl sm:rounded-3xl shadow-soft overflow-x-auto no-scrollbar gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[110px] sm:min-w-[120px] py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-terracotta-500 text-white shadow-sm'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'prompt' && (
        <DailyQuestion
          dailyQuestion={dailyQuestion}
          onUpdate={refreshAll}
        />
      )}

      {activeTab === 'notes' && (
        <LoveNotes
          notes={notes}
          onUpdate={refreshAll}
        />
      )}

      {activeTab === 'mood' && (
        <MoodTracker />
      )}

      {activeTab === 'bucket' && (
        <BucketList
          items={bucketList}
          onUpdate={refreshAll}
        />
      )}

      {activeTab === 'countdowns' && (
        <CountdownManager
          countdowns={countdowns}
          onUpdate={refreshAll}
        />
      )}

    </div>
  );
};
