import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen name="[scenarioId]" options={{ title: "Chat" }} />
    </Stack>
  )
}