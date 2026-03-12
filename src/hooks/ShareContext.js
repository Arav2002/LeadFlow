/* eslint-disable */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc, deleteDoc,
  query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";

const ShareContext = createContext();
export function useShare() { return useContext(ShareContext); }

export const PERMISSIONS = {
  R:    { label: "Read Only",            desc: "Can view leads and dashboard only",        canCreate: false, canUpdate: false, canDelete: false },
  CRU:  { label: "Create, Read, Update", desc: "Can view, add and edit leads — no delete", canCreate: true,  canUpdate: true,  canDelete: false },
  CRUD: { label: "Full Access",          desc: "Can view, add, edit and delete leads",     canCreate: true,  canUpdate: true,  canDelete: true  },
};

export function ShareProvider({ children }) {
  const { currentUser } = useAuth();
  const [shareLinks, setShareLinks] = useState([]);        // links I created
  const [sharedWithMe, setSharedWithMe] = useState([]);    // links shared TO me
  const [loading, setLoading] = useState(false);

  // Auto-fetch shared-with-me whenever user logs in
  useEffect(() => {
    if (currentUser?.email) fetchSharedWithMe();
    else setSharedWithMe([]);
  }, [currentUser?.email]);

  // Fetch links shared TO the current user by email
  async function fetchSharedWithMe() {
    if (!currentUser?.email) return;
    try {
      const q = query(
        collection(db, "shareLinks"),
        where("sharedWithEmail", "==", currentUser.email.toLowerCase()),
        where("active", "==", true)
      );
      const snap = await getDocs(q);
      setSharedWithMe(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("fetchSharedWithMe error:", e); }
  }

  // Fetch links I own for a specific business
  async function fetchShareLinks(businessId) {
    if (!currentUser || !businessId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "shareLinks"),
        where("businessId", "==", businessId),
        where("ownerId", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      setShareLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Create a share link, optionally targeting a specific email
  async function createShareLink(businessId, businessName, permission, label, sharedWithEmail = "") {
    const token = uuidv4();
    await addDoc(collection(db, "shareLinks"), {
      token,
      businessId,
      businessName,
      permission,
      label: label || `Shared — ${PERMISSIONS[permission].label}`,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email,
      sharedWithEmail: sharedWithEmail.trim().toLowerCase() || "",
      createdAt: serverTimestamp(),
      active: true
    });
    await fetchShareLinks(businessId);
    // Refresh shared-with-me in case sharing with self (testing)
    await fetchSharedWithMe();
    return token;
  }

  async function revokeShareLink(linkId, businessId) {
    await deleteDoc(doc(db, "shareLinks", linkId));
    await fetchShareLinks(businessId);
    await fetchSharedWithMe();
  }

  // Resolve a token (no auth required — Firestore rules allow public read on shareLinks)
  async function resolveToken(token) {
    try {
      const q = query(
        collection(db, "shareLinks"),
        where("token", "==", token),
        where("active", "==", true)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (e) { console.error("resolveToken error:", e); return null; }
  }

  const value = {
    shareLinks, sharedWithMe, loading,
    fetchShareLinks, fetchSharedWithMe,
    createShareLink, revokeShareLink, resolveToken
  };
  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
}