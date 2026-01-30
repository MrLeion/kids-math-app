import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Audio file existence", () => {
  const audioDir = path.join(process.cwd(), "assets/audio");

  it("should have all background music files", () => {
    const bgmFiles = [
      "children-funny-background.mp3",
      "happy-kids-music.mp3",
      "cute-mood.mp3",
    ];
    
    for (const file of bgmFiles) {
      const filePath = path.join(audioDir, file);
      const exists = fs.existsSync(filePath);
      expect(exists, `Background music file ${file} should exist`).toBe(true);
    }
  });

  it("should have all sound effect files", () => {
    const sfxFiles = [
      "success.mp3",
      "wrong.mp3",
      "click.mp3",
      "star.mp3",
    ];
    
    for (const file of sfxFiles) {
      const filePath = path.join(audioDir, file);
      const exists = fs.existsSync(filePath);
      expect(exists, `Sound effect file ${file} should exist`).toBe(true);
    }
  });

  it("should have valid file sizes (not empty)", () => {
    const allFiles = [
      "children-funny-background.mp3",
      "happy-kids-music.mp3",
      "cute-mood.mp3",
      "success.mp3",
      "wrong.mp3",
      "click.mp3",
      "star.mp3",
    ];
    
    for (const file of allFiles) {
      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);
      expect(stats.size, `Audio file ${file} should not be empty`).toBeGreaterThan(0);
    }
  });
});

describe("Audio manager module structure", () => {
  it("should export AudioAssets with correct structure", async () => {
    // Read the source file to verify structure
    const audioManagerPath = path.join(process.cwd(), "lib/audio-manager.ts");
    const content = fs.readFileSync(audioManagerPath, "utf-8");
    
    // Check that AudioAssets has bgm and sfx sections
    expect(content).toContain("export const AudioAssets");
    expect(content).toContain("bgm:");
    expect(content).toContain("sfx:");
    
    // Check that all game scenes have background music
    const gameScenes = [
      "home",
      "basic",
      "counting",
      "arithmetic",
      "life",
      "numbers",
      "symbols",
      "matching",
      "count",
      "compare",
      "fillblank",
      "addition",
      "subtraction",
      "time",
      "money",
    ];
    
    for (const scene of gameScenes) {
      expect(content).toContain(`${scene}:`);
    }
    
    // Check sound effects
    const soundEffects = ["success", "wrong", "click", "star"];
    for (const sfx of soundEffects) {
      expect(content).toContain(`${sfx}:`);
    }
  });

  it("should export useBackgroundMusic hook", async () => {
    const audioManagerPath = path.join(process.cwd(), "lib/audio-manager.ts");
    const content = fs.readFileSync(audioManagerPath, "utf-8");
    
    expect(content).toContain("export function useBackgroundMusic");
  });

  it("should export useSoundEffect hook", async () => {
    const audioManagerPath = path.join(process.cwd(), "lib/audio-manager.ts");
    const content = fs.readFileSync(audioManagerPath, "utf-8");
    
    expect(content).toContain("export function useSoundEffect");
  });

  it("should export useGameAudio hook", async () => {
    const audioManagerPath = path.join(process.cwd(), "lib/audio-manager.ts");
    const content = fs.readFileSync(audioManagerPath, "utf-8");
    
    expect(content).toContain("export function useGameAudio");
  });
});
