import Dexie from "dexie";

export const db = new Dexie("RaabtaDB");

db.version(1).stores({
  unsentMessages: "++id, chatRoomId, content, createdAt, isEncrypted",
  cachedMessages: "++id, _id, chatRoomId, content, sender, createdAt",
});

// Helper to save unsent message
export const saveUnsentMessage = async (messageData) => {
  return await db.unsentMessages.add({
    ...messageData,
    createdAt: new Date().toISOString(),
  });
};

// Helper to get all unsent messages
export const getUnsentMessages = async () => {
  return await db.unsentMessages.toArray();
};

// Helper to delete unsent message after successful sync
export const deleteUnsentMessage = async (id) => {
  return await db.unsentMessages.delete(id);
};
