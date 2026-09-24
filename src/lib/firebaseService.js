// Firebase service — uses dynamic import so the app works even before
// `npm i firebase`. Exposes auth (email/password) and Firestore sync.
import firebaseConfig from '../config/firebase'

let fbmPromise = null // module-load promise; resolves null if firebase not installed

function load() {
  if (!fbmPromise) {
    fbmPromise = Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([appMod, authMod, fsMod]) => {
      const app = appMod.initializeApp(firebaseConfig)
      return {
        app,
        auth: authMod.getAuth(app),
        db: fsMod.getFirestore(app),
        col: fsMod.collection,
        doc: fsMod.doc,
        setDoc: fsMod.setDoc,
        getDoc: fsMod.getDoc,
        getDocs: fsMod.getDocs,
        query: fsMod.query,
        where: fsMod.where,
        onSnapshot: fsMod.onSnapshot,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
        createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
        signOut: authMod.signOut,
        onAuthStateChanged: authMod.onAuthStateChanged,
        serverTimestamp: fsMod.serverTimestamp,
      }
    }).catch(() => null) // firebase not installed → null, cached forever
  }
  return fbmPromise
}

/** Returns true if firebase is available & project configured. */
export const firebaseAvailable = () => !!fbmPromise

/** Current user (firebase.User) or null */
export const currentFirebaseUser = () => {
  if (!fbmPromise) return null
  return null // resolved async below; prefer onAuth + pull flow
}

/** Subscribe to auth state; returns unsubscribe. */
export function onAuth(cb) {
  load().then((m) => {
    if (!m) { cb(null); return }
    m.onAuthStateChanged(m.auth, cb)
  })
  return () => {}
}

export async function signIn(email, password) {
  const m = await load()
  if (!m) return { error: 'firebase-not-installed' }
  try {
    await m.signInWithEmailAndPassword(m.auth, email, password)
    return { ok: true }
  } catch (e) {
    const err = e && (e.code || e.message)
    if (err === 'auth/unauthorized-domain') {
      return { error: 'unauthorized-domain', hint: 'دامنهٔ جاری در Firebase Console → Authentication → Authorized domains نیست.' }
    }
    if (err === 'auth/invalid-api-key') {
      return { error: 'invalid-api-key', hint: 'apiKey در config نادرست است.' }
    }
    if (err === 'auth/wrong-password') {
      return { error: 'wrong-password', hint: 'رمز عبور اشتباه است.' }
    }
    if (err === 'auth/user-not-found') {
      return { error: 'user-not-found', hint: 'با این ایمیل اکانتی وجود ندارد.' }
    }
    if (err === 'auth/invalid-credential') {
      return { error: 'wrong-password', hint: 'رمز عبور اشتباه است.' }
    }
    if (err === 'auth/network-request-failed') {
      return { error: 'network', hint: 'اتصال به سرور Firebase برقرار نشد (اینترنت/تحریم).' }
    }
    return { error: err || 'unknown' }
  }
}

export async function signUp(email, password) {
  const m = await load()
  if (!m) return { error: 'firebase-not-installed' }
  try {
    await m.createUserWithEmailAndPassword(m.auth, email, password)
    return { ok: true }
  } catch (e) {
    const err = e && (e.code || e.message)
    if (err === 'auth/unauthorized-domain') return { error: 'unauthorized-domain', hint: 'دامنهٔ جاری در Console → Auth → Authorized domains نیست.' }
    if (err === 'auth/email-already-in-use') return { error: 'email-already-in-use', hint: 'این ایمیل قبلاً ثبت شده.' }
    if (err === 'auth/weak-password') return { error: 'weak-password', hint: 'رمز حداقل ۶ کاراکتر باشد.' }
    if (err === 'auth/network-request-failed') return { error: 'network', hint: 'اتصال به سرور Firebase برقرار نشد.' }
    return { error: err || 'unknown' }
  }
}

export async function signOut() {
  const m = await load()
  if (!m) return
  try { await m.signOut() } catch (e) { /* ignore */ }
}

const uidRef = async () => {
  const m = await load()
  return m ? m.auth.currentUser?.uid : null
}

/* ------- Firestore user-document sync ------- */

/** Push the whole app DB into Firestore: users/{uid}/data/app */
export async function pushUserData(data) {
  const m = await load()
  const uid = await uidRef()
  if (!m || !uid) return { ok: false }
  try {
    await m.setDoc(m.doc(m.db, 'users', uid, 'data', 'app'), data, { merge: true })
    return { ok: true }
  } catch (e) { return { error: e.message } }
}

/** Pull the user's stored data from Firestore */
export async function pullUserData() {
  const m = await load()
  const uid = await uidRef()
  if (!m || !uid) return null
  try {
    const snap = await m.getDoc(m.doc(m.db, 'users', uid, 'data', 'app'))
    return snap.exists() ? snap.data() : null
  } catch (e) { return null }
}

/** Subscribe to the user's data changes — cb(data) | cb(null); returns unsubscribe. */
export function subscribeUserData(cb) {
  let un = () => {}
  Promise.all([load(), uidRef()]).then(([m, uid]) => {
    if (!m || !uid) { cb(null); return }
    try {
      un = m.onSnapshot(m.doc(m.db, 'users', uid, 'data', 'app'), (snap) => {
        cb(snap.exists() ? snap.data() : null)
      })
    } catch (e) { cb(null) }
  })
  return () => { try { un() } catch (e) {} }
}