import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  rms: number;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ rms, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)'; // teal-500 with opacity
        ctx.lineWidth = 2;
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Smooth out the RMS value for animation
      const targetAmplitude = Math.min(rms * 500, height / 2);
      const amplitude = targetAmplitude * 0.8 + (Math.random() * targetAmplitude * 0.2);

      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x < width; x++) {
        // Create an organic wave using sine functions
        const y = height / 2 + Math.sin(x * 0.05 + time) * amplitude * Math.sin(x * 0.01);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = 'rgba(20, 184, 166, 0.8)'; // teal-500
      ctx.lineWidth = 3;
      ctx.stroke();

      // Add a subtle glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';

      time += 0.1;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [rms, isActive]);

  return (
    <div className="w-full h-10 md:h-16 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={64}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;
