// Fetch characters
import { Character } from "@/types/character";
import axios from "axios";

export const getCharacters = async (): Promise<Character[]> => {
  try {
    const response = await axios.get<Character[]>(
      `${process.env.EXPO_PUBLIC_WAVE_BACKEND_URL}/characters`
    );
    // console.log("API URL:", process.env.EXPO_PUBLIC_WAVE_BACKEND_URL);
    // console.log("Characters fetched successfully:", response.data);     
    return response.data;
  } catch (error) {
    console.error("Error fetching characters:", error);
    return [];
  }
};
