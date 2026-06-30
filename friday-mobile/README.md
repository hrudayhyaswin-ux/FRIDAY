# 📱 FRIDAY AI — Mobile Application

> **F**ully **R**esponsive **I**ntelligence **D**igital **A**ssistant for **Y**ou  
> A JARVIS-inspired personal AI assistant that works **completely offline**.

---

## 🚀 Features

| Feature | Status |
|---|---|
| 🎙️ Voice Input (STT) | ✅ Offline (device native) |
| 🔊 JARVIS-style Voice Output (TTS) | ✅ Offline (device native) |
| 🧠 Offline AI Responses | ✅ Built-in knowledge base |
| 💬 Text Chat | ✅ |
| 🌐 Network Required | ❌ None |
| 🌟 Holographic HUD UI | ✅ Animated |
| ⚡ System Status Monitor | ✅ |
| 🔢 Math Calculator | ✅ |

---

## 📲 Installation

### Android APK

#### Prerequisites
1. Install [Android Studio](https://developer.android.com/studio) (includes Java + Android SDK)
2. Enable **Unknown Sources** on your Android device:  
   `Settings → Security → Install Unknown Apps → Allow`

#### Build Steps
```bash
# 1. Clone the repo
git clone https://github.com/hrudayhyaswin-ux/FRIDAY.git
cd FRIDAY/friday-mobile

# 2. Install dependencies
npm install

# 3. Sync web assets into Android project
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish
2. Go to **Build → Build Bundle(s)/APK(s) → Build APK(s)**
3. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Transfer to your Android device and install

> **Or run directly on device/emulator:**
> ```bash
> npx cap run android
> ```

---

### iOS (iPhone/iPad)

#### Prerequisites
- macOS with **Xcode 15+** installed (from App Store)
- Apple Developer account (for device deployment)

#### Build Steps
```bash
# 1. Clone the repo
git clone https://github.com/hrudayhyaswin-ux/FRIDAY.git
cd FRIDAY/friday-mobile

# 2. Install dependencies
npm install

# 3. Sync web assets
npx cap sync ios

# 4. Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your target device or simulator
2. Press **▶ Run** (Cmd+R)
3. For device: set your Apple ID in Signing settings

---

## 🎮 How to Use

1. **Launch** the app — boot sequence plays automatically
2. **Tap the hologram** to hear FRIDAY's greeting
3. **Type** a question in the input bar and tap ⚡ or press Enter
4. **Tap 🎙️** for voice input (speak your question)
5. **Tap ⏹️** or press Escape to stop FRIDAY speaking
6. **Tap hologram while speaking** to interrupt

### Example Commands
```
What time is it?
Tell me a joke
What are your features?
What is 25 * 48?
Capital of Japan?
System status
Who are you?
```

---

## 🔒 Offline Capability

This app requires **zero network connectivity**. All processing happens on-device:

- **Speech-to-Text**: Uses device's native speech recognition engine
- **Text-to-Speech**: Uses device's native voice synthesis
- **AI Responses**: Powered by a built-in offline knowledge engine
- **No API keys**, no cloud, no data sent anywhere

---

## 📦 Release Notes

### v1.0.0 — Initial Release
- ✅ Holographic HUD UI with animated neural network background
- ✅ JARVIS-style voice synthesis (deep male British voice)
- ✅ Voice input with Speech-to-Text
- ✅ Offline knowledge base (time, math, capitals, general knowledge)
- ✅ Speech interrupt controls (tap hologram, stop button, Escape)
- ✅ Animated hologram core with speaking pulse effect
- ✅ Real-time system metric simulation
- ✅ Touch-optimized mobile layout

---

## 🏗️ Project Structure

```
friday-mobile/
├── www/                    # Web source (HTML/CSS/JS)
│   └── index.html          # Main FRIDAY HUD interface
├── android/                # Android native project (Capacitor)
├── ios/                    # iOS native project (Capacitor)
├── capacitor.config.json   # Capacitor configuration
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Mobile Bridge**: [Capacitor](https://capacitorjs.com/) v6
- **Voice**: Web Speech API (native device STT/TTS)
- **Platform**: Android (APK) + iOS (IPA)

---

## 📋 Troubleshooting

| Issue | Fix |
|---|---|
| Voice not working | Grant microphone permission in app settings |
| APK won't install | Enable "Install from Unknown Sources" in device settings |
| No sound | Check device volume; disable silent mode |
| Black screen | Ensure Android 7.0+ / iOS 14+ |

---

## 🔗 Links

- **GitHub**: https://github.com/hrudayhyaswin-ux/FRIDAY
- **Swecha GitLab**: https://code.swecha.org/hruday25/friday
- **Desktop HUD**: Runs at `http://localhost:8080`
