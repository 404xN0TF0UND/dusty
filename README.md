# Dusty's Chores 🧹

A PWA chore management app with a grumpy, sarcastic digital butler named Dusty who begrudgingly helps you manage your household tasks.

## 🎭 Who is Dusty?

Dusty is your reluctant digital assistant—a personified AI personality module embedded in the chore app. He's:
- **Passive-aggressive**: "Another chore? You really live on the edge of productivity."
- **Sarcastic**: "Well look at you go. Another one bites the dust."
- **Always watching (but unimpressed)**: "Ah, {name}. The procrastinator returns."

Instead of motivational nudges, Dusty provides emotional dry-cleaning.

## ✨ Features

- **🧼 Chore Assignment**: Add, edit, complete, or delete tasks with assignees and due dates
- **🔔 Smart Grouping**: Chores are grouped by status (Today, Upcoming, Completed, Overdue)
- **✅ Completion Tracking**: Mark tasks done and bask in Dusty's snarky praise
- **👤 User Roles**: Admins can manage all chores; others see their own or unassigned
- **😒 Dusty Personality Engine**: Dynamic responses from Dusty driven by YAML config
- **📱 PWA Support**: Install as a native app on mobile and desktop
- **🔥 Real-time**: Firebase-powered real-time updates

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dusty-chores
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase** (optional for development)
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication and Firestore
   - Update `src/services/firebase.ts` with your Firebase config

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ChoreList.tsx   # Main chore display
│   ├── DustyBubble.tsx # Dusty's chat bubble
│   └── *.css           # Component styles
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── services/           # Business logic
│   ├── firebase.ts     # Firebase configuration
│   └── dustyPersonality.ts # Dusty's personality engine
├── assets/             # Static assets
│   └── dusty-personality.yaml # Dusty's responses
└── types/              # TypeScript interfaces
    └── index.ts        # Type definitions
```

### Key Components

- **DustyBubble**: Animated chat bubble for Dusty's responses
- **ChoreList**: Main interface for viewing and managing chores
- **AuthContext**: Firebase authentication wrapper
- **dustyPersonality**: YAML-driven personality engine

### Customizing Dusty

Edit `src/assets/dusty-personality.yaml` to customize Dusty's responses:

```yaml
greetings:
  - "Oh, it's you again. What a surprise."
  - "Welcome back, {name}. I suppose you want something."

chore_complete:
  - "Well look at you go. Another one bites the dust."
  - "Congratulations, I guess. Try not to strain yourself."
```

## 🎨 Design Philosophy

- **Dark Theme**: Sophisticated, butler-appropriate color scheme
- **Typography**: Georgia serif font for elegance
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Works on mobile, tablet, and desktop

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password, Google)
3. Enable Firestore Database
4. Update `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### PWA Configuration

The app is configured as a PWA with:
- Service worker for offline functionality
- App manifest for installation
- Responsive design for mobile use

## 📱 PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Basic functionality without internet
- **Push Notifications**: (Coming soon)
- **Background Sync**: (Coming soon)

## 🚧 Roadmap

- [ ] Chore creation/editing modal
- [ ] User management and roles
- [ ] Push notifications
- [ ] SMS integration
- [ ] Recurring chore logic
- [ ] Advanced filtering
- [ ] Dark/light theme toggle
- [ ] Dusty avatar customization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for accountability with a touch of humor
- Built with React, TypeScript, and Firebase
- Special thanks to Dusty for his unwavering sarcasm

---

*"Another chore? You really live on the edge of productivity."* - Dusty
