import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export const HeaderName: React.FC = () => {
    return (
        <View className="">
            <LinearGradient
                colors={['#0096FF50', '#FF69B410']}
                className=""
                style={{ borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }}
            >
                <View style={styles.headerContainer} className="pt-14 rounded-b-[4rem] pb-6 flex flex-row justify-between items-center gap-40 w-full">
                    <Image
                        source={require("../../assets/images/Wave_logo_RGB.png")}
                        width={100}
                        height={60}
                        className='w-32 h-12  mx-auto object-contain'
                        resizeMode='contain'
                    />
                    <Image
                        source={require("../../assets/images/myavtar.webp")}
                        width={100}
                        height={100}
                        className='w-14 h-14 p-2 rounded-full mx-auto object-contain'
                    />
                </View>
            </LinearGradient>

            <View className='w-[90%] mt-4 mx-auto'>
                <Text className='text-3xl font-semibold'>Hey, <Text className='text-purple-500'>Aastha</Text></Text>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    headerContainer: {
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    }
});