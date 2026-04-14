import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Native App Setup | TrueFans RADIO",
  description:
    "Guide for wrapping the TrueFans RADIO PWA as native iOS and Android apps using Capacitor.",
};

/* ---------- reusable code block ---------- */
function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="relative mt-3 rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto">
      <code>{children.trim()}</code>
    </pre>
  );
}

/* ---------- page ---------- */
export default function NativeAppGuidePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-amber-700 hover:text-amber-900 text-sm font-medium transition-colors"
        >
          &larr; Back to Home
        </Link>

        <h1 className="mt-8 text-4xl font-bold text-amber-900">
          Native App Setup
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          Wrap the TrueFans RADIO PWA as an iOS &amp; Android app with
          Capacitor.
        </p>

        <div className="mt-10 space-y-12 text-gray-700 dark:text-zinc-300 leading-relaxed">
          {/* ---- Prerequisites ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              Prerequisites
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Node.js 18+</strong> and npm (already used by the
                project)
              </li>
              <li>
                <strong>Xcode 15+</strong> (macOS only) for iOS builds &mdash;
                includes Simulator
              </li>
              <li>
                <strong>Android Studio</strong> with SDK 33+ for Android builds
              </li>
              <li>
                <strong>CocoaPods</strong> (<code>sudo gem install cocoapods</code>) for iOS
                dependency management
              </li>
            </ul>
          </section>

          {/* ---- Quick Start ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              Quick Start
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              1. Install Capacitor packages
            </h3>
            <CodeBlock>
              {`npm install @capacitor/core @capacitor/cli \\
  @capacitor/ios @capacitor/android \\
  @capacitor/splash-screen @capacitor/status-bar \\
  @capacitor/push-notifications @capacitor/browser`}
            </CodeBlock>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              2. Initialise Capacitor (already done &mdash; config checked in)
            </h3>
            <CodeBlock>{`npx cap init "TrueFans RADIO" com.truefans.radio --web-dir out`}</CodeBlock>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-500">
              Skip this step &mdash; <code>capacitor.config.ts</code> is already
              in the repo.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              3. Add native platforms
            </h3>
            <CodeBlock>{`npx cap add ios\nnpx cap add android`}</CodeBlock>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              4. Build the web app &amp; export
            </h3>
            <CodeBlock>{`npm run build\nnpx next export`}</CodeBlock>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-500">
              This produces the <code>out/</code> directory that Capacitor
              bundles into the native shell. In production the app live-loads
              from the deployed URL instead.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              5. Sync web assets to native projects
            </h3>
            <CodeBlock>{`npx cap sync`}</CodeBlock>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              6. Open in IDE
            </h3>
            <CodeBlock>{`npx cap open ios      # opens Xcode\nnpx cap open android  # opens Android Studio`}</CodeBlock>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              One-liner build script
            </h3>
            <CodeBlock>{`bash scripts/build-native.sh`}</CodeBlock>
          </section>

          {/* ---- Configuration ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              Configuration
            </h2>
            <p>
              All Capacitor settings live in{" "}
              <code className="bg-gray-100 px-1 rounded">capacitor.config.ts</code>{" "}
              at the project root.
            </p>

            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm space-y-3">
              <div>
                <strong>appId:</strong>{" "}
                <code>com.truefans.radio</code> &mdash; bundle identifier for
                both App Store and Google Play.
              </div>
              <div>
                <strong>webDir:</strong>{" "}
                <code>out</code> &mdash; Next.js static export directory.
              </div>
              <div>
                <strong>server.url:</strong> Points to the production Netlify
                deploy so the native shell always loads the latest PWA without
                re-submitting to app stores.
              </div>
              <div>
                <strong>SplashScreen:</strong> Uses brand colour{" "}
                <code>#78350f</code> with a 2-second display.
              </div>
              <div>
                <strong>StatusBar:</strong> Dark text on brand-coloured
                background.
              </div>
              <div>
                <strong>PushNotifications:</strong> Configured for badge, sound,
                and alert presentation.
              </div>
            </div>
          </section>

          {/* ---- Push Notifications ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              Push Notifications
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4">
              iOS &mdash; Apple Push Notification service (APNs)
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                Enable <em>Push Notifications</em> capability in Xcode under
                Signing &amp; Capabilities.
              </li>
              <li>
                Generate an APNs Key in{" "}
                <a
                  href="https://developer.apple.com/account/resources/authkeys/list"
                  className="text-amber-700 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apple Developer &rarr; Keys
                </a>
                .
              </li>
              <li>
                Upload the <code>.p8</code> key file to your push provider
                (e.g., Firebase or a custom server).
              </li>
              <li>
                Register for push tokens in the app using{" "}
                <code>PushNotifications.register()</code>.
              </li>
            </ol>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              Android &mdash; Firebase Cloud Messaging (FCM)
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                Create a Firebase project and register the Android app with
                package name <code>com.truefans.radio</code>.
              </li>
              <li>
                Download <code>google-services.json</code> and place it in{" "}
                <code>android/app/</code>.
              </li>
              <li>
                The Capacitor Push Notifications plugin handles FCM registration
                automatically.
              </li>
            </ol>
          </section>

          {/* ---- Deep Linking ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              Deep Linking
            </h2>
            <p>
              Deep links let URLs like{" "}
              <code>https://truefans-radio.netlify.app/player</code> open
              directly inside the native app.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4">iOS</h3>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                Add an <code>apple-app-site-association</code> file to{" "}
                <code>public/.well-known/</code> with applinks for the domain.
              </li>
              <li>
                Enable <em>Associated Domains</em> in Xcode:{" "}
                <code>applinks:truefans-radio.netlify.app</code>.
              </li>
            </ol>

            <h3 className="text-lg font-medium text-gray-800 mt-4">Android</h3>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                Add an <code>assetlinks.json</code> file to{" "}
                <code>public/.well-known/</code>.
              </li>
              <li>
                Configure intent filters in{" "}
                <code>android/app/src/main/AndroidManifest.xml</code>.
              </li>
            </ol>
          </section>

          {/* ---- App Store Submission ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              App Store Submission Checklist
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mt-4">
              Apple App Store
            </h3>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>App icon set (1024x1024 for App Store, plus all required sizes)</li>
              <li>Launch screen / splash configured via SplashScreen plugin</li>
              <li>Privacy policy URL (already at <code>/privacy</code>)</li>
              <li>App Review description of streaming functionality</li>
              <li>
                Background Audio entitlement enabled for continuous playback
              </li>
              <li>
                <code>NSAppTransportSecurity</code> &mdash; not needed since we
                use HTTPS only
              </li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-6">
              Google Play Store
            </h3>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Signed release APK/AAB using a keystore</li>
              <li>Feature graphic (1024x500) and screenshots</li>
              <li>Privacy policy URL</li>
              <li>Content rating questionnaire completed</li>
              <li>Target API level meets current Play Store requirements</li>
            </ul>
          </section>

          {/* ---- Troubleshooting ---- */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              Troubleshooting
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Blank screen on device:</strong> Ensure{" "}
                <code>server.url</code> in <code>capacitor.config.ts</code>{" "}
                points to the correct production URL and the device has
                internet access.
              </li>
              <li>
                <strong>iOS build fails:</strong> Run <code>pod install</code>{" "}
                in the <code>ios/App</code> directory.
              </li>
              <li>
                <strong>Android Gradle errors:</strong> Ensure Android SDK 33+
                is installed and <code>ANDROID_HOME</code> is set.
              </li>
              <li>
                <strong>Live reload for development:</strong> Temporarily change{" "}
                <code>server.url</code> to your local dev server (
                <code>http://localhost:3000</code>) and set{" "}
                <code>cleartext: true</code> for Android.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-16 border-t border-amber-200 pt-8 text-center text-sm text-gray-400">
          TrueFans RADIO &mdash; Native App Documentation
        </div>
      </div>
    </main>
  );
}
