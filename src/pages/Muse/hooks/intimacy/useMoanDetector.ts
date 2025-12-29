/**
 * 🔊 useMoanDetector Hook
 * 職責：呻吟檢測 - 分析音頻輸入判斷呻吟行為
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface MoanDetectionResult {
  isMoaning: boolean;           // 是否正在呻吟
  intensity: number;            // 呻吟強度 0-100
  duration: number;             // 持續時間（秒）
  totalMoans: number;           // 總呻吟次數
}

export interface UseMoanDetectorOptions {
  enabled: boolean;
  threshold?: number;           // 檢測閾值（預設 0.3）
  onMoanDetected?: (intensity: number) => void;
  onMoanStopped?: () => void;
}

export interface UseMoanDetectorReturn {
  result: MoanDetectionResult;
  startListening: () => Promise<void>;
  stopListening: () => void;
  reset: () => void;
}

/**
 * Moan detection hook using audio analysis
 *
 * @example
 * const { result, startListening, stopListening } = useMoanDetector({
 *   enabled: isIntimateMode,
 *   onMoanDetected: (intensity) => updateIntimacy(intensity)
 * });
 */
export function useMoanDetector(options: UseMoanDetectorOptions): UseMoanDetectorReturn {
  const {
    enabled,
    threshold = 0.3,
    onMoanDetected,
    onMoanStopped
  } = options;

  // ═══════════════════════════════════════════════════════════════
  // 狀態（完全獨立）
  // ═══════════════════════════════════════════════════════════════

  const [isMoaning, setIsMoaning] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalMoans, setTotalMoans] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 音頻分析函數
  // ═══════════════════════════════════════════════════════════════

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !enabled) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    // 計算平均音量
    const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    const normalizedVolume = average / 255;

    // 檢測呻吟（根據音量和頻率特徵）
    if (normalizedVolume > threshold) {
      if (!isMoaning) {
        // 開始呻吟
        setIsMoaning(true);
        setTotalMoans(prev => prev + 1);
        console.log('🔊 檢測到呻吟');
        onMoanDetected?.(normalizedVolume * 100);

        // 開始計時
        durationTimerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      }

      setIntensity(Math.round(normalizedVolume * 100));
    } else {
      if (isMoaning) {
        // 停止呻吟
        setIsMoaning(false);
        setDuration(0);
        console.log('⏹️ 呻吟停止');
        onMoanStopped?.();

        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
      }

      setIntensity(0);
    }

    // 繼續分析
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [enabled, threshold, isMoaning, onMoanDetected, onMoanStopped]);

  // ═══════════════════════════════════════════════════════════════
  // 開始監聽
  // ═══════════════════════════════════════════════════════════════

  const startListening = useCallback(async () => {
    if (!enabled) {
      console.warn('⚠️ 呻吟檢測未啟用');
      return;
    }

    try {
      // 獲取麥克風權限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 創建音頻上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // 創建分析器
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // 連接麥克風到分析器
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // 開始分析
      analyzeAudio();

      console.log('👂 開始監聽呻吟');
    } catch (error) {
      console.error('❌ 無法啟動呻吟檢測:', error);
    }
  }, [enabled, analyzeAudio]);

  // ═══════════════════════════════════════════════════════════════
  // 停止監聽
  // ═══════════════════════════════════════════════════════════════

  const stopListening = useCallback(() => {
    // 停止動畫幀
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 停止計時器
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // 關閉音頻上下文
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 停止媒體串流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    setIsMoaning(false);
    setIntensity(0);
    setDuration(0);

    console.log('⏹️ 停止監聽呻吟');
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 重置
  // ═══════════════════════════════════════════════════════════════

  const reset = useCallback(() => {
    stopListening();
    setTotalMoans(0);
    console.log('🔄 重置呻吟檢測');
  }, [stopListening]);

  // ═══════════════════════════════════════════════════════════════
  // 清理
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // ═══════════════════════════════════════════════════════════════
  // 返回
  // ═══════════════════════════════════════════════════════════════

  return {
    result: {
      isMoaning,
      intensity,
      duration,
      totalMoans
    },
    startListening,
    stopListening,
    reset
  };
}
