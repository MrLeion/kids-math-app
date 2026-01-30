import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

const BUGS = [
  { emoji: "🦋", name: "蝴蝶" },
  { emoji: "🐝", name: "蜜蜂" },
  { emoji: "🐛", name: "毛毛虫" },
  { emoji: "🐞", name: "瓢虫" },
  { emoji: "🦗", name: "蟋蟀" },
];

function generateQuestion() {
  const bug = BUGS[Math.floor(Math.random() * BUGS.length)];
  const count = Math.floor(Math.random() * 8) + 2; // 2-9
  
  // 生成选项
  const options = new Set<number>();
  options.add(count);
  while (options.size < 4) {
    const option = Math.floor(Math.random() * 8) + 2;
    options.add(option);
  }
  
  return {
    bug,
    count,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

function AnimatedBug({ emoji, delay }: { emoji: string; delay: number }) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-10, { duration: 800 }), -1, true)
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(0.1, { duration: 500 }), -1, true)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}rad` },
    ],
  }));

  return (
    <Animated.Text style={[styles.bugItem, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export default function CountGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [countedBugs, setCountedBugs] = useState<number[]>([]);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("count");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.countingScore);
  };

  const handleBugTap = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playClick();
    
    if (!countedBugs.includes(index)) {
      setCountedBugs([...countedBugs, index]);
    }
  };

  const handleOptionPress = async (option: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    
    if (Platform.OS !== "web") {
      if (option === question.count) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    if (option === question.count) {
      const newScore = score + 1;
      setScore(newScore);
      await saveProgress({ countingScore: newScore });
      await addStars(1);
      
      // 检查成就
      if (newScore === 10) {
        await unlockAchievement({
          id: "counting_10",
          name: "计数新手",
          description: "完成10次计数练习",
          icon: "🐛",
        });
      }
      if (newScore === 30) {
        await unlockAchievement({
          id: "counting_30",
          name: "计数高手",
          description: "完成30次计数练习",
          icon: "🦋",
        });
      }
      
      if (round === totalRounds) {
        setFeedbackType("celebration");
      } else {
        setFeedbackType("success");
      }
    } else {
      setFeedbackType("error");
    }
    
    setShowFeedback(true);
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setCountedBugs([]);
    
    if (round < totalRounds) {
      setRound(round + 1);
      setQuestion(generateQuestion());
    } else {
      setRound(1);
      setQuestion(generateQuestion());
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="昆虫花园" 
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#5AC8FA" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Garden Scene */}
        <View style={styles.gardenCard}>
          <Text style={styles.questionTitle}>
            数一数，花园里有几只{question.bug.name}？
          </Text>
          <View style={styles.gardenScene}>
            <View style={styles.bugsContainer}>
              {Array.from({ length: question.count }).map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleBugTap(index)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.bugWrapper,
                    countedBugs.includes(index) && styles.bugCounted,
                  ]}>
                    <AnimatedBug 
                      emoji={question.bug.emoji} 
                      delay={index * 100}
                    />
                    {countedBugs.includes(index) && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                          {countedBugs.indexOf(index) + 1}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {/* Decorations */}
            <View style={styles.decorations}>
              <Text style={styles.flower}>🌸</Text>
              <Text style={styles.flower}>🌼</Text>
              <Text style={styles.flower}>🌺</Text>
              <Text style={styles.grass}>🌿</Text>
              <Text style={styles.grass}>🌱</Text>
            </View>
          </View>
          <Text style={styles.countHint}>
            已数: {countedBugs.length} 只
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === question.count;
            const showResult = selectedOption !== null;
            
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  showResult && isSelected && isCorrect && styles.optionCorrect,
                  showResult && isSelected && !isCorrect && styles.optionWrong,
                  showResult && !isSelected && isCorrect && styles.optionCorrectHint,
                ]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.7}
                disabled={selectedOption !== null}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>已完成</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreUnit}>题</Text>
        </View>
      </ScrollView>

      <Feedback
        visible={showFeedback}
        type={feedbackType}
        onComplete={handleFeedbackComplete}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gardenCard: {
    backgroundColor: "#E8FFE8",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#34C759",
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
    textAlign: "center",
    marginBottom: 16,
  },
  gardenScene: {
    backgroundColor: "#C8F7C8",
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    position: "relative",
  },
  bugsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    zIndex: 2,
  },
  bugWrapper: {
    position: "relative",
  },
  bugItem: {
    fontSize: 40,
  },
  bugCounted: {
    opacity: 0.8,
  },
  countBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF9500",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  decorations: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  flower: {
    fontSize: 24,
  },
  grass: {
    fontSize: 20,
  },
  countHint: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
    color: "#34C759",
    fontWeight: "600",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    width: 70,
    height: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 3,
    borderColor: "#5AC8FA",
  },
  optionCorrect: {
    backgroundColor: "#E8FFE8",
    borderColor: "#34C759",
  },
  optionWrong: {
    backgroundColor: "#FFE8E8",
    borderColor: "#FF6B6B",
  },
  optionCorrectHint: {
    borderColor: "#34C759",
    borderStyle: "dashed",
  },
  optionText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3D2914",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#E8F7FF",
    borderRadius: 16,
    padding: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#8B7355",
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#5AC8FA",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
  },
});
