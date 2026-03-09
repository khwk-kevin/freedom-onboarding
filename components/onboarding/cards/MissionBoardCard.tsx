'use client';

import { useState } from 'react';

interface Mission {
  id: string;
  emoji: string;
  title: string;
  description: string;
  reward: string;
  rewardAmount: number;
  rewardUnit: string;
  type: 'daily' | 'weekly' | 'monthly' | 'milestone' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
  progress?: number; // 0-100 for demo
  xp: number;
}

interface MissionBoardCardProps {
  businessName: string;
  businessType?: string;
  primaryColor?: string;
  tokenName?: string;
  missions?: Mission[];
  onAccept?: () => void;
  onCustomize?: () => void;
}

const DEFAULT_MISSIONS: Record<string, Mission[]> = {
  restaurant: [
    { id: '1', emoji: '🍽️', title: 'First Bite', description: 'Visit and make your first purchase', reward: '50', rewardAmount: 50, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '2', emoji: '📸', title: 'Food Critic', description: 'Share a photo of your meal', reward: '25', rewardAmount: 25, rewardUnit: 'pts', type: 'social', difficulty: 'easy', progress: 0, xp: 50 },
    { id: '3', emoji: '👥', title: 'Bring a Friend', description: 'Refer a friend who visits', reward: '100', rewardAmount: 100, rewardUnit: 'pts', type: 'social', difficulty: 'medium', progress: 0, xp: 150 },
    { id: '4', emoji: '🔥', title: 'Regular', description: 'Visit 5 times this month', reward: 'Free appetizer', rewardAmount: 1, rewardUnit: 'item', type: 'monthly', difficulty: 'medium', progress: 40, xp: 300 },
    { id: '5', emoji: '⭐', title: 'Leave a Review', description: 'Rate us on Google Maps', reward: '75', rewardAmount: 75, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '6', emoji: '🏆', title: 'VIP Status', description: 'Earn 500 points total', reward: 'VIP Badge + 10% off', rewardAmount: 1, rewardUnit: 'badge', type: 'milestone', difficulty: 'hard', progress: 20, xp: 500 },
  ],
  cafe: [
    { id: '1', emoji: '☕', title: 'First Sip', description: 'Order your first drink', reward: '50', rewardAmount: 50, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '2', emoji: '📱', title: 'Check In', description: 'Check in at the cafe', reward: '15', rewardAmount: 15, rewardUnit: 'pts', type: 'daily', difficulty: 'easy', progress: 0, xp: 25 },
    { id: '3', emoji: '👥', title: 'Coffee Date', description: 'Bring a friend for their first visit', reward: '100', rewardAmount: 100, rewardUnit: 'pts', type: 'social', difficulty: 'medium', progress: 0, xp: 150 },
    { id: '4', emoji: '🔥', title: 'Caffeine Addict', description: 'Visit 10 times', reward: 'Free drink', rewardAmount: 1, rewardUnit: 'item', type: 'milestone', difficulty: 'medium', progress: 30, xp: 300 },
    { id: '5', emoji: '📸', title: 'Latte Art', description: 'Share a photo of your drink', reward: '25', rewardAmount: 25, rewardUnit: 'pts', type: 'social', difficulty: 'easy', progress: 0, xp: 50 },
    { id: '6', emoji: '🏆', title: 'Barista\'s Favorite', description: 'Earn 500 points', reward: 'Gold Member', rewardAmount: 1, rewardUnit: 'badge', type: 'milestone', difficulty: 'hard', progress: 10, xp: 500 },
  ],
  salon: [
    { id: '1', emoji: '💇', title: 'Fresh Look', description: 'Book your first appointment', reward: '50', rewardAmount: 50, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '2', emoji: '📸', title: 'Glow Up', description: 'Share your new look on social', reward: '30', rewardAmount: 30, rewardUnit: 'pts', type: 'social', difficulty: 'easy', progress: 0, xp: 50 },
    { id: '3', emoji: '👥', title: 'Style Squad', description: 'Refer a friend', reward: '150', rewardAmount: 150, rewardUnit: 'pts', type: 'social', difficulty: 'medium', progress: 0, xp: 200 },
    { id: '4', emoji: '💅', title: 'Regular Glow', description: 'Visit 3 times', reward: 'Free treatment upgrade', rewardAmount: 1, rewardUnit: 'item', type: 'milestone', difficulty: 'medium', progress: 33, xp: 300 },
    { id: '5', emoji: '⭐', title: 'Review Star', description: 'Leave a review', reward: '75', rewardAmount: 75, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '6', emoji: '🏆', title: 'VIP Client', description: 'Earn 500 points', reward: 'Priority booking + 15% off', rewardAmount: 1, rewardUnit: 'badge', type: 'milestone', difficulty: 'hard', progress: 15, xp: 500 },
  ],
  default: [
    { id: '1', emoji: '🎯', title: 'First Visit', description: 'Make your first purchase', reward: '50', rewardAmount: 50, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '2', emoji: '📸', title: 'Share the Love', description: 'Post about us on social media', reward: '25', rewardAmount: 25, rewardUnit: 'pts', type: 'social', difficulty: 'easy', progress: 0, xp: 50 },
    { id: '3', emoji: '👥', title: 'Bring a Friend', description: 'Refer someone new', reward: '100', rewardAmount: 100, rewardUnit: 'pts', type: 'social', difficulty: 'medium', progress: 0, xp: 150 },
    { id: '4', emoji: '🔥', title: 'Loyal Fan', description: 'Visit 5 times', reward: 'Special reward', rewardAmount: 1, rewardUnit: 'item', type: 'milestone', difficulty: 'medium', progress: 20, xp: 300 },
    { id: '5', emoji: '⭐', title: 'Review Hero', description: 'Leave a review on Google', reward: '75', rewardAmount: 75, rewardUnit: 'pts', type: 'milestone', difficulty: 'easy', progress: 0, xp: 100 },
    { id: '6', emoji: '🏆', title: 'VIP Member', description: 'Earn 500 points total', reward: 'VIP Status', rewardAmount: 1, rewardUnit: 'badge', type: 'milestone', difficulty: 'hard', progress: 10, xp: 500 },
  ],
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  easy: { bg: '#DCFCE7', text: '#16A34A' },
  medium: { bg: '#FEF9C3', text: '#CA8A04' },
  hard: { bg: '#FEE2E2', text: '#DC2626' },
};

