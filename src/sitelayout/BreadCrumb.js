import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BreadCrumb = ({ parents = [], SERVLETNAME = "", navigation }) => {
  const breadcrumbItems = useMemo(() => {
    let items = [];
    let serviceId = "";
    let parentServiceId = "";
    let grandParentId = "";

    if (parents && parents.length > 0) {
      outerLoop: for (let i = 0; i < parents.length; i++) {
        const menu = parents[i];

        if (SERVLETNAME === menu.targeturl) {
          items.push({
            label: menu.menuitemname || menu.targeturl || "Menu",
            route: menu.targeturl || null,
          });
          serviceId = menu.serviceid;
          parentServiceId = menu.parentid;
          grandParentId = menu.grand_parent;
          break;
        }

        if (menu.childs && menu.childs.length > 0) {
          const childs = menu.childs;

          for (let j = 0; j < childs.length; j++) {
            const submenu = childs[j];

            if (SERVLETNAME === submenu.targeturl_c) {
              items.push({
                label: menu.menuitemname || "Menu",
                route: null,
              });
              items.push({
                label: submenu.menuitemname_c || submenu.targeturl_c || "Sub Menu",
                route: submenu.targeturl_c || null,
              });
              serviceId = submenu.serviceid_c;
              parentServiceId = submenu.parentid_c;
              grandParentId = submenu.grand_parent_c;
              break outerLoop;
            }

            if (submenu.subchilds && submenu.subchilds.length > 0) {
              const subchilds = submenu.subchilds;

              for (let k = 0; k < subchilds.length; k++) {
                const subchild = subchilds[k];

                if (SERVLETNAME === subchild.targeturl_sc) {
                  items.push({
                    label: menu.menuitemname || "Menu",
                    route: null,
                  });
                  items.push({
                    label: submenu.menuitemname_c || "Sub Menu",
                    route: null,
                  });
                  items.push({
                    label:
                      subchild.menuitemname_sc ||
                      subchild.targeturl_sc ||
                      "Sub Child",
                    route: subchild.targeturl_sc || null,
                  });
                  serviceId = subchild.serviceid_sc || submenu.serviceid_sc;
                  parentServiceId = subchild.parentid_sc;
                  grandParentId = subchild.grand_parent_sc || submenu.grand_parent_sc;
                  break outerLoop;
                }
              }
            }
          }
        }
      }
    }

    if (SERVLETNAME === "HOME") {
      items = [
        {
          label: "Home",
          route: "HOME",
        },
      ];
    }

    if (serviceId !== null && serviceId !== "") {
      return items;
    }

    return SERVLETNAME
      ? [
          {
            label: SERVLETNAME,
            route: null,
          },
        ]
      : [];
  }, [parents, SERVLETNAME]);

  const handleNavigate = (route) => {
    if (!route || !navigation) return;

    const screenName = route.startsWith("/") ? route.substring(1) : route;

    try {
      navigation.navigate(screenName);
    } catch (error) {
      console.log("Breadcrumb navigation error:", error);
    }
  };

  if (!breadcrumbItems.length) return null;

  return (
    <View style={styles.container}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <View key={index} style={styles.itemWrapper}>
            <TouchableOpacity
              disabled={!item.route || isLast}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.itemText,
                  (!item.route || isLast) && styles.activeText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>

            {!isLast && <Text style={styles.separator}>{">"}</Text>}
          </View>
        );
      })}
    </View>
  );
};

export default BreadCrumb;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontSize: 13,
    color: "#337AB7",
    fontWeight: "500",
  },
  activeText: {
    color: "#666",
    fontWeight: "700",
  },
  separator: {
    marginHorizontal: 8,
    color: "#999",
    fontSize: 13,
  },
});