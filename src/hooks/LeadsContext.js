import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const LeadsContext = createContext();
export function useLeads() { return useContext(LeadsContext); }

export function LeadsProvider({ children }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);

  async function fetchLeads(businessId) {
    if (!businessId || !currentUser) return;
    setLoading(true);
    setCurrentBusinessId(businessId);
    try {
      const q = query(
        collection(db, "leads"),
        where("businessId", "==", businessId),
        where("ownerId", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sno || 0) - (b.sno || 0));
      setLeads(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function addLead(businessId, data) {
    const sno = leads.length + 1;
    const ref = await addDoc(collection(db, "leads"), {
      ...data,
      sno,
      businessId,
      ownerId: currentUser.uid,
      status: data.status || "New",
      createdAt: serverTimestamp()
    });
    await fetchLeads(businessId);
    return ref.id;
  }

  async function updateLead(leadId, data) {
    await updateDoc(doc(db, "leads", leadId), { ...data, updatedAt: serverTimestamp() });
    await fetchLeads(currentBusinessId);
  }

  async function deleteLead(leadId) {
    await deleteDoc(doc(db, "leads", leadId));
    await fetchLeads(currentBusinessId);
  }

  async function bulkAddLeads(businessId, rows) {
    const batch = writeBatch(db);
    const base = leads.length;
    rows.forEach((row, i) => {
      const ref = doc(collection(db, "leads"));
      batch.set(ref, {
        ...row,
        sno: base + i + 1,
        businessId,
        ownerId: currentUser.uid,
        status: row.status || "New",
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
    await fetchLeads(businessId);
  }

  const value = { leads, loading, fetchLeads, addLead, updateLead, deleteLead, bulkAddLeads };
  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}
