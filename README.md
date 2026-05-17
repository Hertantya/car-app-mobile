
## ⚙️ Setup Instructions

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/car-app-mobile.git
cd car-app-mobile
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Configure the Environment

Create a `.env` file in the root of the project:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Open `.env` and update the URL to match your setup:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
```

Change the value based on how you are running the app:

| How you run the app             | Value to use                        |
|---------------------------------|-------------------------------------|
| Android Emulator                | `http://10.0.2.2:8000/api`         |
| iOS Simulator                   | `http://localhost:8000/api`        |
| Physical phone (Android / iOS)  | `http://YOUR_PC_IP:8000/api`       |

#### How to find your PC's local IP address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" — example: 192.168.1.5
```

**Mac / Linux:**
```bash
ifconfig
# Look for "inet" under en0 — example: 192.168.1.5
```

So the final `.env` for a physical device would look like:
```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.5:8000/api
```

> ⚠️ Your phone and PC must be connected to the **same WiFi network**.

---

### Step 4 — Start the App

```bash
npm start
```

A QR code will appear in the terminal.

---

### Step 5 — Open on Your Device

**On your phone:**
1. Open the **Expo Go** app
2. Scan the QR code shown in the terminal
3. The app will load on your phone

**On Android Emulator:** Press `a` in the terminal

**On iOS Simulator:** Press `i` in the terminal

---

## 🔐 Login Credentials

Use the sample user account to log in on the mobile app:

| Field    | Value            |
|----------|------------------|
| Email    | user@carapp.com  |
| Password | password         |

> You can also register a new account directly from the app's Register tab.

---

## 📱 App Screens

### Login / Register
- Toggle between **Sign In** and **Register**
- Automatically saves your session — you stay logged in even after closing the app

### Browse (Swipe)
- Cards show car image, brand, model, and type
- **Swipe right** or tap ❤ to **like** a car
- **Swipe left** or tap ✕ to **skip** a car
- Works **offline** — swipes are saved locally and uploaded when you reconnect

### Report
- Shows your **most liked brand**, **model**, and **type**
- Shows total likes and skips
- Displays **🟢 Live data** when online, **🟡 Offline data** when offline
- Pull down to refresh

---

## 📶 Offline Mode

The app is built **offline-first**:

1. Cars are downloaded and saved on your device the first time you go online
2. You can swipe cars without internet connection
3. Swipes are saved locally on the device
4. When you reconnect to the internet, all pending swipes are automatically uploaded to the server

> **Important:** You must open the app at least once with internet connection so the car data downloads to your device.

---

## 🌐 Environment Variables

| Variable                   | Description                        |
|----------------------------|------------------------------------|
| `EXPO_PUBLIC_API_BASE_URL` | Base URL of the Laravel API server |

> Variables prefixed with `EXPO_PUBLIC_` are automatically available in the app code.

---

## ❗ Troubleshooting

**"Network Error" when logging in**
- Make sure `php artisan serve` is running on your PC
- Double-check `EXPO_PUBLIC_API_BASE_URL` in your `.env` file
- Make sure your phone and PC are on the same WiFi
- Try opening the URL in your phone's browser — e.g. `http://192.168.1.5:8000`

**App stuck on loading screen**
- Stop the app, run `npm start -- --clear`, and try again

**QR code not scanning**
- Make sure Expo Go is up to date
- Try pressing `w` in the terminal to open in browser instead

**Cars not showing in offline mode**
- You need to be online at least once for cars to download to your device
- Connect to the internet, open the Browse tab, then go offline

**Cannot find module error**
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

**Environment variable not working**
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Make sure the variable starts with `EXPO_PUBLIC_`
- Restart the Metro bundler after changing `.env`: `npm start -- --clear`
