import { useState, useEffect, useRef } from "react";
import { ScrollView, Text, View, StyleSheet, Platform, Dimensions, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useGameAudio } from "@/lib/audio-manager";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { Feedback } from "@/components/feedback";
import { getProgress, saveProgress, addStars, unlockAchievement } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

// 难度配置常量
const START_TOLERANCE = 80; // 起点检测范围扩大（从60增加到80）
const END_TOLERANCE = 80; // 终点检测范围扩大（从60增加到80）
const PATH_TOLERANCE = 0.4; // 路径容差从20%增加到40%
const MIN_ACCURACY = 0.3; // 准确度要求从50%降低到30%
const MIN_POINTS = 3; // 最小点数从5降低到3

// 数字书写路径（简化版SVG路径点）
const NUMBER_PATHS: Record<number, { points: { x: number; y: number }[]; description: string }> = {
  0: {
    points: [
      { x: 0.5, y: 0.1 }, { x: 0.8, y: 0.3 }, { x: 0.8, y: 0.7 },
      { x: 0.5, y: 0.9 }, { x: 0.2, y: 0.7 }, { x: 0.2, y: 0.3 }, { x: 0.5, y: 0.1 },
    ],
    description: "从上往下画一个椭圆",
  },
  1: {
    points: [
      { x: 0.3, y: 0.2 }, { x: 0.5, y: 0.1 }, { x: 0.5, y: 0.9 },
    ],
    description: "从左上斜下，然后直直往下",
  },
  2: {
    points: [
      { x: 0.2, y: 0.3 }, { x: 0.3, y: 0.1 }, { x: 0.7, y: 0.1 },
      { x: 0.8, y: 0.3 }, { x: 0.2, y: 0.9 }, { x: 0.8, y: 0.9 },
    ],
    description: "画个小弯钩，再斜下画横线",
  },
  3: {
    points: [
      { x: 0.2, y: 0.2 }, { x: 0.6, y: 0.1 }, { x: 0.7, y: 0.3 },
      { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.7 }, { x: 0.6, y: 0.9 }, { x: 0.2, y: 0.8 },
    ],
    description: "画两个向右的弯弯",
  },
  4: {
    points: [
      { x: 0.6, y: 0.1 }, { x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 },
      { x: 0.6, y: 0.6 }, { x: 0.6, y: 0.9 },
    ],
    description: "先斜下，再横着，最后往下",
  },
  5: {
    points: [
      { x: 0.7, y: 0.1 }, { x: 0.3, y: 0.1 }, { x: 0.3, y: 0.4 },
      { x: 0.6, y: 0.4 }, { x: 0.8, y: 0.6 }, { x: 0.6, y: 0.9 }, { x: 0.2, y: 0.8 },
    ],
    description: "先横着，再往下，画个弯弯",
  },
  6: {
    points: [
      { x: 0.7, y: 0.2 }, { x: 0.5, y: 0.1 }, { x: 0.2, y: 0.4 },
      { x: 0.2, y: 0.7 }, { x: 0.5, y: 0.9 }, { x: 0.7, y: 0.7 },
      { x: 0.5, y: 0.5 }, { x: 0.2, y: 0.6 },
    ],
    description: "从上往下画个大弯，再画个小圈",
  },
  7: {
    points: [
      { x: 0.2, y: 0.1 }, { x: 0.8, y: 0.1 }, { x: 0.4, y: 0.9 },
    ],
    description: "先横着，再斜斜往下",
  },
  8: {
    points: [
      { x: 0.5, y: 0.5 }, { x: 0.3, y: 0.3 }, { x: 0.5, y: 0.1 },
      { x: 0.7, y: 0.3 }, { x: 0.5, y: 0.5 }, { x: 0.3, y: 0.7 },
      { x: 0.5, y: 0.9 }, { x: 0.7, y: 0.7 }, { x: 0.5, y: 0.5 },
    ],
    description: "画两个叠在一起的圈圈",
  },
  9: {
    points: [
      { x: 0.7, y: 0.4 }, { x: 0.5, y: 0.1 }, { x: 0.3, y: 0.3 },
      { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.3 }, { x: 0.7, y: 0.7 },
      { x: 0.5, y: 0.9 }, { x: 0.3, y: 0.8 },
    ],
    description: "先画个小圈，再往下弯弯",
  },
};

interface Point {
  x: number;
  y: number;
}

