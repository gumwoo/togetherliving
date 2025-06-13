import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CommunityBoard } from '../components/community';

const CommunityScreen = ({ navigation }) => {
  console.log('CommunityScreen: Component mounted');

  return (
    <View style={styles.container}>
      <CommunityBoard navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default CommunityScreen;
