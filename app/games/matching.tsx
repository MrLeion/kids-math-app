import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

const FRUITS = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍌", "🍑", "🍒"];

function generateQuestion() {
  const targetNumber = Math.floor(Math.random() * 9) + 1; // 1-9
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  
  // 生成选项（包含正确答案）
  const options = new Set<number>();
  options.add(targetNumber);
  while (options.size < 4) {
    const option = Math.floor(Math.random() * 9) + 1;
    options.add(option);
  }
  
  return {
    targetNumber,
    fruit,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

export default function MatchingGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("matching");

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.numberObjectCompleted);
  };

  const handleOptionPress = async (option: number) => {
    if (selectedOption !== null) return; // 防止重复点击
    
    setSelectedOption(option);
    playClick();
    
    if (Platform.OS !== "web") {
      if (option === question.targetNumber) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    if (option === question.targetNumber) {
      const newScore = score + 1;
      setScore(newScore);
      await saveProgress({ numberObjectCompleted: newScore });
      await addStars(1);
      
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
    
    if (round < totalRounds) {
      setRound(round + 1);
      setQuestion(generateQuestion());
    } else {
      // 重新开始
      setRound(1);
      setQuestion(generateQuestion());
    }
  };

  // 生成水果显示
  const renderFruits = () => {
    const fruits = [];
    for (let i = 0; i < question.targetNumber; i++) {
      fruits.push(
        <Text key={i} style={styles.fruitItem}>
          {question.fruit}
        </Text>
      );
    }
    return fruits;
  };

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="水果丰收乐园" 
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#FFD60A" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>数一数，有几个水果？</Text>
          <View style={styles.fruitsContainer}>
            {renderFruits()}
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === question.targetNumber;
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
                <Text style={[
                  styles.optionText,
                  showResult && isSelected && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Score Display */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>已完成</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreUnit}>题</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
          <Text style={styles.instructionText}>
            数一数图中有几个水果，然后选择正确的数字！{"\n"}
            答对了可以获得星星哦！
          </Text>
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
  questionCard: {
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
  questionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 20,
  },
  fruitsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    maxWidth: 280,
  },
  fruitItem: {
    fontSize: 48,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 3,
    borderColor: "#F0E6D3",
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
    fontSize: 36,
    fontWeight: "bold",
    color: "#3D2914",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#8B7355",
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF9500",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
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
