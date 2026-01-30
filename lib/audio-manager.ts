/**
 * 音频管理器 - 管理背景音乐和音效
 */
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";

// 音频资源映射
export const AudioAssets = {
  // 背景音乐
  bgm: {
    home: require("@/assets/audio/children-funny-background.mp3"),
    basic: require("@/assets/audio/happy-kids-music.mp3"),
    counting: require("@/assets/audio/cute-mood.mp3"),
    arithmetic: require("@/assets/audio/children-funny-background.mp3"),
    life: require("@/assets/audio/happy-kids-music.mp3"),
    numbers: require("@/assets/audio/happy-kids-music.mp3"),
    symbols: require("@/assets/audio/cute-mood.mp3"),
    matching: require("@/assets/audio/children-funny-background.mp3"),
    count: require("@/assets/audio/happy-kids-music.mp3"),
    compare: require("@/assets/audio/cute-mood.mp3"),
    fillblank: require("@/assets/audio/children-funny-background.mp3"),
    addition: require("@/assets/audio/happy-kids-music.mp3"),
    subtraction: require("@/assets/audio/cute-mood.mp3"),
    time: require("@/assets/audio/children-funny-background.mp3"),
    money: require("@/assets/audio/happy-kids-music.mp3"),
  },
  // 音效
  sfx: {
    success: require("@/assets/audio/success.mp3"),
    wrong: require("@/assets/audio/wrong.mp3"),
    click: require("@/assets/audio/click.mp3"),
    star: require("@/assets/audio/star.mp3"),
  },
} as const;

export type BgmKey = keyof typeof AudioAssets.bgm;
export type SfxKey = keyof typeof AudioAssets.sfx;

// 初始化音频模式
export async function initAudioMode() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });
  } catch (error) {
    console.warn("Failed to set audio mode:", error);
  }
}

/**
 * 背景音乐 Hook
 */
export function useBackgroundMusic(scene: BgmKey, enabled: boolean = true) {
  const player = useAudioPlayer(AudioAssets.bgm[scene]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (!enabled || Platform.OS === "web") {
      return;
    }

    const startMusic = async () => {
      try {
        await initAudioMode();
        player.loop = true;
        player.volume = 0.3;
        player.play();
        isPlayingRef.current = true;
      } catch (error) {
        console.warn("Failed to play background music:", error);
      }
    };

    startMusic();

    return () => {
      try {
        if (isPlayingRef.current) {
          player.pause();
          isPlayingRef.current = false;
        }
        player.release();
      } catch (error) {
        console.warn("Failed to release player:", error);
      }
    };
  }, [scene, enabled]);

  const pause = useCallback(() => {
    try {
      player.pause();
      isPlayingRef.current = false;
    } catch (error) {
      console.warn("Failed to pause:", error);
    }
  }, [player]);

  const resume = useCallback(() => {
    try {
      player.play();
      isPlayingRef.current = true;
    } catch (error) {
      console.warn("Failed to resume:", error);
    }
  }, [player]);

  return { pause, resume };
}

/**
 * 音效 Hook
 */
export function useSoundEffect() {
  const successPlayer = useAudioPlayer(AudioAssets.sfx.success);
  const wrongPlayer = useAudioPlayer(AudioAssets.sfx.wrong);
  const clickPlayer = useAudioPlayer(AudioAssets.sfx.click);
  const starPlayer = useAudioPlayer(AudioAssets.sfx.star);

  useEffect(() => {
    initAudioMode();
    
    return () => {
      try {
        successPlayer.release();
        wrongPlayer.release();
        clickPlayer.release();
        starPlayer.release();
      } catch (error) {
        console.warn("Failed to release sound players:", error);
      }
    };
  }, []);

  const playSuccess = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      successPlayer.seekTo(0);
      successPlayer.volume = 0.6;
      successPlayer.play();
    } catch (error) {
      console.warn("Failed to play success sound:", error);
    }
  }, [successPlayer]);

  const playWrong = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      wrongPlayer.seekTo(0);
      wrongPlayer.volume = 0.5;
      wrongPlayer.play();
    } catch (error) {
      console.warn("Failed to play wrong sound:", error);
    }
  }, [wrongPlayer]);

  const playClick = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      clickPlayer.seekTo(0);
      clickPlayer.volume = 0.4;
      clickPlayer.play();
    } catch (error) {
      console.warn("Failed to play click sound:", error);
    }
  }, [clickPlayer]);

  const playStar = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      starPlayer.seekTo(0);
      starPlayer.volume = 0.6;
      starPlayer.play();
    } catch (error) {
      console.warn("Failed to play star sound:", error);
    }
  }, [starPlayer]);

  return {
    playSuccess,
    playWrong,
    playClick,
    playStar,
  };
}

/**
 * 组合 Hook - 同时管理背景音乐和音效
 */
export function useGameAudio(scene: BgmKey, bgmEnabled: boolean = true) {
  const bgm = useBackgroundMusic(scene, bgmEnabled);
  const sfx = useSoundEffect();

  return {
    bgm,
    ...sfx,
  };
}
