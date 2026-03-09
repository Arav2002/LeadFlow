import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const OnboardingContext = createContext();
export function useOnboarding() { return useContext(OnboardingContext); }

export const STEPS = [
  {
    id: "create_business",
    title: "Create your first Business",
    description: "A business organizes your leads. Click '+ New Business' in the sidebar to get started.",
    target: "sidebar-new-business",
    page: "/businesses",
    icon: "🏢"
  },
  {
    id: "add_columns",
    title: "Configure your Columns",
    description: "Define what data you want to track — Name, Phone, Email, Source, etc.",
    target: "manage-columns-btn",
    page: "/businesses",
    icon: "⚙️"
  },
  {
    id: "add_lead",
    title: "Add your first Lead",
    description: "Click '+ Add Lead' to manually enter a lead using your configured fields.",
    target: "add-lead-btn",
    page: "/leads",
    icon: "👤"
  },
  {
    id: "import_leads",
    title: "Import leads from CSV/Excel",
    description: "Upload a spreadsheet to bulk-import hundreds of leads instantly.",
    target: "import-nav",
    page: "/import",
    icon: "📁"
  },
  {
    id: "view_dashboard",
    title: "Explore your Dashboard",
    description: "See charts, conversion rates and lead breakdowns — all updated in real time.",
    target: "dashboard-nav",
    page: "/dashboard",
    icon: "📊"
  }
];

export function OnboardingProvider({ children }) {
  const { currentUser } = useAuth();
  const [onboarding, setOnboarding] = useState(null); // null = loading
  const [activeStep, setActiveStep] = useState(0);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    loadOnboarding();
  }, [currentUser]);

  async function loadOnboarding() {
    try {
      const ref = doc(db, "onboarding", currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setOnboarding(snap.data());
      } else {
        // New user — initialize onboarding
        const initial = {
          dismissed: false,
          completedSteps: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(ref, initial);
        setOnboarding(initial);
      }
    } catch (e) {
      console.error("Onboarding load error:", e);
      setOnboarding({ dismissed: false, completedSteps: [] });
    }
  }

  async function completeStep(stepId) {
    if (!currentUser || !onboarding) return;
    if (onboarding.completedSteps?.includes(stepId)) return;
    const updated = {
      ...onboarding,
      completedSteps: [...(onboarding.completedSteps || []), stepId]
    };
    setOnboarding(updated);
    await updateDoc(doc(db, "onboarding", currentUser.uid), {
      completedSteps: updated.completedSteps
    });
    // Auto advance
    const nextIdx = STEPS.findIndex(s => s.id === stepId) + 1;
    if (nextIdx < STEPS.length) setActiveStep(nextIdx);
  }

  async function dismissOnboarding() {
    if (!currentUser) return;
    const updated = { ...onboarding, dismissed: true };
    setOnboarding(updated);
    await updateDoc(doc(db, "onboarding", currentUser.uid), { dismissed: true });
  }

  async function resetOnboarding() {
    if (!currentUser) return;
    const updated = { dismissed: false, completedSteps: [] };
    setOnboarding(updated);
    await updateDoc(doc(db, "onboarding", currentUser.uid), updated);
    setActiveStep(0);
    setShowTooltip(true);
  }

  const isStepComplete = (stepId) => onboarding?.completedSteps?.includes(stepId);
  const allComplete = STEPS.every(s => onboarding?.completedSteps?.includes(s.id));
  const isDismissed = onboarding?.dismissed === true;
  const completedCount = onboarding?.completedSteps?.length || 0;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  const value = {
    onboarding, activeStep, setActiveStep, showTooltip, setShowTooltip,
    completeStep, dismissOnboarding, resetOnboarding,
    isStepComplete, allComplete, isDismissed, completedCount, progress,
    steps: STEPS
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
