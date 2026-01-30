import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Import after mocking
import {
  getProgress,
  saveProgress,
  addStars,
  getAchievements,
  unlockAchievement,
  resetProgress,
} from "../lib/storage";

describe("Storage Module", () => {
  beforeEach(async () => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe("Progress", () => {
    it("should return default progress when no data exists", async () => {
      const progress = await getProgress();
      expect(progress).toEqual({
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
      });
    });

    it("should save and retrieve progress", async () => {
      await saveProgress({ numbersLearned: [1, 2, 3] });
      const progress = await getProgress();
      expect(progress.numbersLearned).toEqual([1, 2, 3]);
    });

    it("should merge progress updates", async () => {
      await saveProgress({ numbersLearned: [1, 2] });
      await saveProgress({ symbolsLearned: ["+", "-"] });
      const progress = await getProgress();
      expect(progress.numbersLearned).toEqual([1, 2]);
      expect(progress.symbolsLearned).toEqual(["+", "-"]);
    });
  });

  describe("Stars", () => {
    it("should return 0 stars when no data exists", async () => {
      const progress = await getProgress();
      expect(progress.totalStars).toBe(0);
    });

    it("should add stars correctly", async () => {
      await addStars(5);
      const progress = await getProgress();
      expect(progress.totalStars).toBe(5);
    });

    it("should accumulate stars", async () => {
      await addStars(3);
      await addStars(2);
      const progress = await getProgress();
      expect(progress.totalStars).toBe(5);
    });
  });

  describe("Achievements", () => {
    it("should return empty array when no achievements exist", async () => {
      const achievements = await getAchievements();
      expect(achievements).toEqual([]);
    });

    it("should unlock and retrieve achievements", async () => {
      const achievement = {
        id: "test_achievement",
        name: "Test",
        description: "Test achievement",
        icon: "🎯",
      };
      await unlockAchievement(achievement);
      const achievements = await getAchievements();
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe("test_achievement");
      expect(achievements[0].unlockedAt).toBeDefined();
    });

    it("should not duplicate achievements", async () => {
      const achievement = {
        id: "test_achievement",
        name: "Test",
        description: "Test achievement",
        icon: "🎯",
      };
      await unlockAchievement(achievement);
      await unlockAchievement(achievement);
      const achievements = await getAchievements();
      expect(achievements).toHaveLength(1);
    });
  });

  describe("Reset", () => {
    it("should reset all progress", async () => {
      await saveProgress({ numbersLearned: [1, 2, 3], totalStars: 10 });
      await unlockAchievement({ id: "test", name: "Test", description: "Test", icon: "🎯" });
      
      await resetProgress();
      
      const progress = await getProgress();
      expect(progress.numbersLearned).toEqual([]);
      expect(progress.totalStars).toBe(0);
      
      const achievements = await getAchievements();
      expect(achievements).toEqual([]);
    });
  });
});
