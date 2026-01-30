import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

// 符号故事
const SYMBOLS = [
  {
    symbol: "+",
    name: "加号",
    story: "小蜜蜂采花蜜",
    description: "两只蜜蜂合并到一朵花上",
    emoji: "🐝",
    animation: "🐝 + 🐝 = 🐝🐝",
    sound: "嗡嗡嗡",
    color: "#FFD60A",
  },
  {
    symbol: "-",
    name: "减号",
    story: "小鸟飞走了",
    description: "从树上飞走几只小鸟",
    emoji: "🐦",
    animation: "🐦🐦🐦 - 🐦 = 🐦🐦",
    sound: "啾啾啾",
    color: "#5AC8FA",
  },
  {
    symbol: "=",
    name: "等号",
    story: "天平平衡",
    description: "两边水果数量相等",
    emoji: "⚖️",
    animation: "🍎🍎 = 🍎🍎",
    sound: "叮~",
    color: "#34C759",
  },
  {
    symbol: ">",
    name: "大于号",
    story: "鳄鱼吃大数",
    description: "鳄鱼嘴巴朝向大的数字",
    emoji: "🐊",
    animation: "5 > 3 (🐊朝向5)",
    sound: "啊呜~",
    color: "#FF6B9D",
  },
  {
    symbol: "<",
    name: "小于号",
    story: "鳄鱼吃大数",
    description: "鳄鱼嘴巴朝向大的数字",
    emoji: "🐊",
    animation: "2 < 7 (🐊朝向7)",
    sound: "啊呜~",
    color: "#FF9500",
  },
];

export default function SymbolsGameScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState<typeof SYMBOLS[0] | null>(null);
  const [learnedSymbols, setLearnedSymbols] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "celebration">("success");

  const bounce = useSharedValue(0);

  // 音频系统
  const { playClick, playStar } = useGameAudio("symbols");

  useEffect(() => {
    loadProgress();
    // 动画循环
    bounce.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setLearnedSymbols(progress.symbolsLearned);
  };

  const handleSymbolPress = async (symbol: typeof SYMBOLS[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();
    
    setSelectedSymbol(symbol);
    
    // 如果是新学的符号
    if (!learnedSymbols.includes(symbol.symbol)) {
      const newLearned = [...learnedSymbols, symbol.symbol];
      setLearnedSymbols(newLearned);
      await saveProgress({ symbolsLearned: newLearned });
      await addStars(1);
      
      // 检查成就
      if (newLearned.length === 1) {
        await unlockAchievement({
          id: "first_symbol",
          name: "符号探索",
          description: "认识第一个符号",
          icon: "➕",
        });
      }
      if (newLearned.length === 5) {
        await unlockAchievement({
          id: "all_symbols",
          name: "符号专家",
          description: "认识所有运算符号",
          icon: "🎯",
        });
        setFeedbackType("celebration");
      } else {
        setFeedbackType("success");
      }
      setShowFeedback(true);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value * 10 }],
  }));

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="认识符号" 
        subtitle={`已学习 ${learnedSymbols.length}/5 个符号`}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Symbol Display */}
        {selectedSymbol && (
          <View style={[styles.selectedCard, { borderColor: selectedSymbol.color }]}>
            <Animated.Text style={[styles.selectedEmoji, animatedStyle]}>
              {selectedSymbol.emoji}
            </Animated.Text>
            <Text style={[styles.selectedSymbol, { color: selectedSymbol.color }]}>
              {selectedSymbol.symbol}
            </Text>
            <Text style={styles.selectedName}>{selectedSymbol.name}</Text>
            <View style={styles.storyCard}>
              <Text style={styles.storyTitle}>📖 {selectedSymbol.story}</Text>
              <Text style={styles.storyDescription}>{selectedSymbol.description}</Text>
            </View>
            <View style={styles.animationCard}>
              <Text style={styles.animationText}>{selectedSymbol.animation}</Text>
            </View>
            <View style={[styles.soundBubble, { backgroundColor: selectedSymbol.color + "20" }]}>
              <Text style={[styles.soundText, { color: selectedSymbol.color }]}>
                &quot;{selectedSymbol.sound}&quot;
              </Text>
            </View>
          </View>
        )}

        {/* Symbol Buttons */}
        <View style={styles.symbolGrid}>
          {SYMBOLS.map((item) => {
            const isLearned = learnedSymbols.includes(item.symbol);
            const isSelected = selectedSymbol?.symbol === item.symbol;
            
            return (
              <TouchableOpacity
                key={item.symbol}
                style={[
                  styles.symbolButton,
                  { borderColor: item.color },
                  isLearned && { backgroundColor: item.color + "20" },
                  isSelected && { backgroundColor: item.color, transform: [{ scale: 1.05 }] },
                ]}
                onPress={() => handleSymbolPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.symbolEmoji}>{item.emoji}</Text>
                <Text style={[
                  styles.symbolText,
                  isSelected && { color: "#FFFFFF" },
                ]}>
                  {item.symbol}
                </Text>
                <Text style={[
                  styles.symbolName,
                  isSelected && { color: "#FFFFFF" },
                ]}>
                  {item.name}
                </Text>
                {isLearned && !isSelected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
          <Text style={styles.instructionText}>
            点击每个符号，听听它们的故事！{"\n"}
            每个符号都有一个有趣的动物朋友来帮助你记忆哦！
          </Text>
        </View>
      </ScrollView>

      <Feedback
        visible={showFeedback}
        type={feedbackType}
        message={feedbackType === "celebration" ? "太厉害了！认识了所有符号！" : "真棒！又认识一个符号！"}
        onComplete={() => setShowFeedback(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  selectedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
  },
  selectedEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  selectedSymbol: {
    fontSize: 56,
    fontWeight: "bold",
  },
  selectedName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#3D2914",
    marginTop: 8,
  },
  storyCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    width: "100%",
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 4,
  },
  storyDescription: {
    fontSize: 14,
    color: "#8B7355",
  },
  animationCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  animationText: {
    fontSize: 20,
    color: "#3D2914",
    textAlign: "center",
  },
  soundBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  soundText: {
    fontSize: 16,
    fontStyle: "italic",
  },
  symbolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  symbolButton: {
    width: 100,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    borderWidth: 2,
  },
  symbolEmoji: {
    fontSize: 32,
  },
  symbolText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3D2914",
    marginTop: 4,
  },
  symbolName: {
    fontSize: 12,
    color: "#8B7355",
    marginTop: 2,
  },
  checkMark: {
    position: "absolute",
    top: 4,
    right: 4,
    fontSize: 14,
    color: "#34C759",
  },
  instructionCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFD60A",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#8B7355",
    lineHeight: 22,
  },
});
