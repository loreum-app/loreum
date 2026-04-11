export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Last updated: April 2026
      </p>

      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            What we collect
          </h2>
          <p>
            When you sign in with Google OAuth, we receive your email address,
            display name, and profile picture. We store this to identify your
            account. We do not access your Google contacts, calendar, or any
            other data.
          </p>
          <p className="mt-2">
            We store the content you create: projects, entities, relationships,
            timeline events, lore articles, and storyboard data. This is your
            world data and it belongs to you.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            How we use it
          </h2>
          <p>
            Your account data is used to authenticate you and display your
            profile. Your world data is used to provide the Loreum service,
            including storing, rendering, and serving your content.
          </p>
          <p className="mt-2">
            If you enable a public wiki, the content you mark as public is
            accessible to anyone with the URL. The secrets field on entities is
            never included in public views.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            AI features
          </h2>
          <p>
            If you use in-app AI features (Pro/Team), your world data is sent to
            third-party AI providers (e.g., Anthropic, OpenAI) to process your
            requests. We do not use your data to train AI models. We do not
            share your data with AI providers for any purpose other than
            fulfilling your specific request.
          </p>
          <p className="mt-2">
            If you use the MCP server with your own AI provider, your data goes
            directly from the MCP server to your chosen provider. Loreum does
            not intermediate or log those requests.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Data storage
          </h2>
          <p>
            Your data is stored in PostgreSQL databases. File uploads are stored
            on Cloudflare R2. Sessions are managed via Redis. All data is
            encrypted in transit (HTTPS). Database backups are encrypted at
            rest.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Data export and deletion
          </h2>
          <p>
            You can export your project data as JSON or markdown at any time.
            You can delete your account and all associated data by contacting
            us. Deletion is permanent and irreversible.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Cookies
          </h2>
          <p>
            We use httpOnly session cookies for authentication and CSRF
            protection. We do not use tracking cookies, analytics pixels, or
            third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Third parties
          </h2>
          <p>
            We use Google for OAuth authentication, Cloudflare for CDN and file
            storage, and Stripe for payment processing (Pro/Team). We do not
            sell, share, or monetize your data in any other way.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Open source
          </h2>
          <p>
            Loreum is open source (AGPL-3.0). You can inspect exactly what data
            we collect and how we handle it by reading the source code. If you
            prefer, you can self-host and keep all data on your own
            infrastructure.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p>
            For privacy questions or data deletion requests, reach out via{" "}
            <a
              href="https://discord.gg/A2s5gZ8rcz"
              className="text-foreground underline"
            >
              Discord
            </a>{" "}
            or open an issue on{" "}
            <a
              href="https://github.com/loreum-app/loreum"
              className="text-foreground underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
