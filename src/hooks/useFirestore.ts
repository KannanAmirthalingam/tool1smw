import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper function to convert Firestore Timestamps to JavaScript Date objects
const convertTimestampsToDates = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map(convertTimestampsToDates);
  }

  if (typeof data === 'object') {
    const converted: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        converted[key] = convertTimestampsToDates(data[key]);
      }
    }
    return converted;
  }

  return data;
};

export const useFirestore = (collectionName: string) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const convertedData = convertTimestampsToDates(data);
        docs.push({ id: doc.id, ...convertedData });
      });
      setDocuments(docs);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  const addDocument = async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        created_at: new Date()
      });
      return docRef.id;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateDocument = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, collectionName, id), data);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const getFilteredDocuments = async (filters: Array<{ field: string; operator: any; value: any }>) => {
    try {
      let q = query(collection(db, collectionName));
      
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      const snapshot = await getDocs(q);
      const docs: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const convertedData = convertTimestampsToDates(data);
        docs.push({ id: doc.id, ...convertedData });
      });
      return docs;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    getFilteredDocuments
  };
};