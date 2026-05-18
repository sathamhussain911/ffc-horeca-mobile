# FFC HORECA Mobile App

React Native (Expo) app for FFC HORECA — Supervisor and Security Guard roles.

## Setup (one time)

### 1. Install tools
```bash
npm install -g expo-cli eas-cli
```

### 2. Install dependencies
```bash
cd ffc-horeca-mobile
npm install
```

### 3. Create Expo account
Go to https://expo.dev → Sign up (free)

### 4. Login to EAS
```bash
eas login
```

### 5. Init EAS project
```bash
eas init
```
This gives you a project ID — paste it into app.json under `extra.eas.projectId`

---

## Build APK (Android)

```bash
eas build --platform android --profile preview
```

- Takes ~10-15 minutes on EAS cloud servers
- You get a download link for the .apk file
- Install on any Android phone via that link or USB

---

## Install on Android phone

**Option A — Direct link:**
EAS gives you a QR code / link after build — open on phone and install

**Option B — USB:**
```bash
adb install ffc-horeca.apk
```

---

## Run locally for testing (optional)

```bash
npm start
```
Then scan the QR code with Expo Go app on your phone.

---

## Role routing

| Account | Screen |
|---|---|
| security@ffc-horeca.com | Security Gate |
| admin@ffc-horeca.com | Supervisor (Order Management) |
| marvin@freshfruitscompany.com | Supervisor |
| m.aliraza@freshfruitscompany.com | Supervisor |
| Any SUPERVISOR role | Supervisor |

---

## API
All calls go to: `https://ffc-horeca-ocs.vercel.app`
Auth token stored in Android SecureStore (encrypted).
