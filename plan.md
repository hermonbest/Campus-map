This is a complete, inclusive plan for your freemium transition. This setup uses **Supabase** for user management and **GitHub** as your content controller.

---

## 1. Database Architecture (Supabase)
You need two primary tables in your Supabase project to manage identities and payments.

### Table: `profiles`
This table automatically links to your Supabase users. It stores their "Status."
*   **`id`**: (UUID) - Primary Key (linked to `auth.users.id`).
*   **`email`**: (Text).
*   **`is_premium`**: (Boolean) - Default: `false`.
*   **`updated_at`**: (Timestamp).

### Table: `license_keys`
This is your "Stock" of codes that you send to users after they pay via bank transfer.
*   **`id`**: (BigInt) - Primary Key.
*   **`key_code`**: (Text) - Unique code (e.g., `MATH-X921`).
*   **`is_used`**: (Boolean) - Default: `false`.
*   **`redeemed_by`**: (UUID) - Foreign Key linked to `profiles.id`.

---

## 2. Content Configuration (GitHub)
You must update your `category.json` file so the app knows which chapters require payment.

**Old JSON:**
```json
{ "title": "Chapter 2", "url": "..." }
```
**New JSON (Include the flag):**
```json
{ 
  "title": "Chapter 2", 
  "url": "...",
  "premium": true 
}
```

---

## 3. The UI Strategy (Tabs & Flows)
Your app should have a **Bottom Navigation** or **Side Menu** with these three core tabs:

### Tab A: The Subjects (Main List)
*   **Visual Change:** Chapters with `premium: true` show a **Lock Icon** next to the title.
*   **Behavior:**
    *   If a user taps a **Free** chapter → Download starts immediately.
    *   If a user taps a **Locked** chapter AND their profile is `is_premium: false` → Show a popup: *"This is a Pro chapter. Go to the Account tab to unlock."*

### Tab B: The Account (Authentication & Profile)
*   **State 1: Not Logged In:** Show "Sign Up" and "Login" forms.
*   **State 2: Logged In (Free User):** 
    *   Display their email.
    *   Show "Account Status: Free."
    *   **Payment Section:** Display your bank details and instructions.
    *   **Redemption Box:** A text field where they enter the code you sent them.
*   **State 3: Logged In (Pro User):** 
    *   Display "Account Status: Premium ✅."
    *   Hide all payment instructions and codes.

---

## 4. The "Robust" Offline Logic
Since your users need to use the app offline, the app cannot check Supabase every time they open it.

1.  **Login Sync:** When the user logs in, the app fetches their `is_premium` status from Supabase.
2.  **Secure Storage:** The app saves this status locally using a secure library (like `EncryptedSharedPreferences` for Android or `Keychain` for iOS).
3.  **Boot Check:** Every time the app launches, it checks the **Local Secure Storage** first. 
    *   If it finds `premium_verified: true`, it unlocks the UI immediately without needing the internet.

---

## 5. The Business Flow (Step-by-Step)

1.  **User Registration:** The user signs up in the "Account" tab (Internet required).
2.  **Bank Transfer:** The user transfers money to your bank account offline.
3.  **Proof of Payment:** The user sends you the receipt and their registered email via WhatsApp/Email.
4.  **Admin Action (You):** 
    *   **Option 1:** You send them a `key_code` from your Supabase list.
    *   **Option 2 (Easier):** You go to your Supabase Dashboard, find their email in the `profiles` table, and manually change `is_premium` to `true`.
5.  **Activation:**
    *   If you gave a code: The user enters it in the app (Internet required for 2 seconds).
    *   If you toggled the switch: The user just opens the app with internet once, and the app "sees" they are now Pro.
6.  **Final Result:** The "Lock" icons disappear, and the user can download chapters to use offline forever.

### What needs to be done on GitHub?
You only need to update the `category.json` file once to add the `premium: true` flags. Your release files (the actual ZIPs or PDFs) do not need to change at all. The app is what controls who is allowed to click the download link.

Do you have a specific mobile framework (like Flutter, React Native, or Java) you are using for this? I can provide the specific code for the "Secure Storage" part.