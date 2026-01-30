import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

// 数字动物对应关系
const NUMBER_ANIMALS = [
  { number: 0, animal: "🐼", name: "熊猫", description: "圆圆的熊猫", sound: "咕噜咕噜" },
  { number: 1, animal: "🦒", name: "长颈鹿", description: "站立的长颈鹿", sound: "点点头" },
  { number: 2, animal: "🦢", name: "天鹅", description: "游泳的天鹅", sound: "哗啦哗啦" },
  { number: 3, animal: "🦋", name: "蝴蝶", description: "弯曲的蝴蝶", sound: "扑扑扑" },
  { number: 4, animal: "🚩", name: "小旗", description: "飘扬的小旗", sound: "哗啦哗啦" },
  { number: 5, animal: "🪝", name: "钩子", description: "挂水果的钩子", sound: "咔嚓" },
  { number: 6, animal: "🐌", name: "蜗牛", description: "爬行的蜗牛", sound: "慢慢爬" },
  { number: 7, animal: "🌙", name: "镰刀", description: "弯弯的镰刀", sound: "唰唰唰" },
  { number: 8, animal: "⛄", name: "雪人", description: "滚动的雪人", sound: "咕噜噜" },
  { number: 9, animal: "🎈", name: "气球", description: "漂浮的气球", sound: "噗噗噗" },
  { number: 10, animal: "🎯", name: "靶子", description: "1和0组合", sound: "咚咚咚" },
];

export default function NumbersGameScreen() {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [learnedNumbers, setLearnedNumbers] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "celebration">("success");

  const scale = useSharedValue(1);

  // 音频系统
  const { playSuccess, playStar, playClick } = useGameAudio("numbers");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setLearnedNumbers(progress.numbersLearned);
  };

  const handleNumberPress = async (num: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();
    
    setSelectedNumber(num);
    
    // 如果是新学的数字
    if (!learnedNumbers.includes(num)) {
      const newLearned = [...learnedNumbers, num];
      setLearnedNumbers(newLearned);
      await saveProgress({ numbersLearned: newLearned });
      await addStars(1);
      
      // 检查成就
      if (newLearned.length === 1) {
        await unlockAchievement({
          id: "first_number",
          name: "数字启蒙",
          description: "学会第一个数字",
          icon: "🔢",
        });
      }
      if (newLearned.length === 11) {
        await unlockAchievement({
          id: "all_numbers",
          name: "数字大师",
          description: "学会所有数字0-10",
          icon: "🏆",
        });
        setFeedbackType("celebration");
      } else {
        setFeedbackType("success");
      }
      setShowFeedback(true);
      playStar();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const selectedAnimal = selectedNumber !== null ? NUMBER_ANIMALS[selectedNumber] : null;

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="数字动物乐园" 
        subtitle={`已学习 ${learnedNumbers.length}/11 个数字`}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Number Display */}
        {selectedAnimal && (
          <Animated.View style={[styles.selectedCard, animatedStyle]}>
            <Text style={styles.selectedAnimal}>{selectedAnimal.animal}</Text>
            <Text style={styles.selectedNumber}>{selectedAnimal.number}</Text>
            <Text style={styles.selectedName}>{selectedAnimal.name}</Text>
            <Text style={styles.selectedDescription}>{selectedAnimal.description}</Text>
            <View style={styles.soundBubble}>
              <Text style={styles.soundText}>"{selectedAnimal.sound}"</Text>
            </View>
          </Animated.View>
        )}

        {/* Number Grid */}
        <View style={styles.numberGrid}>
          {NUMBER_ANIMALS.map((item) => {
            const isLearned = learnedNumbers.includes(item.number);
            const isSelected = selectedNumber === item.number;
            
            return (
              <TouchableOpacity
                key={item.number}
                style={[
                  styles.numberButton,
                  isLearned && styles.numberButtonLearned,
                  isSelected && styles.numberButtonSelected,
                ]}
                onPress={() => handleNumberPress(item.number)}
                activeOpacity={0.7}
              >
                <Text style={styles.numberEmoji}>{item.animal}</Text>
                <Text style={[
                  styles.numberText,
                  isSelected && styles.numberTextSelected,
                ]}>
                  {item.number}
                </Text>
                {isLearned && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
          <Text style={styles.instructionText}>
            点击每个数字，认识它对应的动物朋友！{"\n"}
            每学会一个数字，就能获得一颗星星哦！
          </Text>
        </View>
      </ScrollView>

      <Feedback
        visible={showFeedback}
        type={feedbackType}
        message={feedbackType === "celebration" ? "太厉害了！学会了所有数字！" : "真棒！又学会一个数字！"}
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
  },
  selectedAnimal: {
    fontSize: 80,
    marginBottom: 8,
  },
  selectedNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF9500",
  },
  selectedName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#3D2914",
    marginTop: 8,
  },
  selectedDescription: {
    fontSize: 16,
    color: "#8B7355",
    marginTop: 4,
  },
  soundBubble: {
    backgroundColor: "#FFF8E7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  soundText: {
    fontSize: 16,
    color: "#FF9500",
    fontStyle: "italic",
  },
  numberGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  numberButton: {
    width: 80,
    height: 100,
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
  },
  numberButtonLearned: {
    backgroundColor: "#E8FFE8",
    borderWidth: 2,
    borderColor: "#34C759",
  },
  numberButtonSelected: {
    backgroundColor: "#FFF8E7",
    borderWidth: 2,
    borderColor: "#FF9500",
    transform: [{ scale: 1.05 }],
  },
  numberEmoji: {
    fontSize: 32,
  },
  numberText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginTop: 4,
  },
  numberTextSelected: {
    color: "#FF9500",
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