export default function WritingGameScreen() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [completedNumbers, setCompletedNumbers] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "celebration">("success");
  const [attempts, setAttempts] = useState(0);
  const drawnPointsRef = useRef<Point[]>([]);

  const scale = useSharedValue(1);
  const starX = useSharedValue(0);
  const starY = useSharedValue(0);
  const starOpacity = useSharedValue(0);

  // 新增动画值
  const starScale = useSharedValue(1); // 五角星缩放动画
  const starGlow = useSharedValue(0); // 光晕效果（0=无，1=绿色，0.5=黄色）
  const endPointScale = useSharedValue(1); // 终点脉动动画
  const glowColor = useSharedValue('#34C759'); // 光晕颜色
  const guideRingOpacity = useSharedValue(0); // 接近终点的引导圆环

  // 音频系统
  const { playClick, playStar } = useGameAudio("numbers");

  const resetStar = () => {
    const start = NUMBER_PATHS[currentNumber].points[0];
    starX.value = withSpring(start.x * CANVAS_SIZE);
    starY.value = withSpring(start.y * CANVAS_SIZE);
    starOpacity.value = 1;
  };

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    resetStar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNumber]);

  // 五角星脉动动画（未开始绘制时）
  useEffect(() => {
    if (!isDrawing) {
      starScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // 无限循环
        false
      );
    } else {
      starScale.value = withTiming(1.0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawing]);

  // 终点脉动动画（相位相反）
  useEffect(() => {
    endPointScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProgress = async () => {
    const progress = await getProgress();
    if (progress.writingCompleted) {
      setCompletedNumbers(progress.writingCompleted);
    }
  };

  const clearCanvas = () => {
    setDrawnPoints([]);
    drawnPointsRef.current = [];
    setAttempts(0);
    resetStar();
  };

  const checkDrawing = async () => {
    const points = drawnPointsRef.current;
    if (points.length < MIN_POINTS) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    playClick();

    // 简化的检测逻辑：检查绘制点是否覆盖了关键区域
    const targetPath = NUMBER_PATHS[currentNumber];
    let matchedPoints = 0;
    const tolerance = CANVAS_SIZE * PATH_TOLERANCE; // 使用全局容差常量

    for (const targetPoint of targetPath.points) {
      const targetX = targetPoint.x * CANVAS_SIZE;
      const targetY = targetPoint.y * CANVAS_SIZE;

      for (const drawnPoint of points) {
        const distance = Math.sqrt(
          Math.pow(drawnPoint.x - targetX, 2) + Math.pow(drawnPoint.y - targetY, 2)
        );
        if (distance < tolerance) {
          matchedPoints++;
          break;
        }
      }
    }

    const accuracy = matchedPoints / targetPath.points.length;
    const isCorrect = accuracy >= MIN_ACCURACY; // 使用降低的准确度要求

    if (isCorrect) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 保存进度
      if (!completedNumbers.includes(currentNumber)) {
        const newCompleted = [...completedNumbers, currentNumber];
        setCompletedNumbers(newCompleted);
        await saveProgress({ writingCompleted: newCompleted });
        await addStars(2);
        playStar();

        // 检查成就
        if (newCompleted.length === 10) {
          await unlockAchievement({
            id: "writing_master",
            name: "书写大师",
            description: "完成所有数字书写练习",
            icon: "✍️",
          });
          setFeedbackType("celebration");
        } else {
          setFeedbackType("success");
        }
      } else {
        setFeedbackType("success");
      }
      setShowFeedback(true);

      // 动画效果
      scale.value = withSequence(
        withSpring(1.1),
        withTiming(1, { duration: 200 })
      );
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setAttempts(attempts + 1);
      setFeedbackType("error");
      setShowFeedback(true);
    }
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    if (feedbackType !== "error") {
      clearCanvas();
      if (currentNumber < 9) {
        setCurrentNumber(currentNumber + 1);
      }
    }
  };

  const selectNumber = (num: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playClick();
    setCurrentNumber(num);
    clearCanvas();
  };

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      const start = NUMBER_PATHS[currentNumber].points[0];
      const startXPos = start.x * CANVAS_SIZE;
      const startYPos = start.y * CANVAS_SIZE;
      const dist = Math.sqrt(Math.pow(e.x - startXPos, 2) + Math.pow(e.y - startYPos, 2));

      if (dist < START_TOLERANCE) {
        setIsDrawing(true);
        const p = { x: e.x, y: e.y };
        setDrawnPoints([p]);
        drawnPointsRef.current = [p];
        starX.value = e.x;
        starY.value = e.y;
        starOpacity.value = 1;
      }
    })
    .onUpdate((e) => {
      if (!isDrawing) return;

      const x = e.x;
      const y = e.y;

      // 更新五角星位置
      starX.value = x;
      starY.value = y;

      // 记录轨迹点
      const p = { x, y };
      drawnPointsRef.current.push(p);
      setDrawnPoints([...drawnPointsRef.current]);

      // 路径偏离检测
      const path = NUMBER_PATHS[currentNumber];
      const tolerance = CANVAS_SIZE * PATH_TOLERANCE;
      const isNearPath = path.points.some((point) => {
        const px = point.x * CANVAS_SIZE;
        const py = point.y * CANVAS_SIZE;
        const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
        return distance < tolerance;
      });

      // 根据是否在路径上改变光晕颜色
      if (isNearPath || drawnPointsRef.current.length < 3) {
        glowColor.value = '#34C759'; // 绿色
        starGlow.value = withTiming(1, { duration: 150 });
      } else {
        glowColor.value = '#FFD60A'; // 黄色警告
        starGlow.value = withTiming(0.6, { duration: 150 });
        // 轻微震动提示
        if (drawnPointsRef.current.length % 8 === 0 && Platform.OS !== 'web') {
          runOnJS(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          })();
        }
      }

      // 接近终点时的引导
      const endPoint = {
        x: path.points[path.points.length - 1].x * CANVAS_SIZE,
        y: path.points[path.points.length - 1].y * CANVAS_SIZE,
      };
      const distanceToEnd = Math.sqrt(
        Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2)
      );

      if (distanceToEnd < 100) {
        guideRingOpacity.value = withTiming(0.5, { duration: 300 });
      } else {
        guideRingOpacity.value = withTiming(0, { duration: 300 });
      }
    })
    .onEnd((e) => {
      if (isDrawing) {
        setIsDrawing(false);
        const end = NUMBER_PATHS[currentNumber].points[NUMBER_PATHS[currentNumber].points.length - 1];
        const endXPos = end.x * CANVAS_SIZE;
        const endYPos = end.y * CANVAS_SIZE;
        const dist = Math.sqrt(Math.pow(e.x - endXPos, 2) + Math.pow(e.y - endYPos, 2));

        // 重置光晕
        starGlow.value = withTiming(0, { duration: 300 });
        guideRingOpacity.value = withTiming(0, { duration: 300 });

        if (dist < END_TOLERANCE) {
          runOnJS(checkDrawing)();
        } else {
          runOnJS(resetStar)();
        }
      }
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    left: starX.value - 20, // 中心对齐（40px/2）
    top: starY.value - 20,
    opacity: starOpacity.value,
    transform: [{ scale: starScale.value }],
  }));

  const starGlowStyle = useAnimatedStyle(() => ({
    opacity: starGlow.value,
    backgroundColor: glowColor.value,
  }));

  const endPointAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: endPointScale.value }],
  }));

  const guideRingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: guideRingOpacity.value,
  }));

  const targetPath = NUMBER_PATHS[currentNumber];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer className="bg-background">
        <GameHeader
          title="数字书写练习"
          subtitle={`已完成 ${completedNumbers.length}/10 个数字`}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Number selector */}
          <View style={styles.numberSelector}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isCompleted = completedNumbers.includes(num);
              const isSelected = currentNumber === num;
              return (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberTab,
                    isSelected && styles.numberTabSelected,
                    isCompleted && styles.numberTabCompleted,
                  ]}
                  onPress={() => selectNumber(num)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.numberTabText,
                      isSelected && styles.numberTabTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                  {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Writing canvas */}
          <Animated.View style={[styles.canvasContainer, animatedStyle]}>
            <Text style={styles.canvasTitle}>用手指描摹数字 {currentNumber}</Text>
            <Text style={styles.canvasHint}>{targetPath.description}</Text>

            <GestureDetector gesture={panGesture}>
              <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}>
                {/* Start point */}
                <View
                  style={[
                    styles.pointIndicator,
                    styles.startPoint,
                    {
                      left: NUMBER_PATHS[currentNumber].points[0].x * CANVAS_SIZE - 12,
                      top: NUMBER_PATHS[currentNumber].points[0].y * CANVAS_SIZE - 12,
                    },
                  ]}
                >
                  <Text style={styles.pointLabel}>起点</Text>
                </View>

                {/* End point with animation */}
                <Animated.View
                  style={[
                    styles.pointIndicator,
                    styles.endPoint,
                    {
                      left:
                        NUMBER_PATHS[currentNumber].points[
                          NUMBER_PATHS[currentNumber].points.length - 1
                        ].x *
                        CANVAS_SIZE -
                        20,
                      top:
                        NUMBER_PATHS[currentNumber].points[
                          NUMBER_PATHS[currentNumber].points.length - 1
                        ].y *
                        CANVAS_SIZE -
                        20,
                    },
                    endPointAnimatedStyle,
                  ]}
                >
                  <View style={styles.endPointCircle}>
                    <Text style={styles.pointLabel}>终点</Text>
                  </View>
                </Animated.View>

                {/* Guide ring for approaching end point */}
                <Animated.View
                  style={[
                    styles.guideRing,
                    {
                      left:
                        NUMBER_PATHS[currentNumber].points[
                          NUMBER_PATHS[currentNumber].points.length - 1
                        ].x *
                        CANVAS_SIZE -
                        50,
                      top:
                        NUMBER_PATHS[currentNumber].points[
                          NUMBER_PATHS[currentNumber].points.length - 1
                        ].y *
                        CANVAS_SIZE -
                        50,
                    },
                    guideRingAnimatedStyle,
                  ]}
                />

                {/* Guide path */}
                {showGuide && (
                  <View style={styles.guidePath}>
                    <Text style={styles.guideNumber}>{currentNumber}</Text>
                  </View>
                )}

                {/* Drawn path */}
                <View style={styles.drawnPath}>
                  {drawnPoints.map((point, index) => (
                    <View
                      key={index}
                      style={[
                        styles.drawnDot,
                        {
                          left: point.x - 4,
                          top: point.y - 4,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Star following with glow effect */}
                <Animated.View style={[styles.followingStar, starAnimatedStyle]}>
                  {/* Glow effect */}
                  <Animated.View style={[styles.starGlow, starGlowStyle]} />
                  {/* Star emoji */}
                  <Text style={styles.starEmoji}>⭐</Text>
                </Animated.View>
              </View>
            </GestureDetector>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.clearButton]}
                onPress={clearCanvas}
                activeOpacity={0.7}
              >
                <Text style={styles.controlButtonText}>🗑️ 清除</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.guideButton]}
                onPress={() => setShowGuide(!showGuide)}
                activeOpacity={0.7}
              >
                <Text style={styles.controlButtonText}>
                  {showGuide ? "👁️ 隐藏" : "👁️ 显示"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.checkButton]}
                onPress={checkDrawing}
                activeOpacity={0.7}
              >
                <Text style={[styles.controlButtonText, { color: "#FFFFFF" }]}>
                  ✓ 检查
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Tips */}
          {attempts > 0 && (
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>💡 小提示</Text>
              <Text style={styles.tipText}>
                {attempts === 1 && "试着跟着灰色的数字描摹哦！"}
                {attempts === 2 && "慢慢来，一笔一划地画！"}
                {attempts >= 3 && "很棒！继续练习，你一定可以的！"}
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>🎮 玩法说明</Text>
            <Text style={styles.instructionText}>
              1. 选择要练习的数字{"\n"}
              2. 用手指在画布上描摹数字{"\n"}
              3. 点击&quot;检查&quot;按钮验证{"\n"}
              4. 每完成一个数字获得2颗星星！
            </Text>
          </View>
        </ScrollView>

        <Feedback
          visible={showFeedback}
          type={feedbackType}
          message={
            feedbackType === "celebration"
              ? "太厉害了！完成所有数字书写！"
              : feedbackType === "success"
                ? "写得真棒！"
                : "再试一次，你可以的！"
          }
          onComplete={handleFeedbackComplete}
        />
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  numberSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  numberTab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  numberTabSelected: {
    borderColor: "#FF9500",
    backgroundColor: "#FFF8E7",
  },
  numberTabCompleted: {
    borderColor: "#34C759",
    backgroundColor: "#E8FFE8",
  },
  numberTabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3D2914",
  },
  numberTabTextSelected: {
    color: "#FF9500",
  },
  checkMark: {
    position: "absolute",
    top: -4,
    right: -4,
    fontSize: 10,
    color: "#34C759",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: 16,
    height: 16,
    textAlign: "center",
    lineHeight: 16,
  },
  canvasContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  canvasTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 4,
  },
  canvasHint: {
    fontSize: 14,
    color: "#8B7355",
    marginBottom: 16,
  },
  canvas: {
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFD60A",
    borderStyle: "dashed",
    position: "relative",
    overflow: "hidden",
  },
  guidePath: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  guideNumber: {
    fontSize: 180,
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.1)",
  },
  drawnPath: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawnDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF9500",
  },
  pointIndicator: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startPoint: {
    borderColor: "#34C759",
    backgroundColor: "rgba(52, 199, 89, 0.3)",
  },
  endPoint: {
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255, 59, 48, 0.3)",
  },
  endPointCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#3D2914",
  },
  guideRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#5AC8FA",
    borderStyle: "dashed",
  },
  followingStar: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  starGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -10,
    left: -10,
    shadowColor: "#FFD60A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  starEmoji: {
    fontSize: 40,
    lineHeight: 40,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#F5F5F5",
  },
  guideButton: {
    backgroundColor: "#F5F5F5",
  },
  checkButton: {
    backgroundColor: "#34C759",
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3D2914",
  },
  tipCard: {
    backgroundColor: "#FFF8E7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFD60A",
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9500",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#8B7355",
    lineHeight: 22,
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
