<script lang="ts">
    // Tech stack logos as inline SVGs for reliability
</script>

<div
    class="bg-bg-light dark:bg-bg-dark text-txt-light dark:text-txt-dark font-sans antialiased transition-colors duration-300 min-h-screen"
>
    <!-- Navigation -->
    <nav
        class="fixed w-full z-50 bg-surf-light/80 dark:bg-surf-dark/80 backdrop-blur-md border-b border-bord-light dark:border-bord-dark"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center gap-3">
                    <div class="bg-brand/10 p-2 rounded-lg">
                        <img src="/logo.svg" alt="Slate Logo" class="w-8 h-8" />
                    </div>
                    <span
                        class="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white"
                    >
                        Slate
                    </span>
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors"
                        href="#features">Features</a
                    >
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors"
                        href="#stack">Tech Stack</a
                    >
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors"
                        href="https://github.com/anthropics/slate"
                        target="_blank"
                        rel="noopener">GitHub</a
                    >
                </div>
                <div class="flex items-center gap-4">
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block"
                        href="/login">Login</a
                    >
                    <a
                        class="bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5"
                        href="/register"
                    >
                        Get Started
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-20 overflow-hidden relative">
        <div
            class="absolute inset-0 bg-grid -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
        ></div>
        <div
            class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
        >
            <!-- FOSS Badge -->
            <div
                class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-6"
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                    />
                </svg>
                100% Open Source · MIT License
            </div>

            <h1
                class="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6"
            >
                Clean books.<br />
                <span class="text-gradient">Clean slate.</span>
            </h1>
            <p
                class="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-4"
            >
                Simple, self-hosted invoicing for small businesses.
            </p>
            <p
                class="text-base text-slate-400 dark:text-slate-500 max-w-xl mx-auto mb-10"
            >
                No subscriptions. No vendor lock-in. Your data stays on your
                server.
            </p>

            <div
                class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
                <a
                    class="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-105 flex items-center gap-2"
                    href="/register"
                >
                    Get Started
                    <span class="material-icons-round text-sm"
                        >arrow_forward</span
                    >
                </a>
                <a
                    class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2"
                    href="https://github.com/anthropics/slate"
                    target="_blank"
                    rel="noopener"
                >
                    <svg
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                        />
                    </svg>
                    View on GitHub
                </a>
            </div>

            <!-- Dashboard Preview -->
            <div class="max-w-6xl mx-auto relative group">
                <div
                    class="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-300 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"
                ></div>
                <div
                    class="relative bg-surf-light dark:bg-surf-dark border border-bord-light dark:border-bord-dark rounded-2xl p-2 md:p-4 shadow-2xl"
                >
                    <div
                        class="flex items-center gap-2 px-4 py-3 border-b border-bord-light dark:border-bord-dark mb-4"
                    >
                        <div class="flex gap-1.5">
                            <div class="w-3 h-3 rounded-full bg-red-400"></div>
                            <div
                                class="w-3 h-3 rounded-full bg-amber-400"
                            ></div>
                            <div
                                class="w-3 h-3 rounded-full bg-emerald-400"
                            ></div>
                        </div>
                        <div
                            class="bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 px-3 py-1 rounded-md mx-auto w-1/2 text-center font-mono"
                        >
                            slate.local/dashboard
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row gap-6">
                        <div
                            class="hidden md:flex flex-col w-56 border-r border-bord-light dark:border-bord-dark pr-4 space-y-6"
                        >
                            <div class="px-2">
                                <span
                                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                                    >Main</span
                                >
                                <div class="mt-2 space-y-1">
                                    <div
                                        class="flex items-center gap-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-brand rounded-lg font-medium text-sm"
                                    >
                                        <span
                                            class="material-icons-round text-lg"
                                            >dashboard</span
                                        >
                                        Dashboard
                                    </div>
                                    <div
                                        class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium text-sm"
                                    >
                                        <span
                                            class="material-icons-round text-lg"
                                            >people</span
                                        >
                                        Customers
                                    </div>
                                </div>
                            </div>
                            <div class="px-2">
                                <span
                                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                                    >Finance</span
                                >
                                <div class="mt-2 space-y-1">
                                    <div
                                        class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium text-sm"
                                    >
                                        <span
                                            class="material-icons-round text-lg"
                                            >receipt_long</span
                                        >
                                        Invoices
                                    </div>
                                    <div
                                        class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium text-sm"
                                    >
                                        <span
                                            class="material-icons-round text-lg"
                                            >payments</span
                                        >
                                        Payments
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 space-y-6">
                            <div class="flex justify-between items-center mb-6">
                                <div>
                                    <h2
                                        class="text-2xl font-bold text-slate-900 dark:text-white"
                                    >
                                        Overview
                                    </h2>
                                    <p class="text-slate-500 text-sm">
                                        Welcome back, Acme Corp
                                    </p>
                                </div>
                                <button
                                    class="bg-brand text-white text-sm px-4 py-2 rounded-lg font-medium shadow-md hover:bg-brand-hover flex items-center gap-2"
                                >
                                    <span class="material-icons-round text-sm"
                                        >add</span
                                    > New Invoice
                                </button>
                            </div>
                            <!-- Dashboard Stats -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    class="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-xl"
                                >
                                    <div
                                        class="flex justify-between items-start mb-2"
                                    >
                                        <span
                                            class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide"
                                            >Bank</span
                                        >
                                        <span
                                            class="material-icons-round text-emerald-500 text-sm"
                                            >account_balance</span
                                        >
                                    </div>
                                    <div
                                        class="text-3xl font-bold text-slate-900 dark:text-white"
                                    >
                                        ₹3,20,000
                                    </div>
                                    <div
                                        class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium"
                                    >
                                        Available balance
                                    </div>
                                </div>
                                <div
                                    class="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/50 p-5 rounded-xl"
                                >
                                    <div
                                        class="flex justify-between items-start mb-2"
                                    >
                                        <span
                                            class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide"
                                            >To Collect</span
                                        >
                                        <span
                                            class="material-icons-round text-amber-500 text-sm"
                                            >currency_rupee</span
                                        >
                                    </div>
                                    <div
                                        class="text-3xl font-bold text-slate-900 dark:text-white"
                                    >
                                        ₹85,000
                                    </div>
                                    <div
                                        class="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium"
                                    >
                                        5 invoices pending
                                    </div>
                                </div>
                                <div
                                    class="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 p-5 rounded-xl"
                                >
                                    <div
                                        class="flex justify-between items-start mb-2"
                                    >
                                        <span
                                            class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide"
                                            >This Month</span
                                        >
                                        <span
                                            class="material-icons-round text-blue-500 text-sm"
                                            >trending_up</span
                                        >
                                    </div>
                                    <div
                                        class="text-3xl font-bold text-slate-900 dark:text-white"
                                    >
                                        ₹4,50,000
                                    </div>
                                    <div
                                        class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium"
                                    >
                                        Sales revenue
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Bento Grid -->
    <section class="py-24 bg-surf-light dark:bg-surf-dark" id="features">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <h2
                    class="text-3xl font-bold text-slate-900 dark:text-white mb-4"
                >
                    Simple by design. Powerful by default.
                </h2>
                <p class="text-slate-500 dark:text-slate-400">
                    Everything you need to manage your business finances.
                    Nothing you don't.
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Feature 1 - Large -->
                <div
                    class="md:col-span-2 bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-brand/50 transition-colors relative overflow-hidden group"
                >
                    <div class="relative z-10">
                        <div
                            class="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-4 text-brand"
                        >
                            <span class="material-icons-round"
                                >receipt_long</span
                            >
                        </div>
                        <h3
                            class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                        >
                            GST-Ready Invoicing
                        </h3>
                        <p
                            class="text-slate-500 dark:text-slate-400 mb-6 max-w-md"
                        >
                            Create professional, GST-compliant invoices in
                            seconds. CGST, SGST, IGST calculated automatically
                            based on customer location.
                        </p>
                    </div>
                    <div
                        class="absolute bottom-0 right-0 w-64 h-32 opacity-50 translate-y-4 translate-x-4 group-hover:translate-y-2 transition-transform duration-500"
                    >
                        <div class="flex items-end gap-2 h-full p-4">
                            <div
                                class="w-8 h-[40%] bg-brand/20 rounded-t-md"
                            ></div>
                            <div
                                class="w-8 h-[70%] bg-brand/40 rounded-t-md"
                            ></div>
                            <div
                                class="w-8 h-[55%] bg-brand/30 rounded-t-md"
                            ></div>
                            <div
                                class="w-8 h-[90%] bg-brand rounded-t-md shadow-lg shadow-brand/20"
                            ></div>
                            <div
                                class="w-8 h-[60%] bg-brand/30 rounded-t-md"
                            ></div>
                        </div>
                    </div>
                </div>

                <!-- Feature 2 -->
                <div
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-emerald-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400"
                    >
                        <span class="material-icons-round">payments</span>
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Payment Tracking
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Record payments, track outstanding dues, and see who
                        owes you at a glance.
                    </p>
                </div>

                <!-- Feature 3 -->
                <div
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-blue-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"
                    >
                        <span class="material-icons-round"
                            >account_balance_wallet</span
                        >
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Expense Management
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Track business expenses with vendor management. GST
                        input credit handled automatically.
                    </p>
                </div>

                <!-- Feature 4 - Large with preview -->
                <div
                    class="md:col-span-2 bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-amber-400 transition-colors relative overflow-hidden group"
                >
                    <div
                        class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                        <div class="max-w-xs">
                            <div
                                class="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400"
                            >
                                <span class="material-icons-round">share</span>
                            </div>
                            <h3
                                class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                            >
                                WhatsApp Sharing
                            </h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">
                                Send invoices and payment confirmations directly
                                via WhatsApp. One click, instantly delivered.
                            </p>
                        </div>
                        <div
                            class="bg-white dark:bg-surf-dark border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm w-full max-w-xs transform group-hover:-rotate-1 transition-transform"
                        >
                            <div class="flex items-center gap-3 mb-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"
                                >
                                    <svg
                                        class="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div
                                        class="text-xs font-bold text-slate-800 dark:text-slate-200"
                                    >
                                        Invoice Sent
                                    </div>
                                    <div class="text-[10px] text-slate-400">
                                        via WhatsApp
                                    </div>
                                </div>
                            </div>
                            <div
                                class="h-2 w-3/4 bg-slate-100 dark:bg-slate-700 rounded mb-2"
                            ></div>
                            <div
                                class="h-2 w-1/2 bg-slate-100 dark:bg-slate-700 rounded"
                            ></div>
                        </div>
                    </div>
                </div>

                <!-- Feature 5 -->
                <div
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-rose-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400"
                    >
                        <span class="material-icons-round"
                            >assignment_return</span
                        >
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Credit Notes
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Issue credit notes for returns. Apply credits to future
                        invoices automatically.
                    </p>
                </div>

                <!-- Feature 6 -->
                <div
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-violet-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-violet-100 dark:bg-violet-900/20 rounded-xl flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400"
                    >
                        <span class="material-icons-round">picture_as_pdf</span>
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        PDF Export
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Professional PDF invoices with your logo. Print or email
                        directly to customers.
                    </p>
                </div>

                <!-- Feature 7 -->
                <div
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-cyan-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-xl flex items-center justify-center mb-4 text-cyan-600 dark:text-cyan-400"
                    >
                        <span class="material-icons-round">backup</span>
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Single File Backup
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Your entire database is one SQLite file. Copy it
                        anywhere, restore anytime.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Why FOSS Section -->
    <section
        class="py-20 bg-bg-light dark:bg-bg-dark border-y border-bord-light dark:border-bord-dark"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2
                    class="text-2xl font-bold text-slate-900 dark:text-white mb-3"
                >
                    Why Open Source?
                </h2>
                <p class="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    Your financial data is sensitive. You should own it
                    completely.
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="text-center">
                    <div
                        class="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4"
                    >
                        <span class="material-icons-round text-2xl">lock</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2">
                        Your Data, Your Server
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Runs on your hardware. No cloud. No third-party access.
                        Complete privacy.
                    </p>
                </div>
                <div class="text-center">
                    <div
                        class="w-14 h-14 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4"
                    >
                        <span class="material-icons-round text-2xl"
                            >money_off</span
                        >
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2">
                        Zero Subscription Fees
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        No monthly fees, ever. Download once, use forever. Scale
                        without limits.
                    </p>
                </div>
                <div class="text-center">
                    <div
                        class="w-14 h-14 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4"
                    >
                        <span class="material-icons-round text-2xl">code</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2">
                        Fully Customizable
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        MIT licensed. Fork it, modify it, make it yours. No
                        restrictions.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="py-24 bg-surf-light dark:bg-surf-dark" id="stack">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2
                    class="text-3xl font-bold text-slate-900 dark:text-white mb-4"
                >
                    Built with modern tech
                </h2>
                <p class="text-slate-500 dark:text-slate-400">
                    A carefully chosen stack for simplicity, performance, and
                    developer happiness.
                </p>
            </div>

            <div
                class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16"
            >
                <!-- Svelte -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-bord-light dark:border-bord-dark flex items-center justify-center group-hover:scale-110 group-hover:border-orange-400 transition-all shadow-sm"
                    >
                        <svg
                            class="w-10 h-10"
                            viewBox="0 0 98.1 118"
                            fill="none"
                        >
                            <path
                                d="M91.8 15.6C80.9-.1 59.2-4.7 43.6 5.2L16.1 22.8C8.6 27.5 3.4 35.2 1.9 43.9c-1.3 7.3-.2 14.8 3.3 21.3-2.4 3.6-4 7.6-4.7 11.8-1.6 8.9.5 18.1 5.7 25.4 11 15.7 32.6 20.3 48.2 10.4l27.5-17.5c7.5-4.8 12.7-12.4 14.2-21.1 1.3-7.3.2-14.8-3.3-21.3 2.4-3.6 4-7.6 4.7-11.8 1.6-9-.5-18.2-5.7-25.5z"
                                fill="#FF3E00"
                            />
                            <path
                                d="M40.9 103.9a24.1 24.1 0 01-26-9.3 20.2 20.2 0 01-3.4-15.1c.2-.9.4-1.7.6-2.6l.5-1.6 1.4 1c3.3 2.4 6.9 4.2 10.8 5.4l1 .3-.1 1c-.1 1.4.3 2.9 1.1 4.1a6.4 6.4 0 006.9 2.5c.7-.2 1.4-.4 2-.8l27.5-17.5c1.4-.9 2.3-2.2 2.6-3.8.3-1.6-.1-3.3-1-4.6a6.4 6.4 0 00-6.9-2.5c-.7.2-1.4.4-2 .8l-10.5 6.7a24.2 24.2 0 01-6 2.3 24.1 24.1 0 01-26-9.3 20.2 20.2 0 01-3.4-15.1c.9-5.2 3.9-9.7 8.3-12.5L45.3 16c1.9-1.2 3.9-2.1 6-2.7 9.4-2.5 19.5 1.3 24.6 9.3a20.2 20.2 0 013.4 15.1c-.2.9-.4 1.7-.6 2.6l-.5 1.6-1.4-1c-3.3-2.4-6.9-4.2-10.8-5.4l-1-.3.1-1c.1-1.4-.3-2.9-1.1-4.1a6.4 6.4 0 00-6.9-2.5c-.7.2-1.4.4-2 .8L28.6 46c-1.4.9-2.3 2.2-2.6 3.8-.3 1.6.1 3.3 1 4.6a6.4 6.4 0 006.9 2.5c.7-.2 1.4-.4 2-.8l10.5-6.7c1.9-1.2 3.9-2.1 6-2.7 9.4-2.5 19.5 1.3 24.6 9.3 3.3 4.7 4.5 10.5 3.4 16.1-.9 5.2-3.9 9.7-8.3 12.5l-27.5 17.5c-1.9 1.2-3.9 2.1-6 2.7-1.2.3-2.5.5-3.7.5z"
                                fill="#fff"
                            />
                        </svg>
                    </div>
                    <div class="text-center">
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            SvelteKit
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Full-stack
                        </p>
                    </div>
                </div>

                <!-- TypeScript -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-bord-light dark:border-bord-dark flex items-center justify-center group-hover:scale-110 group-hover:border-blue-400 transition-all shadow-sm"
                    >
                        <svg class="w-10 h-10" viewBox="0 0 128 128">
                            <path
                                fill="#3178C6"
                                d="M2 63.91v62.5h125v-125H2zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a6.46 6.46 0 00-5.57-3.16c-3.59-.26-5.9 1.74-5.89 5.06a4.64 4.64 0 00.49 2.31c.67 1.34 1.94 2.15 6.12 3.92 7.69 3.31 11 5.41 13.08 8.32a15.63 15.63 0 011.55 12.15 14.79 14.79 0 01-5.8 8.76c-2.53 1.74-5.68 2.83-10.26 3.57-1.81.29-6.37.22-8.29-.13a22.11 22.11 0 01-11.92-6.54 17 17 0 01-2.71-4.14c.16-.17 1.26-.77 2.44-1.34 1.63-.79 2.18-1 2.35-.9a17.47 17.47 0 002.81 3.42c2.59 2.17 5.65 3 9.14 2.49a7 7 0 004.74-2.19 5.24 5.24 0 00.91-5.33c-.71-1.39-2.2-2.4-6.88-4.62-5.32-2.51-7.62-4.07-9.67-6.52a13.65 13.65 0 01-2.5-7.15 22.07 22.07 0 01.29-4.73 13.43 13.43 0 016.63-9.18c2.59-1.49 5.41-2.26 9.09-2.49a19.43 19.43 0 017.98 1.15zM75.7 73.14l.08 6H58.39v37.21H46.92V79.14H29.53v-5.81a51.19 51.19 0 01.13-6.07c.06-.06 10.42-.1 23-.1h22.94z"
                            />
                        </svg>
                    </div>
                    <div class="text-center">
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            TypeScript
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Type Safety
                        </p>
                    </div>
                </div>

                <!-- SQLite -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-bord-light dark:border-bord-dark flex items-center justify-center group-hover:scale-110 group-hover:border-sky-400 transition-all shadow-sm"
                    >
                        <svg class="w-10 h-10" viewBox="0 0 48 48">
                            <path
                                fill="#0F99D6"
                                d="M24 4L6 14v20l18 10 18-10V14L24 4z"
                            />
                            <path
                                fill="#1CB7EB"
                                d="M24 4L6 14l18 10 18-10L24 4z"
                            />
                            <path
                                fill="#0B7CAB"
                                d="M24 24v20l18-10V14L24 24z"
                            />
                            <path fill="#0E8FC9" d="M6 14v20l18 10V24L6 14z" />
                        </svg>
                    </div>
                    <div class="text-center">
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            SQLite
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Database
                        </p>
                    </div>
                </div>

                <!-- Drizzle -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-bord-light dark:border-bord-dark flex items-center justify-center group-hover:scale-110 group-hover:border-lime-400 transition-all shadow-sm"
                    >
                        <svg
                            class="w-10 h-10"
                            viewBox="0 0 160 160"
                            fill="none"
                        >
                            <path
                                d="M87.5 43.4c-3.5-6-12-6-15.4 0L51.3 79.7c-3.5 6 .8 13.5 7.7 13.5h41.5c6.9 0 11.2-7.5 7.7-13.5L87.5 43.4z"
                                fill="#C5F74F"
                            />
                            <path
                                d="M107.4 96.7c-3.5-6-12-6-15.4 0l-20.8 36.3c-3.5 6 .8 13.5 7.7 13.5h41.5c6.9 0 11.2-7.5 7.7-13.5l-20.7-36.3z"
                                fill="#C5F74F"
                            />
                            <path
                                d="M68.1 96.7c-3.5-6-12-6-15.4 0L32 133c-3.5 6 .8 13.5 7.7 13.5h41.5c6.9 0 11.2-7.5 7.7-13.5L68.1 96.7z"
                                fill="#C5F74F"
                            />
                        </svg>
                    </div>
                    <div class="text-center">
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            Drizzle
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            ORM
                        </p>
                    </div>
                </div>

                <!-- Tailwind -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-bord-light dark:border-bord-dark flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-400 transition-all shadow-sm"
                    >
                        <svg class="w-10 h-10" viewBox="0 0 54 33">
                            <path
                                fill="#38BDF8"
                                d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z"
                            />
                        </svg>
                    </div>
                    <div class="text-center">
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            Tailwind
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Styling
                        </p>
                    </div>
                </div>

                <!-- Zod -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-bord-light dark:border-bord-dark flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-400 transition-all shadow-sm"
                    >
                        <svg
                            class="w-10 h-10"
                            viewBox="0 0 472 512"
                            fill="none"
                        >
                            <path
                                fill="#3068B7"
                                d="M130.4 0h211.2L472 136v240L341.6 512H130.4L0 376V136L130.4 0z"
                            />
                            <path
                                fill="#274D96"
                                d="M130.4 0L0 136v240l130.4 136h211.2L472 376V136L341.6 0H130.4z"
                            />
                            <path
                                fill="#fff"
                                d="M200 148h140l-85 216h-55V148z"
                            />
                        </svg>
                    </div>
                    <div class="text-center">
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            Zod
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Validation
                        </p>
                    </div>
                </div>
            </div>

            <!-- Quick Start -->
            <div class="max-w-2xl mx-auto">
                <p
                    class="text-xs text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider font-medium text-center"
                >
                    Quick Start
                </p>
                <div
                    class="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 font-mono text-sm text-left overflow-x-auto border border-slate-700"
                >
                    <div class="flex items-center gap-2 text-slate-400 mb-2">
                        <span class="text-emerald-400">$</span>
                        <span class="text-slate-300"
                            >git clone https://github.com/anthropics/slate.git</span
                        >
                    </div>
                    <div class="flex items-center gap-2 text-slate-400 mb-2">
                        <span class="text-emerald-400">$</span>
                        <span class="text-slate-300"
                            >cd slate && npm install</span
                        >
                    </div>
                    <div class="flex items-center gap-2 text-slate-400">
                        <span class="text-emerald-400">$</span>
                        <span class="text-slate-300">npm run dev</span>
                        <span class="text-slate-500 ml-2"># That's it!</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section
        class="py-24 bg-bg-light dark:bg-bg-dark border-t border-bord-light dark:border-bord-dark"
    >
        <div class="max-w-3xl mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Ready to own your finances?
            </h2>
            <p class="text-slate-500 dark:text-slate-400 mb-8">
                Clone, customize, and deploy. Your business, your rules.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                    class="bg-brand hover:bg-brand-hover text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                    href="/register"
                >
                    Get Started Free
                </a>
                <a
                    class="bg-white dark:bg-surf-dark border border-bord-light dark:border-bord-dark text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    href="https://github.com/anthropics/slate"
                    target="_blank"
                    rel="noopener"
                >
                    <svg
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                        />
                    </svg>
                    Star on GitHub
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer
        class="bg-surf-light dark:bg-surf-dark border-t border-bord-light dark:border-bord-dark py-12"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
                class="flex flex-col md:flex-row justify-between items-center gap-6"
            >
                <div class="flex items-center gap-2">
                    <div class="bg-brand/10 p-1.5 rounded-lg">
                        <img src="/logo.svg" alt="Slate Logo" class="w-6 h-6" />
                    </div>
                    <span
                        class="font-display font-bold text-lg text-slate-900 dark:text-white"
                        >Slate</span
                    >
                </div>
                <div
                    class="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400"
                >
                    <a
                        href="https://github.com/anthropics/slate"
                        class="hover:text-brand transition-colors"
                        target="_blank"
                        rel="noopener">GitHub</a
                    >
                    <a
                        href="https://github.com/anthropics/slate/issues"
                        class="hover:text-brand transition-colors"
                        target="_blank"
                        rel="noopener">Issues</a
                    >
                    <a
                        href="https://github.com/anthropics/slate/blob/main/LICENSE"
                        class="hover:text-brand transition-colors"
                        target="_blank"
                        rel="noopener">MIT License</a
                    >
                </div>
                <p class="text-sm text-slate-400 dark:text-slate-500">
                    Open Source & Free Forever
                </p>
            </div>
        </div>
    </footer>
</div>
