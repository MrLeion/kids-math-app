import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Writing game guide hand feature", () => {
  const writingGamePath = path.join(process.cwd(), "app/games/writing.tsx");

  it("should have guide hand animation values", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for guide hand animation values
    expect(content).toContain("handX");
    expect(content).toContain("handY");
    expect(content).toContain("handOpacity");
    expect(content).toContain("useSharedValue");
  });

  it("should have isGuiding state", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for guide state
    expect(content).toContain("isGuiding");
    expect(content).toContain("setIsGuiding");
  });

  it("should have playGuideAnimation function", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for guide animation function
    expect(content).toContain("playGuideAnimation");
    expect(content).toContain("withSequence");
  });

  it("should handle gesture start with guiding check", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for gesture start handler with guiding check
    expect(content).toContain(".onStart((e) => {");
    expect(content).toContain("if (isGuiding) return");
  });

  it("should handle gesture update with guiding check", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for gesture update with guiding check
    expect(content).toContain(".onUpdate((e) => {");
    expect(content).toContain("if (!isDrawing || isGuiding) return");
  });

  it("should have guide hand animated style", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for guide hand animated style
    expect(content).toContain("handAnimatedStyle");
    expect(content).toContain("useAnimatedStyle");
  });

  it("should render guide hand in canvas", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for guide hand rendering
    expect(content).toContain("guideHand");
    expect(content).toContain("handAnimatedStyle");
    expect(content).toContain("handEmoji");
    expect(content).toContain("👆");
  });

  it("should have guide hand styles defined", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for guide hand styles
    expect(content).toContain("guideHand:");
    expect(content).toContain("handEmoji:");
    expect(content).toContain("position: \"absolute\"");
  });

  it("should have demo button", () => {
    const content = fs.readFileSync(writingGamePath, "utf-8");

    // Check for demo button
    expect(content).toContain("demoButton");
    expect(content).toContain("playGuideAnimation");
    expect(content).toContain("👆 演示");
  });
});
