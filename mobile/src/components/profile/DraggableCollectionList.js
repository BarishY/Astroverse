// src/components/profile/DraggableCollectionList.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors'; // Bu yol doğru

const DraggableCollectionList = ({ collections, onOrderChange, onCollectionPress }) => {
  if (!collections) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Koleksiyon bulunamadı.</Text>
      </View>
    );
  }

  const renderItem = ({ item, drag, isActive }) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag} // Uzun basıldığında sürüklemeyi başlat
          disabled={isActive} // Sürüklenirken tekrar tıklamayı engelle
          style={[
            styles.itemContainer,
            isActive && styles.itemActive, // Sürüklenirken farklı stil
          ]}
          onPress={() => onCollectionPress && onCollectionPress(item)} // Normal tıklama
        >
          <View style={styles.itemContent}>
            <Ionicons name="albums-outline" size={22} color={colors.textSecondary} style={styles.itemIcon} />
            <Text style={styles.itemName} numberOfLines={1}>{item.name || 'İsimsiz Koleksiyon'}</Text>
          </View>
          <Ionicons name="reorder-three-outline" size={28} color={colors.textLight} />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <DraggableFlatList
      data={collections}
      onDragEnd={({ data }) => onOrderChange(data)} // Sürükleme bittiğinde yeni sıralamayı dışarıya bildir
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      containerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    // paddingHorizontal: 10, // Gerekirse
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: colors.surface, // colors.js'den
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // colors.js'den
  },
  itemActive: {
    backgroundColor: colors.feedBackground, // colors.js'den
    shadowColor: colors.black, // colors.js'den
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    color: colors.text, // colors.js'den
    flexShrink: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary, // colors.js'den
  },
});

export default DraggableCollectionList;
