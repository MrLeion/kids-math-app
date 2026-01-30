import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GameHeader } from "@/components/game-header";
import { SubModuleCard } from "@/components/module-card";

const SUB_MODULES = [
  {
    id: "addition",
    title: "加法启蒙",
    description: "合并、实物演示、数轴加法",
    icon: "🦋",
    route: "/games/addition",
  },
  {
    id: "subtraction",
    title: "减法启蒙",
    description: "拿走、比较、实物演示",
    icon: "🍎",
    route: "/games/subtraction",
  },
];

export default function ArithmeticScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="bg-background">
      <GameHeader title="运算启蒙" subtitle="➕ 学习加法和减法" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introEmoji}>➕</Text>
          <Text style={styles.introTitle}>欢迎来到运算启蒙！</Text>
          <Text style={styles.introText}>
            看蝴蝶飞来合并，看苹果掉落减少，和青蛙一起在荷叶上跳跃学习数轴！
          </Text>
        </View>

        {/* Sub Modules */}
        <View style={styles.modulesSection}>
          {SUB_MODULES.map((module) => (
            <SubModuleCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              color="#34C759"
              stars={0}
              onPress={() => router.push(module.route as any)}
            />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: "#E8FFED",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#34C759",
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3D2914",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 22,
  },
  modulesSection: {
    gap: 12,
  },
});
