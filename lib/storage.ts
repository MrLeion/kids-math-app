import AsyncStorage from "@react-native-async-storage/async-storage";

const PROGRESS_KEY = "kids_math_progress";
const ACHIEVEMENTS_KEY = "kids_math_achievements";

export interface GameProgress {
  // 基础认知
  numbersLearned: number[];
  symbolsLearned: string[];
  numberObjectCompleted: number;
  writingCompleted: number[]; // 数字书写练习完成的数字
  // 计数能力
  countingScore: number;
  compareScore: number;
  fillBlankScore: number;
  // 运算启蒙
  additionScore: number;
  subtractionScore: number;
  // 生活应用
  timeScore: number;
  moneyScore: number;
  shoppingCompleted: number; // 超市购物完成次数
  // 总星星数
  totalStars: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

const defaultProgress: GameProgress = {
  numbersLearned: [],
  symbolsLearned: [],
  numberObjectCompleted: 0,
  writingCompleted: [],
  countingScore: 0,
  compareScore: 0,
  fillBlankScore: 0,
  additionScore: 0,
  subtractionScore: 0,
  timeScore: 0,
  moneyScore: 0,
  shoppingCompleted: 0,
  totalStars: 0,
};

export async function getProgress(): Promise<GameProgress> {
  try {
    const data = await AsyncStorage.getItem(PROGRESS_KEY);
    if (data) {
      return { ...defaultProgress, ...JSON.parse(data) };
    }
    return defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export async function saveProgress(progress: Partial<GameProgress>): Promise<void> {
  try {
    const current = await getProgress();
    const updated = { ...current, ...progress };
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}

export async function addStars(count: number): Promise<number> {
  const progress = await getProgress();
  const newTotal = progress.totalStars + count;
  await saveProgress({ totalStars: newTotal });
  return newTotal;
}

export async function getAchievements(): Promise<Achievement[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function unlockAchievement(achievement: Omit<Achievement, "unlockedAt">): Promise<void> {
  try {
    const achievements = await getAchievements();
    const exists = achievements.find((a) => a.id === achievement.id);
    if (!exists) {
      achievements.push({
        ...achievement,
        unlockedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    }
  } catch (error) {
    console.error("Failed to unlock achievement:", error);
  }
}

export async function resetProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
    await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
  } catch (error) {
    console.error("Failed to reset progress:", error);
  }
}
