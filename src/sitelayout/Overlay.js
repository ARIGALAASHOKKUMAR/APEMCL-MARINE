import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

function Overlay() {
  const { loading, loadingText } = useSelector((state) => state.LoadingReducer);

  const [userLoading, setUserLoading] = useState("Loading, Please Wait...");
  const [randomFact, setRandomFact] = useState("");

 const facts = [
  "At Labour Chowk, every sunrise brings hope for work and survival.",
  "Hands that build cities wait at Labour Chowk for an opportunity.",
  "Labour Chowk is where struggle meets determination every day.",
  "Every worker at Labour Chowk carries dreams bigger than their hardships.",
  "Behind every construction is a worker who once stood at Labour Chowk.",
  "Labour Chowk is not just a place, it is a symbol of survival.",
  "Time spent waiting at Labour Chowk decides the day's fate.",
  "Workers at Labour Chowk don’t seek sympathy, only work.",
  "Each face at Labour Chowk reflects courage and silent sacrifice.",
  "Labour Chowk shows the real backbone of a nation.",
  
  "లేబర్ చౌక్ వద్ద ప్రతి ఉదయం కొత్త ఆశతో మొదలవుతుంది.",
  "పని కోసం ఎదురు చూస్తున్న చేతుల్లో ఎన్నో కలలు ఉంటాయి.",
  "లేబర్ చౌక్ అనేది జీవితం కోసం జరిగే పోరాటం.",
  "ఇక్కడ ప్రతి కార్మికుడి చెమటలో కుటుంబం ఆశ ఉంటుంది.",
  "లేబర్ చౌక్ వద్ద సమయం అంటే డబ్బు, ఎదురు చూడటం అంటే నష్టం.",
  "కష్టపడి పనిచేసే వారికి అవకాశం కోసం వేచిచూసే స్థలం లేబర్ చౌక్.",
  "ప్రతి రోజు పని దొరుకుతుందా అన్న అనిశ్చితి ఇక్కడ కనిపిస్తుంది.",
  "లేబర్ చౌక్ అనేది ధైర్యం, సహనం, ఆశల సమాహారం.",
  "ఇక్కడ జీవితం కోసం ప్రతి క్షణం పోరాటమే.",
  "లేబర్ చౌక్ వద్ద నిలబడేది కేవలం శరీరం కాదు, ఆశ కూడా."
];

  const getSecureRandomIndex = (length) => {
    try {
      const randomArray = new Uint32Array(1);
      if (global?.crypto?.getRandomValues) {
        global.crypto.getRandomValues(randomArray);
        return randomArray[0] % length;
      }
      return Math.floor(Math.random() * length);
    } catch {
      return Math.floor(Math.random() * length);
    }
  };

  useEffect(() => {
    setUserLoading(
      typeof loadingText === "string" && loadingText.trim()
        ? loadingText
        : "Loading, Please Wait...",
    );

    const randomIndex = getSecureRandomIndex(facts.length);
    setRandomFact(facts[randomIndex]);
  }, [loading, loadingText]);

  const isTeluguFact = /[\u0C00-\u0C7F]/.test(randomFact);

  if (!loading) return null;


  return (
    <Modal visible={loading} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>{userLoading}</Text>

          {/* {randomFact && (
            <Text
              style={[
                styles.factText,
                isTeluguFact ? styles.teluguFactText : styles.englishFactText,
              ]}
            >
              {randomFact}
            </Text>
          )} */}
        </View>
      </View>
    </Modal>
  );
}

export default Overlay;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    width: "90%",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  factText: {
    color: "#fff",
    marginTop: 18,
    textAlign: "center",
  },
  englishFactText: {
    fontSize: 18,
    lineHeight: 28,
  },
  teluguFactText: {
    fontSize: 24,
    lineHeight: 34,
  },
});
