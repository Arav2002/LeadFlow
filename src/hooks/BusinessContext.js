import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const BusinessContext = createContext();
export function useBusiness() { return useContext(BusinessContext); }

export function BusinessProvider({ children }) {
  const { currentUser } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) { setBusinesses([]); setActiveBusiness(null); return; }
    fetchBusinesses();
  }, [currentUser]);

  async function fetchBusinesses() {
    setLoading(true);
    try {
      const q = query(collection(db, "businesses"), where("ownerId", "==", currentUser.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBusinesses(list);
      if (list.length > 0 && !activeBusiness) setActiveBusiness(list[0]);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createBusiness(name, description, customColumns = []) {
    const ref = await addDoc(collection(db, "businesses"), {
      name,
      description,
      ownerId: currentUser.uid,
      columns: [
        { key: "sno", label: "S.No", type: "auto", required: true, locked: true },
        { key: "status", label: "Status", type: "select", required: true, locked: true, options: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] },
        ...customColumns
      ],
      createdAt: serverTimestamp()
    });
    await fetchBusinesses();
    return ref.id;
  }

  async function updateBusinessColumns(businessId, columns) {
    await updateDoc(doc(db, "businesses", businessId), { columns });
    await fetchBusinesses();
    if (activeBusiness?.id === businessId) {
      setActiveBusiness(prev => ({ ...prev, columns }));
    }
  }

  async function deleteBusiness(businessId) {
    await deleteDoc(doc(db, "businesses", businessId));
    await fetchBusinesses();
    if (activeBusiness?.id === businessId) setActiveBusiness(null);
  }

  const value = {
    businesses,
    activeBusiness,
    setActiveBusiness,
    loading,
    createBusiness,
    updateBusinessColumns,
    deleteBusiness,
    fetchBusinesses
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}