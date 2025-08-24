import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: "Chat", 
          headerShown: false // Set to false if you want to use your custom ChatHeader
        }} 
      />
    </Stack>
  );
}