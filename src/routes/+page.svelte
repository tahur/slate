<script lang="ts">
    import {
        Code2,
        Scale,
        ShieldCheck,
        FileText,
        Wallet,
        Receipt,
        IndianRupee,
        BarChart3,
        Lock,
        ArrowRight,
        Check,
        Github,
    } from "lucide-svelte";
    const currentYear = new Date().getFullYear();

    const businessActions = [
        { action: "Create Invoice", result: "Sent to customer, GST calculated, books updated", icon: FileText },
        { action: "Record Payment", result: "Matched to invoice, bank balance updated", icon: Wallet },
        { action: "Add Expense", result: "Categorized, tax tracked, cash adjusted", icon: Receipt },
    ] as const;
</script>

<svelte:head>
    <title>Slate — Simple Invoicing & Accounting for Indian Small Businesses</title>
    <meta
        name="description"
        content="Create invoices, record payments, track expenses. Slate handles GST, bookkeeping, and compliance in the background. Free, open-source, and built for Indian small businesses."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="landing-shell min-h-screen">
    <div class="ambient" aria-hidden="true"></div>

    <header
        class="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur"
    >
        <div
            class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
        >
            <a href="/" class="flex items-center gap-2.5">
                <img src="/logo.svg" alt="Slate" class="logo-mark" />
                <span class="wordmark">Slate</span>
            </a>

            <nav class="hidden items-center gap-7 md:flex">
                <a href="#product" class="nav-link">Features</a>
                <a href="#business-first" class="nav-link">What you get</a>
                <a href="#tech" class="nav-link">Open source</a>
            </nav>

            <div class="flex items-center gap-3">
                <a href="https://github.com/tahur/slate" target="_blank" rel="noopener" class="nav-link hidden sm:inline-flex" title="GitHub">
                    <Github class="size-5" />
                </a>
                <a href="/login" class="nav-link hidden sm:inline-flex">Login</a>
                <a href="/register" class="btn-dark">Start free</a>
            </div>
        </div>
    </header>

    <main class="relative z-10">
        <!-- Hero -->
        <section class="px-4 pb-14 pt-12 sm:px-6 lg:pb-20 lg:pt-16">
            <div
                class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
            >
                <div class="reveal" style="--delay: 40ms">
                    <p class="kicker">Built for Indian small businesses</p>
                    <h1 class="hero-title">
                        Run your business.
                        <span>We keep the books.</span>
                    </h1>
                    <p class="hero-copy">
                        Create invoices, record payments, track expenses — in plain language.
                        Slate handles GST, bookkeeping, and compliance automatically.
                        No accounting knowledge needed.
                    </p>

                    <div class="mt-7 flex flex-wrap gap-3">
                        <a href="/register" class="btn-dark">Get started free</a>
                        <a href="/login" class="btn-light">Login</a>
                    </div>

                    <ul class="mt-8 grid gap-2.5 text-sm text-[var(--muted)]">
                        <li class="flex items-center gap-2"><Check class="size-4 shrink-0 text-[var(--accent-dark-orange)]" /> GST invoices with CGST, SGST, IGST — done right</li>
                        <li class="flex items-center gap-2"><Check class="size-4 shrink-0 text-[var(--accent-dark-orange)]" /> Track who owes you and what you owe</li>
                        <li class="flex items-center gap-2"><Check class="size-4 shrink-0 text-[var(--accent-dark-orange)]" /> Free and open source — your data, your server</li>
                    </ul>
                </div>

                <article class="panel reveal" style="--delay: 120ms">
                    <header class="panel-head">
                        <span class="label">You do this</span>
                        <span class="label">Slate takes care of the rest</span>
                    </header>

                    <div class="action-map">
                        {#each businessActions as item}
                            <div class="action-row">
                                <div class="action-cell">
                                    <item.icon class="shrink-0 size-4 text-[var(--muted)]" />
                                    <span>{item.action}</span>
                                </div>
                                <ArrowRight class="shrink-0 size-4 text-[var(--muted)] max-sm:rotate-90 max-sm:ml-6" />
                                <span class="action-result">{item.result}</span>
                            </div>
                        {/each}
                    </div>

                    <p class="panel-note">
                        Proper double-entry bookkeeping runs under the hood — you never have to think about it.
                    </p>
                </article>
            </div>
        </section>

        <!-- Product pillars -->
        <section class="px-4 pb-12 sm:px-6" id="product">
            <div
                class="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                <article class="proof-card reveal" style="--delay: 60ms">
                    <IndianRupee class="mb-3 size-6 text-[var(--muted)]" />
                    <p>Made for India</p>
                    <h3>GST invoicing built in</h3>
                </article>
                <article class="proof-card reveal" style="--delay: 100ms">
                    <Code2 class="mb-3 size-6 text-[var(--muted)]" />
                    <p>100% open source</p>
                    <h3>Your data, your server</h3>
                </article>
                <article class="proof-card reveal" style="--delay: 140ms">
                    <Scale class="mb-3 size-6 text-[var(--muted)]" />
                    <p>Accurate books</p>
                    <h3>Proper accounting under the hood</h3>
                </article>
                <article class="proof-card reveal" style="--delay: 180ms">
                    <ShieldCheck class="mb-3 size-6 text-[var(--muted)]" />
                    <p>Reliable</p>
                    <h3>Nothing gets lost or duplicated</h3>
                </article>
            </div>
        </section>

        <!-- What you get -->
        <section class="px-4 py-10 sm:px-6 lg:py-14" id="business-first">
            <div class="mx-auto max-w-6xl">
                <div class="mb-7">
                    <p class="kicker">What you get</p>
                    <h2 class="section-title">
                        Everything to run your business finances.
                    </h2>
                </div>

                <div
                    class="grid auto-rows-[minmax(150px,auto)] gap-3 lg:grid-cols-12"
                >
                    <article
                        class="feature feature-wide reveal lg:col-span-7"
                        style="--delay: 80ms"
                    >
                        <div class="mb-4 flex items-center gap-3">
                            <FileText class="size-5 text-[var(--muted)]" />
                            <p class="chip">Invoicing</p>
                        </div>
                        <h3>Professional GST invoices in seconds.</h3>
                        <p>
                            Add line items, pick the GST rate, and send. Slate calculates
                            CGST/SGST or IGST based on your customer's state, numbers your
                            invoices, and generates a PDF ready to share.
                        </p>
                    </article>

                    <article
                        class="feature reveal lg:col-span-5"
                        style="--delay: 120ms"
                    >
                        <div class="mb-4 flex items-center gap-3">
                            <Wallet class="size-5 text-[var(--muted)]" />
                            <p class="chip">Payments</p>
                        </div>
                        <h3>Know who paid and who hasn't.</h3>
                        <p>
                            Record payments against invoices. Slate tracks outstanding
                            balances, partial payments, and updates your books automatically.
                        </p>
                    </article>

                    <article
                        class="feature reveal lg:col-span-4"
                        style="--delay: 160ms"
                    >
                        <div class="mb-4 flex items-center gap-3">
                            <Receipt class="size-5 text-[var(--muted)]" />
                            <p class="chip">Expenses</p>
                        </div>
                        <h3>Track every rupee going out.</h3>
                        <p>
                            Log expenses by category, vendor, and payment method.
                            Input tax is tracked so nothing is missed at filing time.
                        </p>
                    </article>

                    <article
                        class="feature reveal lg:col-span-4"
                        style="--delay: 200ms"
                    >
                        <div class="mb-4 flex items-center gap-3">
                            <BarChart3 class="size-5 text-[var(--muted)]" />
                            <p class="chip">Reports</p>
                        </div>
                        <h3>See where your money is.</h3>
                        <p>
                            Cashbook, receivables, tax summaries — the reports you
                            actually need, without the ones you don't.
                        </p>
                    </article>

                    <article
                        class="feature reveal lg:col-span-4"
                        style="--delay: 240ms"
                    >
                        <div class="mb-4 flex items-center gap-3">
                            <Lock class="size-5 text-[var(--muted)]" />
                            <p class="chip">Reliability</p>
                        </div>
                        <h3>Your data is always safe.</h3>
                        <p>
                            Every action saves completely or not at all — no half-done
                            entries. Accidental double-clicks won't create duplicate records.
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <!-- For developers -->
        <section class="px-4 py-10 sm:px-6 lg:py-14" id="tech">
            <div class="mx-auto max-w-6xl">
                <div class="mb-7">
                    <p class="kicker">Open source</p>
                    <h2 class="section-title">
                        Built by developers, for everyone.
                    </h2>
                    <p class="section-subtitle">
                        Slate is fully open source. Self-host it on your own server, inspect
                        every line of code, or contribute. No vendor lock-in, no subscription fees.
                    </p>
                </div>

                <div class="tech-strip reveal" style="--delay: 80ms">
                    <span class="tech-tag">Svelte 5</span>
                    <span class="tech-tag">SvelteKit</span>
                    <span class="tech-tag">TypeScript</span>
                    <span class="tech-tag">Postgres</span>
                    <span class="tech-tag">Supabase</span>
                    <span class="tech-tag">Drizzle ORM</span>
                    <span class="tech-tag">Tailwind v4</span>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section class="px-4 pb-14 pt-6 sm:px-6 lg:pb-20" id="reliability">
            <div
                class="mx-auto max-w-6xl border border-[var(--ink)] bg-[var(--ink)] p-6 text-[var(--surface)] sm:p-8"
            >
                <p class="kicker kicker-invert">No fees, no lock-in</p>
                <h2 class="section-title-invert">
                    Your business data belongs to you.
                </h2>
                <p class="mt-3 max-w-2xl text-sm text-white/75 sm:text-base">
                    No monthly subscriptions. No feature gates. Host Slate on your own
                    server or use our managed version. Your invoices, payments, and
                    financial data stay under your control — always.
                </p>
                <div class="mt-6 flex flex-wrap gap-3">
                    <a href="/register" class="btn-white">Get started free</a>
                    <a href="/login" class="btn-ghost">Login</a>
                </div>
            </div>
        </section>
    </main>

    <footer class="border-t border-[var(--line)] bg-[var(--surface)]">
        <div
            class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
            <p>
                © {currentYear} Slate. Simple invoicing and accounting for Indian small businesses.
            </p>
            <div class="flex items-center gap-5">
                <a class="nav-link" href="#product">Features</a>
                <a class="nav-link" href="#business-first">What you get</a>
                <a class="nav-link" href="#tech">Open source</a>
            </div>
        </div>
    </footer>
</div>

<style>
    :global(body) {
        background: #f3f3f3;
    }

    .landing-shell {
        --ink: #111111;
        --surface: #fcfcfc;
        --soft: #f4f4f4;
        --muted: #5f5f5f;
        --line: #d4d4d4;
        --accent-dark-orange: var(--color-primary);
        background: #f3f3f3;
        color: var(--ink);
        font-family: "Manrope", "Helvetica Neue", Helvetica, sans-serif;
    }

    .landing-shell h1,
    .landing-shell h2,
    .landing-shell h3 {
        color: var(--ink);
        font-family: "Space Grotesk", "Manrope", "Helvetica Neue", Helvetica,
            sans-serif;
        letter-spacing: -0.02em;
    }

    .ambient {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: radial-gradient(
                circle at 15% 6%,
                rgb(0 0 0 / 0.08) 0,
                transparent 30%
            ),
            radial-gradient(
                circle at 90% 0%,
                rgb(26 18 14 / 0.1) 0,
                transparent 32%
            ),
            linear-gradient(rgb(0 0 0 / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgb(0 0 0 / 0.06) 1px, transparent 1px);
        background-size:
            auto,
            auto,
            56px 56px,
            56px 56px;
        mask-image: linear-gradient(
            to bottom,
            black 0%,
            rgb(0 0 0 / 0.85) 48%,
            transparent 100%
        );
    }

    .logo-mark {
        width: 2rem;
        height: 2rem;
        border-radius: 6px;
    }

    .wordmark {
        font-family: "Space Grotesk", "Manrope", sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
        letter-spacing: -0.03em;
        color: var(--ink);
    }

    .kicker {
        display: inline-flex;
        border: 1px solid var(--ink);
        background: var(--surface);
        color: var(--ink);
        font-size: 0.69rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        padding: 0.34rem 0.55rem;
        text-transform: uppercase;
        border-radius: var(--radius);
    }

    .kicker-invert {
        border-color: rgb(255 255 255 / 0.3);
        color: white;
        background: transparent;
    }

    .hero-title {
        margin-top: 0.95rem;
        max-width: 14ch;
        font-size: clamp(2rem, 5vw, 3.6rem);
        line-height: 1.03;
    }

    .hero-title span {
        color: var(--accent-dark-orange);
    }

    .hero-copy {
        margin-top: 1rem;
        max-width: 56ch;
        color: var(--muted);
        font-size: 1rem;
    }

    .btn-dark,
    .btn-light,
    .btn-white,
    .btn-ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--ink);
        font-size: 0.86rem;
        font-weight: 700;
        padding: 0.62rem 1rem;
        transition: all 180ms ease;
        border-radius: var(--radius);
    }

    .btn-dark {
        background: var(--color-primary);
        color: var(--color-primary-foreground, white);
        border-color: var(--color-primary);
    }

    .btn-dark:hover {
        background: var(--color-brand-hover, #e04f0d);
        border-color: var(--color-brand-hover, #e04f0d);
    }

    .btn-light {
        background: var(--surface);
        color: var(--ink);
    }

    .btn-light:hover {
        background: #efefef;
    }

    .btn-white {
        background: white;
        color: var(--ink);
        border-color: white;
    }

    .btn-white:hover {
        background: #ededed;
    }

    .btn-ghost {
        background: transparent;
        color: white;
        border-color: rgb(255 255 255 / 0.4);
    }

    .btn-ghost:hover {
        border-color: white;
    }

    .nav-link {
        color: var(--muted);
        font-size: 0.88rem;
        font-weight: 600;
        transition: color 180ms ease;
    }

    .nav-link:hover {
        color: var(--ink);
    }

    .panel {
        border: 1px solid var(--line);
        background: var(--surface);
        padding: 1.25rem;
        border-radius: var(--radius);
    }

    .panel-head {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .label {
        border: 1px solid var(--line);
        background: var(--soft);
        color: var(--muted);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 0.24rem 0.46rem;
        text-transform: uppercase;
        border-radius: var(--radius);
    }

    .action-map {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .action-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 0.6rem 0;
        border-top: 1px solid var(--line);
    }

    .action-row:first-child {
        border-top: 0;
        padding-top: 0;
    }

    .action-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        flex: 1;
        font-size: 0.9rem;
        color: var(--ink);
    }

    .action-result {
        font-size: 0.82rem;
        color: var(--muted);
        font-weight: 500;
        flex: 1.2;
    }

    .panel-note {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--line);
        font-size: 0.78rem;
        color: var(--muted);
    }

    .proof-card,
    .feature {
        border: 1px solid var(--line);
        background: var(--surface);
        padding: 0.95rem;
        border-radius: var(--radius);
    }

    .section-title {
        margin-top: 0.75rem;
        font-size: clamp(1.4rem, 2.8vw, 2rem);
        line-height: 1.15;
    }

    .section-subtitle {
        margin-top: 0.5rem;
        max-width: 52ch;
        font-size: 1rem;
        color: var(--muted);
    }

    .section-title-invert {
        margin-top: 0.6rem;
        color: white;
        font-size: clamp(1.35rem, 2.8vw, 1.95rem);
        line-height: 1.15;
    }

    .feature h3 {
        margin-top: 0.5rem;
        font-size: 1.05rem;
        line-height: 1.2;
    }

    .feature p {
        margin-top: 0.45rem;
        color: var(--muted);
        font-size: 0.86rem;
    }

    .feature-wide {
        background-image: linear-gradient(
                to right,
                rgb(0 0 0 / 0.04) 1px,
                transparent 1px
            ),
            linear-gradient(to bottom, rgb(0 0 0 / 0.04) 1px, transparent 1px);
        background-size: 26px 26px;
    }

    .chip {
        display: inline-flex;
        border: 1px solid var(--line);
        background: var(--soft);
        color: var(--muted);
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 0.2rem 0.44rem;
        text-transform: uppercase;
        border-radius: var(--radius);
    }

    /* Tech section */
    .tech-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tech-tag {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.45rem 0.85rem;
        border-radius: var(--radius);
    }

    .reveal {
        opacity: 0;
        transform: translateY(8px);
        animation: riseIn 520ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        animation-delay: var(--delay, 0ms);
    }

    @keyframes riseIn {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 640px) {
        .action-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.35rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .reveal {
            animation: none !important;
            opacity: 1;
            transform: none;
        }
    }
</style>
