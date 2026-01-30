import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader, ProgressIndicator } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars } from "@/lib/storage";

function generateQuestion() {
  const start = Math.floor(Math.random() * 6); // 0-5
  const sequence = [start, start + 1, start + 2, start + 3, start + 4];
  const blankIndex = Math.floor(Math.random() * 5);
  const answer = sequence[blankIndex];
  
  // 生成选项
  const options = new Set<number>();
  options.add(answer);
  while (options.size < 4) {
    const option = Math.floor(Math.random() * 10);
    if (option !== answer) {
      options.add(option);
    }
  }
  
  return {
    sequence,
    blankIndex,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
}

export default function FillBlankGameScreen() {
  const [question, setQuestion] = useState(generateQuestion());
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [trainMoving, setTrainMoving] = useState(false);

  const trainPosition = useSharedValue(0);
  const wheelRotation = useSharedValue(0);

  const totalRounds = 10;

  // 音频系统
  const { playClick } = useGameAudio("fillblank");

  useEffect(() => {
    loadProgress();
    // 车轮动画
    wheelRotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    setScore(progress.fillBlankScore);
  };

  const handleOptionPress = async (option: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    playClick();

    const isCorrect = option === question.answer;

    if (isCorrect) {
      // 火车开动动画
      setTrainMoving(true);
      trainPosition.value = withTiming(50, { duration: 1000 });
      
      setTimeout(async () => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const newScore = score + 1;
        setScore(newScore);
        await saveProgress({ fillBlankScore: newScore });
        await addStars(1);
        
        if (round === totalRounds) {
          setFeedbackType("celebration");
        } else {
          setFeedbackType("success");
        }
        setShowFeedback(true);
      }, 1000);
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setFeedbackType("error");
      setShowFeedback(true);
    }
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setTrainMoving(false);
    trainPosition.value = 0;
    
    if (round < totalRounds) {
      setRound(round + 1);
      setQuestion(generateQuestion());
    } else {
      setRound(1);
      setQuestion(generateQuestion());
    }
  };

  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: trainPosition.value }],
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotation.value}deg` }],
  }));

  return (
    <ScreenContainer className="bg-background">
      <GameHeader 
        title="火车车厢" 
        rightElement={<ProgressIndicator current={round} total={totalRounds} color="#5AC8FA" />}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Train Scene */}
        <View style={styles.trainCard}>
          <Text style={styles.questionTitle}>
            火车少了一节车厢，请找出正确的号码！
          </Text>
          
          <Animated.View style={[styles.trainContainer, trainStyle]}>
            {/* Engine */}
            <View style={styles.engine}>
              <Text style={styles.engineEmoji}>🚂</Text>
            </View>
            
            {/* Carriages */}
            {question.sequence.map((num, index) => (
              <View key={index} style={styles.carriage}>
                {index === question.blankIndex ? (
                  <View style={styles.blankCarriage}>
                    <Text style={styles.questionMark}>?</Text>
                    {selectedOption === question.answer && (
                      <Text style={styles.filledNumber}>{question.answer}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.carriageNumber}>{num}</Text>
                )}
                {/* Wheels */}
                <View style={styles.wheels}>
                  <Animated.View style={[styles.wheel, trainMoving && wheelStyle]} />
                  <Animated.View style={[styles.wheel, trainMoving && wheelStyle]} />
                </View>
              </View>
            ))}
          </Animated.View>
          
          {/* Track */}
          <View style={styles.track}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.trackTie} />
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>选择正确的数字：</Text>
          <View style={styles.optionsGrid}>
            {question.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === question.answer;
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
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>已完成</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreUnit}>题</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
          <Text style={styles.instructionText}>
            观察数字序列，找出缺少的车厢号码！{"\n"}
            答对了火车就会开动哦！呜呜～
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
  trainCard: {
    backgroundColor: "#E8F7FF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#5AC8FA",
    overflow: "hidden",
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
    textAlign: "center",
    marginBottom: 20,
  },
  trainContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  engine: {
    marginRight: 4,
  },
  engineEmoji: {
    fontSize: 48,
  },
  carriage: {
    width: 50,
    height: 60,
    backgroundColor: "#FFD60A",
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  blankCarriage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FF9500",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  questionMark: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF9500",
  },
  filledNumber: {
    position: "absolute",
    fontSize: 24,
    fontWeight: "bold",
    color: "#34C759",
  },
  carriageNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3D2914",
  },
  wheels: {
    position: "absolute",
    bottom: -8,
    flexDirection: "row",
    gap: 20,
  },
  wheel: {
    width: 12,
    height: 12,
    backgroundColor: "#333",
    borderRadius: 6,
  },
  track: {
    flexDirection: "row",
    height: 8,
    backgroundColor: "#8B7355",
    borderRadius: 2,
    overflow: "hidden",
  },
  trackTie: {
    width: 4,
    height: "100%",
    backgroundColor: "#5D4037",
    marginHorizontal: 8,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3D2914",
    marginBottom: 12,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
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
    color: "#5AC8FA",
  },
  scoreUnit: {
    fontSize: 16,
    color: "#8B7355",
    marginLeft: 4,
  },
  instructionCard: {
    backgroundColor: "#E8F7FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5AC8FA",
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
