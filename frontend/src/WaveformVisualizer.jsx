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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isActive) {
        // Multi-frequency wave animation
        const numWaves = 3;
        const colors = isSpeaking
          ? ['rgba(59, 130, 246, 0.8)', 'rgba(99, 102, 241, 0.6)', 'rgba(168, 85, 247, 0.4)']
          : isListening
          ? ['rgba(239, 68, 68, 0.8)', 'rgba(249, 115, 22, 0.6)', 'rgba(234, 179, 8, 0.4)']
          : ['rgba(148, 163, 184, 0.3)', 'rgba(148, 163, 184, 0.2)', 'rgba(148, 163, 184, 0.1)'];

        const baseAmplitude = isSpeaking ? 18 : isListening ? 14 : 3;

        for (let w = 0; w < numWaves; w++) {
          ctx.beginPath();
          ctx.moveTo(0, centerY);

          const freq = 0.02 + w * 0.01;
          const speed = (w + 1) * 0.08;
          const amp = baseAmplitude * (1 - w * 0.25);

          for (let x = 0; x < width; x++) {
            // Envelope shaping: taper at edges
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
    <div className="w-full flex items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={380}
        height={50}
        className="w-full max-w-sm rounded-lg"
      />
    </div>
  );
}
