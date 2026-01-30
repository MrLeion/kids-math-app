import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Writing game star following feature", () => {
  const writingGamePath = path.join(process.cwd(), "app/games/writing.tsx");

  it("should have star position state and animation values", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star animation values
    expect(content).toContain("starX");
    expect(content).toContain("starY");
    expect(content).toContain("starOpacity");
    expect(content).toContain("useSharedValue");
  });

  it("should initialize star position on gesture start", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star initialization in onStart
    expect(content).toContain(".onStart((e) => {");
    expect(content).toContain("starX.value = e.x");
    expect(content).toContain("starY.value = e.y");
    expect(content).toContain("starOpacity.value = 1");
  });

  it("should update star position on gesture update", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star following in onUpdate
    expect(content).toContain(".onUpdate((e) => {");
    expect(content).toContain("starX.value = e.x;");
    expect(content).toContain("starY.value = e.y;");
  });

  it("should fade out star on gesture end", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star fade out in onEnd
    expect(content).toContain(".onEnd(() => {");
    expect(content).toContain("starOpacity.value = withTiming(0");
  });

  it("should have star animated style", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star animated style
    expect(content).toContain("starAnimatedStyle");
    expect(content).toContain("useAnimatedStyle");
  });

  it("should render star in canvas", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star rendering
    expect(content).toContain("followingStar");
    expect(content).toContain("starAnimatedStyle");
    expect(content).toContain("starEmoji");
    expect(content).toContain("⭐");
  });

  it("should have star styles defined", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");
    
    // Check for star styles
    expect(content).toContain("followingStar:");
    expect(content).toContain("starEmoji:");
    expect(content).toContain("position: \"absolute\"");
  });
});
