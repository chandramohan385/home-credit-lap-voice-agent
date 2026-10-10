import React, { useEffect, useRef } from 'react';

export default function WaveformVisualizer({ isActive, isSpeaking, isListening }) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw subtle background guide line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isActive) {
        // Multi-frequency wave animation tuned for Light Theme
        const numWaves = 3;
        const colors = isSpeaking
          ? ['rgba(37, 99, 235, 0.85)', 'rgba(79, 70, 229, 0.65)', 'rgba(147, 51, 234, 0.45)']
          : isListening
          ? ['rgba(225, 29, 72, 0.85)', 'rgba(234, 88, 12, 0.65)', 'rgba(202, 138, 4, 0.45)']
          : ['rgba(148, 163, 184, 0.4)', 'rgba(203, 213, 225, 0.3)', 'rgba(226, 232, 240, 0.2)'];

        const baseAmplitude = isSpeaking ? 16 : isListening ? 12 : 3;

        for (let w = 0; w < numWaves; w++) {
          ctx.beginPath();
          ctx.moveTo(0, centerY);

          const freq = 0.02 + w * 0.01;
          const speed = (w + 1) * 0.08;
          const amp = baseAmplitude * (1 - w * 0.25);

          for (let x = 0; x < width; x++) {
            const envelope = Math.sin((x / width) * Math.PI);
            const y = centerY + Math.sin(x * freq + phase * speed) * amp * envelope;
            ctx.lineTo(x, y);
          }

          ctx.strokeStyle = colors[w];
          ctx.lineWidth = 2.5 - w * 0.5;
          ctx.stroke();
        }

        phase += 0.8;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isActive, isSpeaking, isListening]);

  return (
    <div className="w-full flex items-center justify-center py-1">
      <canvas
        ref={canvasRef}
        width={380}
        height={46}
        className="w-full max-w-sm rounded-lg"
      />
    </div>
  );
}
