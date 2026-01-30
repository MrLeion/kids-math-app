import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("New game files existence", () => {
  const gamesDir = path.join(process.cwd(), "app/games");

  it("should have writing game file", () => {
    const filePath = path.join(gamesDir, "writing.tsx");
    const exists = fs.existsSync(filePath);
    expect(exists, "writing.tsx should exist").toBe(true);
  });

  it("should have shopping game file", () => {
    const filePath = path.join(gamesDir, "shopping.tsx");
    const exists = fs.existsSync(filePath);
    expect(exists, "shopping.tsx should exist").toBe(true);
  });
});

describe("Writing game structure", () => {
  it("should have all required components and hooks", () => {
    const filePath = path.join(process.cwd(), "app/games/writing.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Check imports
    expect(content).toContain("useGameAudio");
    expect(content).toContain("ScreenContainer");
    expect(content).toContain("GameHeader");
    expect(content).toContain("Feedback");
    
    // Check number paths
    expect(content).toContain("NUMBER_PATHS");
    
    // Check game logic
    expect(content).toContain("checkDrawing");
    expect(content).toContain("clearCanvas");
    expect(content).toContain("completedNumbers");
  });

  it("should have gesture handling", () => {
    const filePath = path.join(process.cwd(), "app/games/writing.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("GestureDetector");
    expect(content).toContain("Gesture.Pan");
    expect(content).toContain("drawnPoints");
  });
});

describe("Shopping game structure", () => {
  it("should have all required components and hooks", () => {
    const filePath = path.join(process.cwd(), "app/games/shopping.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Check imports
    expect(content).toContain("useGameAudio");
    expect(content).toContain("ScreenContainer");
    expect(content).toContain("GameHeader");
    expect(content).toContain("Feedback");
    
    // Check product data
    expect(content).toContain("PRODUCTS");
    
    // Check game logic
    expect(content).toContain("addToCart");
    expect(content).toContain("removeFromCart");
    expect(content).toContain("handlePayment");
    expect(content).toContain("shoppingList");
  });

  it("should have shopping and checkout steps", () => {
    const filePath = path.join(process.cwd(), "app/games/shopping.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("shopping");
    expect(content).toContain("checkout");
    expect(content).toContain("goToCheckout");
  });
});

describe("Module pages updated", () => {
  it("should have writing entry in basic module", () => {
    const filePath = path.join(process.cwd(), "app/modules/basic.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("writing");
    expect(content).toContain("/games/writing");
    expect(content).toContain("数字书写");
  });

  it("should have shopping entry in life module", () => {
    const filePath = path.join(process.cwd(), "app/modules/life.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("shopping");
    expect(content).toContain("/games/shopping");
    expect(content).toContain("超市购物");
  });
});

describe("Storage updated for new games", () => {
  it("should have writingCompleted field", () => {
    const filePath = path.join(process.cwd(), "lib/storage.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("writingCompleted");
  });

  it("should have shoppingCompleted field", () => {
    const filePath = path.join(process.cwd(), "lib/storage.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("shoppingCompleted");
  });
});
