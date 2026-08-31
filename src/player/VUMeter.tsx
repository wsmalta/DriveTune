import { useRef, useEffect } from 'react';

interface VUMeterProps {
  analyser: AnalyserNode | null;
  barCount?: number;
  barSpacing?: number;
}

export function VUMeter({ analyser, barCount = 32, barSpacing = 2 }: VUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(analyser);

  useEffect(() => {
    analyserRef.current = analyser;
  }, [analyser]);

  useEffect(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const peakHold = new Float32Array(barCount);
    const peakDecay = new Float32Array(barCount);
    const visibleBars = barCount;

    const usableBins = Math.floor(bufferLength * 0.85);
    const binEdges = new Float32Array(visibleBars + 1);
    for (let i = 0; i <= visibleBars; i++) {
      const t = i / visibleBars;
      binEdges[i] = Math.pow(t, 1.5) * usableBins;
    }

    const draw = () => {
      if (!canvasCtx || !analyserRef.current) return;
      animRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      canvasCtx.clearRect(0, 0, width, height);

      const gap = barSpacing;
      const barWidth = (width - gap * (visibleBars - 1)) / visibleBars;

      for (let i = 0; i < visibleBars; i++) {
        const start = Math.floor(binEdges[i]);
        const end = Math.min(Math.floor(binEdges[i + 1]), bufferLength - 1);
        let sum = 0;
        let count = 0;
        for (let j = start; j <= end; j++) {
          sum += dataArray[j];
          count++;
        }
        const avg = count > 0 ? sum / count : 0;

        const gain = 0.6 + 0.4 * (i / visibleBars);
        const value = Math.min((avg / 255) * gain, 1);
        const barHeight = Math.max(value * height, 2);

        if (value >= peakHold[i]) {
          peakHold[i] = value;
          peakDecay[i] = 0;
        } else {
          peakDecay[i] += 0.008;
          peakHold[i] = Math.max(peakHold[i] - peakDecay[i] * 0.03, 0);
        }

        const x = i * (barWidth + gap);
        const y = height - barHeight;

        const r = Math.floor(255 * value);
        const g = Math.floor(100 + 155 * (1 - value));
        const b = 50;
        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, y, barWidth, barHeight);

        const peakY = height - peakHold[i] * height;
        canvasCtx.fillStyle = '#fff';
        canvasCtx.fillRect(x, peakY, barWidth, 2);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [analyser, barCount, barSpacing]);

  return (
    <canvas
      ref={canvasRef}
      className="vu-meter-canvas"
      aria-label="VU Meter"
    />
  );
}
