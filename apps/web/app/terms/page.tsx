export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Last updated: April 2026
      </p>

      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            The basics
          </h2>
          <p>
            Loreum is a worldbuilding and story planning platform. By using it,
            you agree to these terms. If you don&apos;t agree, don&apos;t use
            the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Your content
          </h2>
          <p>
            You own everything you create on Loreum. Your characters, worlds,
            lore, and stories. All yours. We do not claim any ownership or
            license over your content beyond what&apos;s necessary to operate
            the service (storing it, displaying it, backing it up).
          </p>
          <p className="mt-2">
            If you set a project to Public, you&apos;re choosing to make that
            content viewable by anyone. You can change visibility back to
            Private at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Acceptable use
          </h2>
          <p>Don&apos;t use Loreum to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Host or distribute illegal content</li>
            <li>Harass, abuse, or threaten others</li>
            <li>
              Attempt to access other users&apos; data without authorization
            </li>
            <li>
              Use automated tools to scrape or overload the service (the API has
              rate limits for a reason)
            </li>
            <li>Resell access to the service without permission</li>
          </ul>
          <p className="mt-2">
            We reserve the right to suspend accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Accounts
          </h2>
          <p>
            You need a Google account to sign in. You&apos;re responsible for
            maintaining the security of your Google account. One person, one
            account. Don&apos;t share credentials.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Paid plans
          </h2>
          <p>
            Pro and Team plans are billed monthly via Stripe. You can cancel at
            any time. Your plan remains active until the end of the billing
            period. We don&apos;t offer refunds for partial months.
          </p>
          <p className="mt-2">
            We may change pricing with 30 days notice. Existing subscribers keep
            their current rate until their next renewal after the notice period.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            AI features
          </h2>
          <p>
            AI-generated content (text, images) is provided as-is. AI can
            produce inaccurate, inappropriate, or unexpected outputs.
            You&apos;re responsible for reviewing and editing AI-generated
            content before using it in your work.
          </p>
          <p className="mt-2">
            AI request limits are per billing cycle. Unused requests do not roll
            over.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Open source
          </h2>
          <p>
            The Loreum platform is open source under AGPL-3.0. You may self-host
            the software under the terms of that license. These Terms of Service
            apply specifically to the hosted service at loreum.app, not to
            self-hosted instances.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Availability
          </h2>
          <p>
            We aim for high availability but don&apos;t guarantee uptime. The
            service may be temporarily unavailable for maintenance, updates, or
            due to circumstances beyond our control. We&apos;ll do our best to
            give notice for planned downtime.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Liability
          </h2>
          <p>
            Loreum is provided &quot;as is&quot; without warranty. We&apos;re
            not liable for data loss, downtime, or any damages arising from use
            of the service. You should export your data regularly as a backup.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Changes
          </h2>
          <p>
            We may update these terms. Significant changes will be announced via
            the platform or email. Continued use after changes constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p>
            Questions about these terms? Reach out via{" "}
            <a
              href="https://discord.gg/loreum"
              className="text-foreground underline"
            >
              Discord
            </a>{" "}
            or{" "}
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
