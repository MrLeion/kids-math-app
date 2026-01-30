import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ModuleCard } from "@/components/module-card";
import { getProgress, type GameProgress } from "@/lib/storage";

const MODULES = [
  {
    id: "basic",
    title: "基础认知",
    subtitle: "认识数字、符号、数物对应",
    icon: "🌟",
    color: "#FFD60A",
    route: "/modules/basic",
  },
  {
    id: "counting",
    title: "计数能力",
    subtitle: "数一数、比大小、数字填空",
    icon: "🔢",
    color: "#5AC8FA",
    route: "/modules/counting",
  },
  {
    id: "arithmetic",
    title: "运算启蒙",
    subtitle: "加法启蒙、减法启蒙",
    icon: "➕",
    color: "#34C759",
    route: "/modules/arithmetic",
  },
  {
    id: "life",
    title: "生活应用",
    subtitle: "认识时间、认识人民币",
    icon: "🎯",
    color: "#FF6B9D",
    route: "/modules/life",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const data = await getProgress();
    setProgress(data);
  };

  const getModuleProgress = (moduleId: string): number => {
    if (!progress) return 0;
    switch (moduleId) {
      case "basic":
        return Math.min(
          100,
          Math.round(
            ((progress.numbersLearned.length / 11) * 40 +
              (progress.symbolsLearned.length / 5) * 30 +
              (progress.numberObjectCompleted / 10) * 30)
          )
        );
      case "counting":
        return Math.min(
          100,
          Math.round(
            ((progress.countingScore / 30) * 40 +
              (progress.compareScore / 20) * 30 +
              (progress.fillBlankScore / 20) * 30)
          )
        );
      case "arithmetic":
        return Math.min(
          100,
          Math.round(
            ((progress.additionScore / 30) * 50 +
              (progress.subtractionScore / 30) * 50)
          )
        );
      case "life":
        return Math.min(
          100,
          Math.round(
            ((progress.timeScore / 20) * 50 + (progress.moneyScore / 20) * 50)
          )
        );
      default:
        return 0;
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>你好，小朋友！</Text>
              <Text style={styles.title}>数学小天才</Text>
            </View>
            <View style={styles.starsContainer}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.starsCount}>{progress?.totalStars || 0}</Text>
            </View>
          </View>
          <View style={styles.mascotContainer}>
            <Text style={styles.mascot}>🐼</Text>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>今天想学什么呢？</Text>
            </View>
          </View>
        </View>

        {/* Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>学习模块</Text>
          {MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              title={module.title}
              subtitle={module.subtitle}
              icon={module.icon}
              color={module.color}
              progress={getModuleProgress(module.id)}
              onPress={() => router.push(module.route as any)}
            />
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>学习统计</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {progress?.numbersLearned.length || 0}
              </Text>
              <Text style={styles.statLabel}>已学数字</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {(progress?.additionScore || 0) +
                  (progress?.subtractionScore || 0)}
              </Text>
              <Text style={styles.statLabel}>运算题目</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {progress?.totalStars || 0}
              </Text>
              <Text style={styles.statLabel}>获得星星</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 16,
    color: "#8B7355",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3D2914",
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  starIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  starsCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2914",
  },
  mascotContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  mascot: {
    fontSize: 64,
  },
  speechBubble: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speechText: {
    fontSize: 16,
    color: "#3D2914",
  },
  modulesSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 16,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF9500",
  },
  statLabel: {
    fontSize: 12,
    color: "#8B7355",
    marginTop: 4,
  },
});
