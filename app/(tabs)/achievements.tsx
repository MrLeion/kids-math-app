import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getAchievements, getProgress, type Achievement, type GameProgress } from "@/lib/storage";

const ALL_ACHIEVEMENTS = [
  { id: "first_number", name: "数字启蒙", description: "学会第一个数字", icon: "🔢" },
  { id: "all_numbers", name: "数字大师", description: "学会所有数字0-10", icon: "🏆" },
  { id: "first_symbol", name: "符号探索", description: "认识第一个符号", icon: "➕" },
  { id: "all_symbols", name: "符号专家", description: "认识所有运算符号", icon: "🎯" },
  { id: "counting_10", name: "计数新手", description: "完成10次计数练习", icon: "🐛" },
  { id: "counting_30", name: "计数高手", description: "完成30次计数练习", icon: "🦋" },
  { id: "addition_10", name: "加法入门", description: "完成10道加法题", icon: "🌸" },
  { id: "subtraction_10", name: "减法入门", description: "完成10道减法题", icon: "🍎" },
  { id: "time_master", name: "时间管理", description: "掌握整点和半点", icon: "⏰" },
  { id: "money_wise", name: "理财小能手", description: "学会使用人民币", icon: "💰" },
  { id: "star_50", name: "星星收集者", description: "获得50颗星星", icon: "⭐" },
  { id: "star_100", name: "闪耀之星", description: "获得100颗星星", icon: "🌟" },
];

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<GameProgress | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [achievementsData, progressData] = await Promise.all([
      getAchievements(),
      getProgress(),
    ]);
    setAchievements(achievementsData);
    setProgress(progressData);
  };

  const isUnlocked = (id: string) => {
    return achievements.some((a) => a.id === id);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>成就相册</Text>
          <Text style={styles.subtitle}>
            已解锁 {achievements.length}/{ALL_ACHIEVEMENTS.length} 个成就
          </Text>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{progress?.totalStars || 0}</Text>
              <Text style={styles.progressLabel}>总星星</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{achievements.length}</Text>
              <Text style={styles.progressLabel}>成就</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>
                {progress?.numbersLearned.length || 0}
              </Text>
              <Text style={styles.progressLabel}>数字</Text>
            </View>
          </View>
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>全部成就</Text>
          <View style={styles.achievementsGrid}>
            {ALL_ACHIEVEMENTS.map((achievement) => {
              const unlocked = isUnlocked(achievement.id);
              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !unlocked && styles.achievementLocked,
                  ]}
                >
                  <Text style={styles.achievementIcon}>
                    {unlocked ? achievement.icon : "🔒"}
                  </Text>
                  <Text
                    style={[
                      styles.achievementName,
                      !unlocked && styles.textLocked,
                    ]}
                  >
                    {achievement.name}
                  </Text>
                  <Text
                    style={[
                      styles.achievementDesc,
                      !unlocked && styles.textLocked,
                    ]}
                  >
                    {achievement.description}
                  </Text>
                </View>
              );
            })}
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3D2914",
  },
  subtitle: {
    fontSize: 16,
    color: "#8B7355",
    marginTop: 4,
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F0E6D3",
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF9500",
  },
  progressLabel: {
    fontSize: 14,
    color: "#8B7355",
    marginTop: 4,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    width: "47%",
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
  achievementLocked: {
    backgroundColor: "#F5F5F5",
    opacity: 0.7,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3D2914",
    textAlign: "center",
  },
  achievementDesc: {
    fontSize: 12,
    color: "#8B7355",
    textAlign: "center",
    marginTop: 4,
  },
  textLocked: {
    color: "#AAAAAA",
  },
});
