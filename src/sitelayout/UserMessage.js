import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from "react-redux";

const UserMessage = () => {
  const state = useSelector((state) => state.messageReducer);
  const { message, isDisplay, classType } = state;

  if (!isDisplay) {
    return null;
  }

  const getMessageStyle = () => {
    switch (classType) {
      case 'success':
        return [styles.message, styles.successMessage];
      case 'failure':
        return [styles.message, styles.failureMessage];
      default:
        return [styles.message, styles.infoMessage];
    }
  };

  return (
    <View style={styles.container}>
      <View style={getMessageStyle()}>
        <Text style={styles.messageText}>
          <Text style={styles.boldText}>{message}</Text>
        </Text>
      </View>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    height:40,
    margin:5
  },
  message: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoMessage: {
    backgroundColor: '#d9edf7',
    borderColor: '#bce8f1',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  failureMessage: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  messageText: {
    fontSize: 10,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
  },
  spacer: {
    height: 16,
  },
});

export default UserMessage;