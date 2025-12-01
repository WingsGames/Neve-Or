
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import { storage, auth } from "./firebase";

/**
 * Uploads a Base64 image string to Firebase Storage.
 * @param base64String The full base64 string (including data:image/jpeg;base64,...)
 * @param path The path in storage (e.g., 'backgrounds/node_1.jpg')
 * @returns Promise resolving to the public download URL
 */
export const uploadImageToFirebase = async (base64String: string, path: string): Promise<string | null> => {
  try {
    // Ensure user is authenticated before uploading
    if (!auth.currentUser) {
      console.log("User not signed in, attempting anonymous sign-in...");
      await signInAnonymously(auth);
    }

    const storageRef = ref(storage, path);
    
    // Upload the string
    await uploadString(storageRef, base64String, 'data_url');
    
    // Get the URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading image to Firebase:", error);
    
    // Specific error handling
    if (error.code === 'storage/unauthorized') {
      alert('שגיאת הרשאה: וודא ש-Authentication מופעל ב-Firebase Console ושהגדרת את ה-Rules.');
    } else if (error.message && error.message.includes('CORS')) {
      alert('שגיאת CORS: יש להריץ את פקודת gsutil כפי שהוסבר.');
    }

    return null;
  }
};
