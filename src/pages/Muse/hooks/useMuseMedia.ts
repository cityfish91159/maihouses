/**
 * 🎵 useMuseMedia Hook
 * 職責：多媒體管理 - 錄音、TTS 播放、音效管理
 */

import { useState, useRef, useCallback } from 'react';

export interface UseMuseMediaOptions {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

export interface UseMuseMediaReturn {
  // 錄音狀態
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;

  // 播放狀態
  isPlaying: boolean;
  playVoice: (audioUrl: string) => Promise<void>;
  stopVoice: () => void;

  // TTS
  playTTS: (text: string, voice?: string) => Promise<void>;
}

/**
 * Media management hook for audio recording, TTS, and sound effects
 *
 * @example
 * const { isRecording, startRecording, stopRecording, playVoice } = useMuseMedia({
 *   onRecordingComplete: (blob) => uploadAudio(blob)
 * });
 */
export function useMuseMedia(options: UseMuseMediaOptions = {}): UseMuseMediaReturn {
  const { onRecordingComplete, onError } = options;

  // ═══════════════════════════════════════════════════════════════
  // 錄音狀態
  // ═══════════════════════════════════════════════════════════════

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 播放狀態
  // ═══════════════════════════════════════════════════════════════

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 開始錄音
  // ═══════════════════════════════════════════════════════════════

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(audioBlob);

        // 停止所有音軌
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingDuration(0);

      // 開始計時
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('🎙️ 開始錄音');
    } catch (error) {
      console.error('❌ 錄音失敗:', error);
      onError?.(error as Error);
    }
  }, [onRecordingComplete, onError]);

  // ═══════════════════════════════════════════════════════════════
  // 停止錄音
  // ═══════════════════════════════════════════════════════════════

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);

        // 清理
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        mediaRecorderRef.current = null;

        console.log('⏹️ 停止錄音');
      };

      recorder.stop();
    });
  }, [isRecording]);

  // ═══════════════════════════════════════════════════════════════
  // 播放語音
  // ═══════════════════════════════════════════════════════════════

  const playVoice = useCallback(async (audioUrl: string) => {
    try {
      // 停止當前播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = (error) => {
        console.error('❌ 播放失敗:', error);
        setIsPlaying(false);
        onError?.(new Error('播放失敗'));
      };

      await audio.play();
      console.log('🔊 播放語音:', audioUrl);
    } catch (error) {
      console.error('❌ 播放失敗:', error);
      onError?.(error as Error);
    }
  }, [onError]);

  // ═══════════════════════════════════════════════════════════════
  // 停止播放
  // ═══════════════════════════════════════════════════════════════

  const stopVoice = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
      console.log('⏹️ 停止播放');
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // TTS 播放
  // ═══════════════════════════════════════════════════════════════

  const playTTS = useCallback(async (text: string, voice = 'zh-TW') => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (error) => {
        console.error('❌ TTS 失敗:', error);
        setIsPlaying(false);
        onError?.(new Error('TTS 失敗'));
      };

      window.speechSynthesis.speak(utterance);
      console.log('🗣️ TTS 播放:', text.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ TTS 失敗:', error);
      onError?.(error as Error);
    }
  }, [onError]);

  return {
    // 錄音
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,

    // 播放
    isPlaying,
    playVoice,
    stopVoice,

    // TTS
    playTTS
  };
}
