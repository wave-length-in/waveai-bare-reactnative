import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";

const FloatingLabelInput = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [firstName, setFirstName] = useState("");

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <Text
        style={[
          styles.label,
          (isFocused || firstName) && styles.labelFocused,
        ]}
      >
        First Name
      </Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export default FloatingLabelInput;

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 8,
    position: "relative",
  },
  containerFocused: {
    borderColor: "#007BFF",
  },
  label: {
    position: "absolute",
    left: 10,
    top: 14,
    color: "#999",
    fontSize: 16,
    zIndex: 1,
  },
  labelFocused: {
    top: 4,
    fontSize: 12,
    color: "#007BFF",
  },
  input: {
    fontSize: 16,
    color: "#000",
  },
});
