import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Linking,
} from "react-native";

const WelfareScreens = () => {
  // Placeholder functions for navigation

  const handleKnowMore = async (url) => {
    if (!url) {
      Alert.alert("Error", "No link available");
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open this link");
    }
  };

  const handleHomePress = () => {
    console.log("Navigate to Home");
  };

  const handleSearchPress = () => {
    console.log("Navigate to Search");
  };

  const handleProfilePress = () => {
    console.log("Navigate to Profile");
  };

  const schemsofworkers = [
    {
      heading: "eShram",
      description:
        "National database for unorganised workers linked to welfare schemes.",
      url: "https://eshram.gov.in/",
    },
    {
      heading: "Pradhan Mantri Shram Yogi Maandhan (PMSYM)",
      description: "Pension scheme for unorganised sector workers.",
      url: "https://labour.gov.in/pmsym",
    },
    {
      heading: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
      description: "Life insurance cover for eligible account holders",
      url: "https://www.pmjjby.gov.in/",
    },
    {
      heading: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
      description:
        "Accident and death insurance scheme for unorganised workers.",
      url: "https://pmsby.gov.in/",
    },
    {
      heading: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)",
      description: "Skill training and certification for youth and workers.",
      url: "https://www.msde.gov.in/offerings/schemesandservices/details/pradhanmantrikaushalvikasyojana40pmkvy402021ITO3ATMtQWa",
    },
    {
      heading: "National Career Service",
      description: "Job and skill matching portal for workers",
      url: "https://www.ncs.gov.in/",
    },
    {
      heading: "Pradhan Mantri Awas Yojana (PMAYU)",
      description: "Housing for all mission by Government of India",
      url: "https://pmaymis.gov.in/",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header could be added here if needed, but the design shows no explicit header */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <Text style={styles.mainTitle}>Government Schemes for Workers</Text>

        {schemsofworkers.map((scheme, index) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{scheme.heading}</Text>
            <Text style={styles.cardDescription}>{scheme.description}</Text>
            <TouchableOpacity
              style={styles.knowMoreButton}
              onPress={() => handleKnowMore(scheme.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.knowMoreText}>KNOW MORE</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={handleHomePress}
          activeOpacity={0.7}
        >
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // Light grey background like many gov scheme apps
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2A44",
    marginBottom: 24,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E9ECF0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E2A3E",
    marginBottom: 8,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: "#5A6874",
    lineHeight: 20,
    marginBottom: 20,
  },
  knowMoreButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  knowMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D6A4F", // A greenish accent that matches the image vibe
    letterSpacing: 0.5,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderTopWidth: 1,
    borderTopColor: "#E9ECF0",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 4,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5565",
  },
});

export default WelfareScreens;
