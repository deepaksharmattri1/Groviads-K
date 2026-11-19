# GROVIADS Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity Binding**: Every document in `/users/{userId}` must have `uid == userId == request.auth.uid`. Every document in `/leads/{leadId}`, `/appointments/{appointmentId}`, and `/advisoryBriefs/{briefId}` must bind `ownerUid == request.auth.uid` on create and keep `ownerUid` immutable on update.
2. **Email Verification Mandate**: All standard writes require `request.auth.token.email_verified == true`.
3. **No Self-Assigned Privilege Escalation**: Clients creating `/users/{userId}` must set `role == 'client'`. Only the verified bootstrapped admin (`contact@groviads.com` with `email_verified == true`) can alter `role` or read/update cross-tenant records.
4. **Temporal & Immutable Integrity**: `createdAt` must equal `request.time` on create and remain unchanged on update. `updatedAt` must equal `request.time` on both create and update.
5. **Terminal State Locking**: Once a lead reaches `won` or `archived`, or an appointment reaches `completed` or `cancelled`, non-admin clients cannot reopen or mutate it.
6. **PII Isolation & Query Enforcement**: Email, phone, and profile fields are never readable via blanket `isSignedIn()`. All `allow get` and `allow list` rules check `ownerUid == request.auth.uid || isAdmin()` without calling `get()` or `exists()` inside `allow list`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Create Lead**: `{ ownerUid: "anon", name: "Test" }` with `auth == null`.
2. **Unverified Email Write**: Creating `/leads/ld_1` with `request.auth.token.email_verified == false`.
3. **Identity Spoofing on Create**: User A (`uid_a`) creates `/leads/ld_2` with `ownerUid: "uid_b"`.
4. **Self-Assigned Admin Role**: User A creates `/users/uid_a` with `{ ..., role: "admin" }`.
5. **Ghost / Shadow Field Injection**: User A creates `/users/uid_a` with extra key `isVerified: true` or `creditLimit: 99999`.
6. **Admin Email Spoof**: User with `email: "contact@groviads.com"` and `email_verified: false` attempts to list `/leads`.
7. **PII Cross-User Get**: User B attempts `get(/users/uid_a)` or `get(/leads/ld_owned_by_a)`.
8. **Blanket Collection List**: User B attempts unfiltered `list(/leads)` or `list(/appointments)` without `where("ownerUid", "==", uid_b)`.
9. **Path ID Poisoning**: Creating `/leads/${"x".repeat(200)}` or `/leads/bad$id` violating `isValidId()`.
10. **Denial-of-Wallet Oversized String**: Creating `/advisoryBriefs/br_1` with `responseText` exceeding 12,000 chars or `sources` array > 10 items.
11. **Timestamp Forgery / Mutation**: Creating `/leads/ld_3` with client-faked `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time`, or changing `createdAt` on update.
12. **Terminal State Reopening**: Client updates `/appointments/bk_1` from `status: "cancelled"` back to `"scheduled"`.
