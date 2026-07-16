import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MenuItem = ({ item, navigation, currentScreenName, onNavigate }) => {
  const hasChilds = item?.childs && item.childs.length > 0;
  const [expanded, setExpanded] = useState(false);

  const isCurrentRoute = useMemo(() => {
    const current = String(currentScreenName || "").toUpperCase();

    if (!hasChilds) {
      return String(item?.targeturl || "").toUpperCase() === current;
    }

    return item.childs.some((child) => {
      if (String(child?.targeturl_c || "").toUpperCase() === current) return true;

      return (child?.subchilds || []).some(
        (sub) => String(sub?.targeturl_sc || "").toUpperCase() === current,
      );
    });
  }, [item, currentScreenName, hasChilds]);

  useEffect(() => {
    if (isCurrentRoute) {
      setExpanded(true);
    }
  }, [isCurrentRoute]);

  const navigateTo = (screenName) => {
    if (!screenName) return;
    onNavigate?.();
    navigation?.navigate?.(screenName);
  };

  if (!hasChilds) {
    return (
      <TouchableOpacity
        style={[styles.singleMenuItem, isCurrentRoute && styles.activeItem]}
        onPress={() => navigateTo(item?.targeturl)}
        activeOpacity={0.8}
      >
        <Text style={[styles.singleMenuText, isCurrentRoute && styles.activeText]}>
          {item?.menuitemname || "Untitled"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.parentContainer}>
      <TouchableOpacity
        style={[styles.parentButton, isCurrentRoute && styles.activeItem]}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={[styles.parentText, isCurrentRoute && styles.activeText]}>
          {item?.menuitemname || "Untitled"}
        </Text>
        <Text style={[styles.arrowText, isCurrentRoute && styles.activeText]}>
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.childWrapper}>
          {item.childs.map((child, index) => (
            <ChildItem
              key={index}
              child={child}
              navigation={navigation}
              currentScreenName={currentScreenName}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const ChildItem = ({ child, navigation, currentScreenName, onNavigate }) => {
  const hasSubchilds = child?.subchilds && child.subchilds.length > 0;
  const [expanded, setExpanded] = useState(false);

  const isCurrentChild = useMemo(() => {
    const current = String(currentScreenName || "").toUpperCase();

    if (String(child?.targeturl_c || "").toUpperCase() === current) return true;

    return (child?.subchilds || []).some(
      (sub) => String(sub?.targeturl_sc || "").toUpperCase() === current,
    );
  }, [child, currentScreenName]);

  useEffect(() => {
    if (isCurrentChild) {
      setExpanded(true);
    }
  }, [isCurrentChild]);

  const navigateTo = (screenName) => {
    if (!screenName) return;
    onNavigate?.();
    navigation?.navigate?.(screenName);
  };

  if (!hasSubchilds) {
    return (
      <TouchableOpacity
        style={[styles.childButton, isCurrentChild && styles.activeChildItem]}
        onPress={() => navigateTo(child?.targeturl_c)}
        activeOpacity={0.8}
      >
        <Text style={[styles.childText, isCurrentChild && styles.activeChildText]}>
          {child?.menuitemname_c || "Untitled"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.subParentContainer}>
      <TouchableOpacity
        style={[styles.childButton, isCurrentChild && styles.activeChildItem]}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Text style={[styles.childText, isCurrentChild && styles.activeChildText]}>
          {child?.menuitemname_c || "Untitled"}
        </Text>
        <Text style={[styles.subArrow, isCurrentChild && styles.activeChildText]}>
          {expanded ? "−" : "+"}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.subChildWrapper}>
          {(child?.subchilds || []).map((subchild, subIndex) => {
            const isActive =
              String(subchild?.targeturl_sc || "").toUpperCase() ===
              String(currentScreenName || "").toUpperCase();

            return (
              <TouchableOpacity
                key={subIndex}
                style={[styles.subChildButton, isActive && styles.activeSubChildItem]}
                onPress={() => navigateTo(subchild?.targeturl_sc)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subChildText,
                    isActive && styles.activeSubChildText,
                  ]}
                >
                  {subchild?.menuitemname_sc || "Untitled"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default MenuItem;

const styles = StyleSheet.create({
  parentContainer: {
    marginBottom: 8,
  },
  singleMenuItem: {
    backgroundColor: "#f8faff",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5ebff",
  },
  singleMenuText: {
    fontSize: 14,
    color: "#223",
    fontWeight: "600",
  },
  parentButton: {
    backgroundColor: "#f8faff",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5ebff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parentText: {
    fontSize: 14,
    color: "#223",
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  arrowText: {
    fontSize: 12,
    color: "#445",
    fontWeight: "700",
  },
  childWrapper: {
    marginTop: 8,
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#d9e2ff",
    paddingLeft: 10,
  },
  childButton: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ecf0ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  childText: {
    fontSize: 13,
    color: "#344054",
    fontWeight: "600",
    flex: 1,
    paddingRight: 8,
  },
  subArrow: {
    fontSize: 18,
    color: "#667085",
    fontWeight: "700",
  },
  subParentContainer: {
    marginBottom: 2,
  },
  subChildWrapper: {
    marginLeft: 10,
    marginTop: 2,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#eef2ff",
  },
  subChildButton: {
    backgroundColor: "#fafbff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#edf1ff",
  },
  subChildText: {
    fontSize: 13,
    color: "#475467",
    fontWeight: "500",
  },
  activeItem: {
    backgroundColor: "#4a6cf7",
    borderColor: "#4a6cf7",
  },
  activeText: {
    color: "#fff",
  },
  activeChildItem: {
    backgroundColor: "#edf2ff",
    borderColor: "#cdd9ff",
  },
  activeChildText: {
    color: "#2948c7",
    fontWeight: "700",
  },
  activeSubChildItem: {
    backgroundColor: "#e9efff",
    borderColor: "#bfcfff",
  },
  activeSubChildText: {
    color: "#2442bf",
    fontWeight: "700",
  },
});