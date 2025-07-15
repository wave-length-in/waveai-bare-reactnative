import { HeaderName } from '@/components/home/HomeHeader';
import { RecentChatSection } from '@/components/home/RecentChatSection';
import React from 'react';
import { View } from 'react-native';

export default function HomePage() {
  return (
    <View className='flex-1 bg-white w-full'>
      <HeaderName />
      <RecentChatSection />
    </View>
  )
}