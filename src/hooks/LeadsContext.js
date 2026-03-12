/* eslint-disable */
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, serverTimestamp, writeBatch, getCountFromServer
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const LeadsContext = createContext();
export function useLeads() { return useContext(LeadsContext); }

export function LeadsProvider({ children, activeBusiness }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentBusinessIdRef = useRef(null);

  // Auto-fetch whenever activeBusiness changes — single source of truth
  useEffect(() => {
    if (currentUser && activeBusiness?.id) {
      fetchLeads(activeBusiness.id);
    } else {
      setLeads([]);
    }
  }, [currentUser?.uid, activeBusiness?.id]);

  async function fetchLeads(businessId) {
    if (!businessId || !currentUser) return;
    currentBusinessIdRef.current = businessId;
    setLoading(true);
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
    } catch (e) {
      console.error("fetchLeads error:", e);
    }
    setLoading(false);
  }

  async function addLead(businessId, data) {
    // Count from Firestore directly to avoid stale leads.length
    const q = query(
      collection(db, "leads"),
      where("businessId", "==", businessId),
      where("ownerId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    const sno = snap.size + 1;

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
    await fetchLeads(currentBusinessIdRef.current);
  }

  async function deleteLead(leadId) {
    await deleteDoc(doc(db, "leads", leadId));
    await fetchLeads(currentBusinessIdRef.current);
  }

  async function bulkAddLeads(businessId, rows) {
    // Always get current count from Firestore — never trust local state for sno
    const q = query(
      collection(db, "leads"),
      where("businessId", "==", businessId),
      where("ownerId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    const existingCount = snap.size;

    const batch = writeBatch(db);
    rows.forEach((row, i) => {
      const ref = doc(collection(db, "leads"));
      batch.set(ref, {
        ...row,
        sno: existingCount + i + 1,
        businessId,
        ownerId: currentUser.uid,
        status: row.status || "New",
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
    await fetchLeads(businessId);
  }

  const value = {
    leads,
    loading,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    bulkAddLeads
  };

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}