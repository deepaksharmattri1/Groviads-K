import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_EMAIL,
  auth,
  clampString,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
  sanitizeId,
} from '../lib/firebase';

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'client' | 'admin';
  hasBookedConsultation: boolean;
}

export interface FirestoreLeadRecord {
  id: string;
  ownerUid: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  serviceInterest: string;
  challenges: string;
  status: string;
}

export interface FirestoreAppointmentRecord {
  id: string;
  ownerUid: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  serviceInterest: string;
  appointmentDate: string;
  appointmentTime: string;
  timezone: string;
  notes?: string;
  status: string;
}

export interface FirestoreAdvisoryBrief {
  id: string;
  ownerUid: string;
  title: string;
  mode: 'chat' | 'search_grounding' | 'maps_grounding';
  prompt: string;
  responseText: string;
  sources: string[];
}

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  userProfile: FirestoreUserProfile | null;
  isAdmin: boolean;
  firestoreLeads: FirestoreLeadRecord[];
  firestoreAppointments: FirestoreAppointmentRecord[];
  advisoryBriefs: FirestoreAdvisoryBrief[];
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncLeadToFirestore: (lead: {
    id: string;
    name: string;
    email: string;
    country: string;
    phone: string;
    serviceInterest: string;
    challenges: string;
  }) => Promise<void>;
  syncAppointmentToFirestore: (appt: {
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    serviceInterest: string;
    appointmentDate: string;
    appointmentTime: string;
    timezone: string;
    notes?: string;
  }) => Promise<void>;
  saveAdvisoryBrief: (brief: {
    title: string;
    mode: 'chat' | 'search_grounding' | 'maps_grounding';
    prompt: string;
    responseText: string;
    sources: string[];
  }) => Promise<string | null>;
  deleteAdvisoryBrief: (briefId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<FirestoreUserProfile | null>(null);
  const [firestoreLeads, setFirestoreLeads] = useState<FirestoreLeadRecord[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<FirestoreAppointmentRecord[]>(
    []
  );
  const [advisoryBriefs, setAdvisoryBriefs] = useState<FirestoreAdvisoryBrief[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdmin = Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setUserProfile(null);
        setFirestoreLeads([]);
        setFirestoreAppointments([]);
        setAdvisoryBriefs([]);
        return;
      }

      const userPath = `users/${currentUser.uid}`;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        const verifiedAdmin =
          currentUser.emailVerified &&
          currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        if (!snap.exists()) {
          const payload = {
            uid: sanitizeId(currentUser.uid),
            displayName: clampString(currentUser.displayName || 'GROVIADS Client', 120),
            email: clampString(currentUser.email || 'client@groviads.com', 180),
            photoURL: clampString(currentUser.photoURL || '', 500),
            role: verifiedAdmin ? 'admin' : 'client',
            hasBookedConsultation: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, payload);
          setUserProfile({
            uid: payload.uid,
            displayName: payload.displayName,
            email: payload.email,
            photoURL: payload.photoURL,
            role: payload.role as 'client' | 'admin',
            hasBookedConsultation: false,
          });
        } else {
          const data = snap.data() as FirestoreUserProfile;
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Failed to sync user profile:', error);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    const leadsQuery = isAdmin
      ? query(collection(db, 'leads'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'leads'),
          where('ownerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubLeads = onSnapshot(
      leadsQuery,
      (snapshot) => {
        const rows: FirestoreLeadRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreLeadRecord, 'id'>),
        }));
        setFirestoreLeads(rows);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'leads');
        } catch (wrapped) {
          console.error(wrapped);
        }
      }
    );

    const apptsQuery = isAdmin
      ? query(collection(db, 'appointments'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'appointments'),
          where('ownerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubAppts = onSnapshot(
      apptsQuery,
      (snapshot) => {
        const rows: FirestoreAppointmentRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreAppointmentRecord, 'id'>),
        }));
        setFirestoreAppointments(rows);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'appointments');
        } catch (wrapped) {
          console.error(wrapped);
        }
      }
    );

    const briefsQuery = isAdmin
      ? query(collection(db, 'advisoryBriefs'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'advisoryBriefs'),
          where('ownerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubBriefs = onSnapshot(
      briefsQuery,
      (snapshot) => {
        const rows: FirestoreAdvisoryBrief[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FirestoreAdvisoryBrief, 'id'>),
        }));
        setAdvisoryBriefs(rows);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'advisoryBriefs');
        } catch (wrapped) {
          console.error(wrapped);
        }
      }
    );

    return () => {
      unsubLeads();
      unsubAppts();
      unsubBriefs();
    };
  }, [authReady, user, isAdmin]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google Sign-In failed.';
      setAuthError(msg);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const syncLeadToFirestore = async (lead: {
    id: string;
    name: string;
    email: string;
    country: string;
    phone: string;
    serviceInterest: string;
    challenges: string;
  }) => {
    if (!user || !user.emailVerified) return;
    const safeId = sanitizeId(lead.id);
    const path = `leads/${safeId}`;
    try {
      await setDoc(doc(db, 'leads', safeId), {
        ownerUid: user.uid,
        name: clampString(lead.name, 120),
        email: clampString(lead.email, 180),
        country: clampString(lead.country, 100),
        phone: clampString(lead.phone, 40),
        serviceInterest: clampString(lead.serviceInterest, 160),
        challenges: clampString(lead.challenges, 2000),
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const syncAppointmentToFirestore = async (appt: {
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    serviceInterest: string;
    appointmentDate: string;
    appointmentTime: string;
    timezone: string;
    notes?: string;
  }) => {
    if (!user || !user.emailVerified) return;
    const safeId = sanitizeId(appt.id);
    const path = `appointments/${safeId}`;
    try {
      await setDoc(doc(db, 'appointments', safeId), {
        ownerUid: user.uid,
        name: clampString(appt.name, 120),
        email: clampString(appt.email, 180),
        phone: clampString(appt.phone, 40),
        country: clampString(appt.country, 100),
        serviceInterest: clampString(appt.serviceInterest, 160),
        appointmentDate: clampString(appt.appointmentDate, 10),
        appointmentTime: clampString(appt.appointmentTime, 20),
        timezone: clampString(appt.timezone, 80),
        notes: clampString(appt.notes || '', 1000),
        status: 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', user.uid), {
        hasBookedConsultation: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const saveAdvisoryBrief = async (brief: {
    title: string;
    mode: 'chat' | 'search_grounding' | 'maps_grounding';
    prompt: string;
    responseText: string;
    sources: string[];
  }): Promise<string | null> => {
    if (!user || !user.emailVerified) return null;
    const briefId = sanitizeId(`br_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    const path = `advisoryBriefs/${briefId}`;
    try {
      await setDoc(doc(db, 'advisoryBriefs', briefId), {
        ownerUid: user.uid,
        title: clampString(brief.title, 160),
        mode: brief.mode,
        prompt: clampString(brief.prompt, 2000),
        responseText: clampString(brief.responseText, 12000),
        sources: brief.sources.slice(0, 10).map((s) => clampString(s, 500)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return briefId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteAdvisoryBrief = async (briefId: string) => {
    if (!user) return;
    const safeId = sanitizeId(briefId);
    const path = `advisoryBriefs/${safeId}`;
    try {
      await deleteDoc(doc(db, 'advisoryBriefs', safeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        userProfile,
        isAdmin,
        firestoreLeads,
        firestoreAppointments,
        advisoryBriefs,
        authError,
        signInWithGoogle,
        signOutUser,
        syncLeadToFirestore,
        syncAppointmentToFirestore,
        saveAdvisoryBrief,
        deleteAdvisoryBrief,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
