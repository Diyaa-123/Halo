# SilentSense™

**Passive WiFi CSI Cognitive Health Monitoring**

SilentSense is a cutting-edge, passive, camera-free, wearable-free home health monitoring system. It leverages WiFi Channel State Information (CSI) to detect early behavioral indicators of cognitive decline in elderly individuals. 

Unlike traditional monitoring systems that struggle in multi-occupant households, SilentSense introduces a **Multi-Evidence Attribution Framework** to selectively monitor a specific individual without requiring signal separation, intrusive cameras, or wearable devices.

---

## 🚀 Key Features

* **Four-Pillar Attribution Engine**: Combines spatial containment, temporal scheduling, biometric signature matching, and behavioral context priors into a single Bayesian confidence score to accurately attribute health data in multi-person homes.
* **Cinematic 3D Interface**: Features a premium, glassmorphic UI built with React Three Fiber, showcasing a real-time responsive 3D spine and interactive telemetry cards.
* **Smooth Scrolling Experience**: Integrated with Lenis for buttery-smooth momentum scrolling and GSAP/Framer Motion for complex, cinematic entry/exit animations.
* **Clinical Dashboard**: A secure, data-rich dashboard providing live patient telemetry, physiological baselining, and behavioral drift analytics.
* **Ambient Monitoring**: 100% passive monitoring. No wearables to charge, no buttons to press, and complete privacy preservation (no cameras or audio recording).

## 🛠 Tech Stack

**Frontend Frameworks & Libraries:**
* **React 18** + **Vite**: Blazing fast modern development environment.
* **Three.js** / **React Three Fiber (R3F)** / **Drei**: Core 3D rendering engine for the cinematic landing experience and data visualization.
* **GSAP** & **Framer Motion**: Advanced timeline-based and declarative animations for smooth transitions.
* **Lenis**: Premium smooth scrolling for "Awwwards-style" interface fluidity.
* **React Router DOM**: Client-side routing for the clinical dashboard, authentication, and demo flows.

## 📂 Project Structure

```text
silent-sense/
├── src/
│   ├── components/
│   │   ├── landing/       # 3D cinematic landing page components (ThreeScene, SpineModel)
│   │   ├── layout/        # Global layout components (TopNav, IconSidebar)
│   │   └── ...
│   ├── pages/
│   │   ├── LandingPage.jsx      # The main 3D entry point
│   │   ├── LoginPage.jsx        # Clinical access portal
│   │   ├── HomeDashboard.jsx    # Primary telemetry view
│   │   ├── LiveSensingPage.jsx  # Real-time CSI data visualization
│   │   ├── DemoModePage.jsx     # Interactive presentation mode
│   │   └── ...
│   ├── styles/
│   │   ├── global.css     # Global utility classes and resets
│   │   ├── landing.css    # Cinematic animations and 3D overlay styles
│   │   └── tokens.css     # Design system variables (colors, typography)
│   ├── App.jsx            # Main router and application wrapper
│   └── main.jsx           # React entry point
└── package.json
```

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd silent-sense
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Production Build

To build the application for production:
```bash
npm run build
```
The output will be generated in the `dist/` directory, optimized and ready for deployment.

## 🔐 Authentication (Dev Mode)
For development and demonstration purposes, the Clinical Access portal (`/login`) is pre-configured with hardcoded credentials:
* **Clinician ID:** `admin@silentsense.org`
* **Secure PIN:** `admin1234`

Simply click **Authenticate** to bypass login and test the dashboard.

## 📄 License
*Draft - Internal Review*