const typeLabels: Record<string, string> = {
  daily: '📅 Daily',
  weekly: '📆 Weekly',
  monthly: '📆 Monthly',
  milestone: '🎯 Milestone',
  social: '📣 Social',
};

export function MissionBoardCard({
  businessName,
  businessType = 'default',
  primaryColor = '#10F48B',
  tokenName,
  missions: customMissions,
  onAccept,
  onCustomize,
}: MissionBoardCardProps) {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'missions' | 'rewards'>('missions');
  
  const missions = customMissions || DEFAULT_MISSIONS[businessType] || DEFAULT_MISSIONS.default;
  const pointsName = tokenName || 'points';

  // Calculate total XP available
  const totalXP = missions.reduce((sum, m) => sum + m.xp, 0);

  return (
    <div className="w-full max-w-[380px] rounded-2xl overflow-hidden shadow-lg border border-gray-100"
      style={{ background: '#fff' }}>
      
      {/* Phone-like header */}
      <div className="px-4 pt-4 pb-3" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Customer Preview</span>
          <span className="text-[10px] text-white/50">Freedom World App</span>
        </div>
        <h3 className="text-lg font-bold text-white">{businessName || 'Your Business'}</h3>
        <p className="text-xs text-white/80 mt-0.5">🎮 Mission Board</p>
        
        {/* XP Bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: '15%' }} />
          </div>
          <span className="text-[10px] font-bold text-white">150 / {totalXP} XP</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('missions')}
          className="flex-1 py-2.5 text-xs font-semibold transition-all"
          style={{
            color: activeTab === 'missions' ? primaryColor : '#9CA3AF',
            borderBottom: activeTab === 'missions' ? `2px solid ${primaryColor}` : '2px solid transparent',
          }}
        >
          🎯 Missions ({missions.length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className="flex-1 py-2.5 text-xs font-semibold transition-all"
          style={{
            color: activeTab === 'rewards' ? primaryColor : '#9CA3AF',
            borderBottom: activeTab === 'rewards' ? `2px solid ${primaryColor}` : '2px solid transparent',
          }}
        >
          🎁 Rewards
        </button>
      </div>

      {/* Mission List */}
      {activeTab === 'missions' && (
        <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="rounded-xl p-3 cursor-pointer transition-all hover:shadow-md"
              style={{
                background: selectedMission === mission.id ? `${primaryColor}08` : '#F9FAFB',
                border: selectedMission === mission.id ? `1.5px solid ${primaryColor}40` : '1.5px solid transparent',
              }}
              onClick={() => setSelectedMission(selectedMission === mission.id ? null : mission.id)}
            >
              <div className="flex items-start gap-3">
                {/* Mission icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: `${primaryColor}15` }}>
                  {mission.emoji}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{mission.title}</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ 
                        background: difficultyColors[mission.difficulty].bg,
                        color: difficultyColors[mission.difficulty].text,
                      }}>
                      {mission.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{mission.description}</p>
                  
                  {/* Reward + Type */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{typeLabels[mission.type] || mission.type}</span>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>
                      +{mission.rewardUnit === 'pts' ? `${mission.reward} ${pointsName}` : mission.reward}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  {(mission.progress ?? 0) > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${mission.progress}%`, background: primaryColor }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 font-medium">{mission.progress}%</span>
                    </div>
                  )}

                  {/* Expanded detail */}
                  {selectedMission === mission.id && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>🏅 {mission.xp} XP</span>
                        <span>•</span>
                        <span>{mission.rewardUnit === 'badge' ? '🎖️ Unlocks badge' : mission.rewardUnit === 'item' ? '🎁 Unlocks reward' : `💰 Earns ${pointsName}`}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto">
          {/* Tier progress */}
          <div className="rounded-xl p-3" style={{ background: `${primaryColor}08` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Member Tier</span>
              <span className="text-xs font-bold" style={{ color: primaryColor }}>Bronze → Silver</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '30%', background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">150 / 500 {pointsName} to Silver</p>
          </div>
          
          {/* Available rewards */}
          {[
            { emoji: '🎁', name: 'Free appetizer', cost: 200, available: false },
            { emoji: '☕', name: 'Free drink', cost: 100, available: true },
            { emoji: '🎂', name: 'Birthday special', cost: 0, available: true, tag: 'FREE' },
            { emoji: '💎', name: '10% off everything', cost: 500, available: false },
          ].map((reward, idx) => (
            <div key={idx} className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: '#F9FAFB', opacity: reward.available ? 1 : 0.5 }}>
              <span className="text-xl">{reward.emoji}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{reward.name}</span>
                {reward.tag && (
                  <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: primaryColor }}>{reward.tag}</span>
                )}
              </div>
              <span className="text-xs font-bold" style={{ color: reward.available ? primaryColor : '#9CA3AF' }}>
                {reward.cost > 0 ? `${reward.cost} pts` : 'Free'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="p-3 border-t border-gray-100 flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
          style={{ background: primaryColor }}
        >
          Love this! ✨
        </button>
        <button
          onClick={onCustomize}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
        >
          ✏️ Customize
        </button>
      </div>
    </div>
  );
}
