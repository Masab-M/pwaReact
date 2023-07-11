import Dexie from 'dexie';

export const indexDB = new Dexie('myDatabase');
indexDB.version(1).stores({
  posts: '++id, heading, content, image, location', // Primary key and indexed props
  deletePosts:"++id, postId",
  editPosts:"++id, postId, heading, content, image"
});