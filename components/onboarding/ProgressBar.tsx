'use client';

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full h-[3px] bg-gray-100 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full transition-all duration-500"
        style={{
          width: `${progress}%`,
          backgroundColor: '#00FF88',
          boxShadow: '0 0 8px rgba(0,255,136,0.4)',
        }}
      />
    </div>
  );
}
