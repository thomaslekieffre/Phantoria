import { GameShell } from "@/components/layout/game-shell";
import { StoryMapScreen } from "@/components/story/story-map-screen";

export default function StoryPage() {
  return (
    <GameShell active="camp">
      <StoryMapScreen />
    </GameShell>
  );
}
