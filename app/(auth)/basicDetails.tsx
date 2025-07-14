import { getCharacters } from "@/services/characters";
import { CharactersImages } from "@/static/characters";
import { Character } from "@/types/character";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function basicDetails() {

  const router = useRouter();
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([]);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDataLoading(true);
    const fetchCharacters = async () => {
      const data = await getCharacters();
      setCharacters(data);
      setDataLoading(false);
    };

    fetchCharacters();
  }, []);

  const [userName, setUserName] = useState("");

  const handleNameChange = (text: string) => {
    setUserName(text);
  };

  const getCharacterImage = (id: number) => {
    const found = CharactersImages.find((img) => img.id === id);
    return found?.image // fallback if not found
  };


  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/(main)/home");
    }, 2000);
  };

  const toggleCharacterSelection = (id: number) => {
    setSelectedCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((charId) => charId !== id) : [...prev, id]
    );
  };

  const renderSkeletons = () => {
    const skeletons = Array.from({ length: 6 }); // show 6 placeholders
    return skeletons.map((_, index) => (
      <View
        key={index}
        className="relative bg-gray-200 m-1 w-[47%] h-36 rounded-xl animate-pulse"
      />
    ));
  };


  return (
    <LinearGradient
      colors={["#ffffff", "#FFE4F5"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      className="p-10 h-full rounded-2xl relative"
    >
      {/* Enter Your Name */}
      <View className="my-10">
        <Text className="text-3xl text-black font-sans my-4">Enter Your Name</Text>
        <View style={styles.inputContainer} className="flex-row items-center">
          <TextInput
            placeholder="Enter your name"
            keyboardType="default"
            maxLength={100}
            value={userName}
            onChangeText={handleNameChange}
            className="flex-1 text-lg py-3 text-black"
          />
        </View>
      </View>

      <Text className="text-2xl text-black font-sans mb-4">Choose Your Character</Text>

      <ScrollView className="p-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          {dataLoading
            ? renderSkeletons()
            : characters.map((character) => {
              const isSelected = selectedCharacterIds.includes(character.id);
              return (
                <TouchableOpacity
                  key={character.id}
                  onPress={() => toggleCharacterSelection(character.id)}
                  className={`relative bg-white m-1 shadow-xl border w-[47%] ${isSelected ? 'border-2 border-purple-500' : 'border-gray-200'
                    }`}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="green"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        backgroundColor: 'white',
                        borderRadius: 12,
                      }}
                    />
                  )}

                  <Image
                    source={getCharacterImage(character.id)}
                    className="w-full h-40"
                    resizeMode="cover"
                  />

                  <Text className="absolute shadow-xl w-[90%] p-2 rounded-full text-center bottom-2 left-2 bg-white text-md font-bold text-purple-700">
                    {character.name.slice(0, 10)}
                  </Text>
                </TouchableOpacity>
              );
            })}

        </View>
      </ScrollView>

      <TouchableOpacity
        disabled={userName === '' || characters.length === 0}
        className="mt-5 rounded-full overflow-hidden"
      >
        <LinearGradient
          colors={["#9578D9", "#0096FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row w-full justify-center items-center py-4 px-4 rounded-full"
        >
          {loading ? (
            <ActivityIndicator size={25} color="#fff" />
          ) : (
            <TouchableOpacity onPress={handleContinue} className="flex-row items-center">
              <Text className="text-white font-semibold text-lg mr-2">Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  )
};

const styles = StyleSheet.create({
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#4f4f4f',
  },
  scrollContainer: {
    height: '60%'
  }
});