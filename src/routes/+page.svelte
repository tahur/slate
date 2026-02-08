<script lang="ts">
    // Landing page for Slate - adapted from Poly design
</script>

<svelte:head>
    <title>Slate - Modern Accounting & Billing</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<!-- Navigation -->
<nav
    class="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-2">
                <div class="bg-primary/10 p-2 rounded-lg">
                    <img src="/logo.svg" alt="Slate" class="w-6 h-6" />
                </div>
                <span
                    class="font-bold text-xl tracking-tight text-slate-900 dark:text-white"
                    >Slate</span
                >
            </div>
            <div class="hidden md:flex items-center space-x-8">
                <a
                    class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    href="#features">Features</a
                >
                <a
                    class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    href="#tech-stack">Technology</a
                >
                <a
                    class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                    href="#open-source">Open Source</a
                >
            </div>
            <div class="flex items-center gap-4">
                <a
                    class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block"
                    href="/login">Login</a
                >
                <a
                    class="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5"
                    href="/register"
                >
                    Get Started
                </a>
            </div>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<section
    class="pt-32 pb-20 overflow-hidden relative bg-slate-50 dark:bg-slate-900"
>
    <div
        class="absolute inset-0 bg-grid -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
    ></div>
    <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
    >
        <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6"
        >
            <span class="relative flex h-2 w-2">
                <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"
                ></span>
                <span
                    class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"
                ></span>
            </span>
            Open Source · MIT Licensed
        </div>

        <h1
            class="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6"
        >
            Accounting for the <br />
            <span class="text-gradient">modern business</span>.
        </h1>

        <p
            class="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10"
        >
            Stop wrestling with spreadsheets. Slate gives you a clear, real-time
            view of your cash flow, overdue invoices, and financial health in
            one beautiful dashboard.
        </p>

        <div
            class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
        >
            <a
                class="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-105 flex items-center gap-2"
                href="/register"
            >
                Get Started Free
                <span class="material-icons-round text-sm">arrow_forward</span>
            </a>
            <a
                class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                href="#demo"
            >
                <span class="material-icons-round text-slate-400"
                    >play_circle</span
                >
                View Demo
            </a>
        </div>

        <!-- App Preview -->
        <div class="max-w-6xl mx-auto relative group">
            <div
                class="absolute -inset-1 bg-gradient-to-r from-orange-400 to-amber-300 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"
            ></div>
            <div
                class="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 md:p-4 shadow-2xl"
            >
                <!-- Window Controls -->
                <div
                    class="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 mb-4"
                >
                    <div class="flex gap-1.5">
                        <div class="w-3 h-3 rounded-full bg-red-400"></div>
                        <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div
                        class="bg-slate-100 dark:bg-slate-900 text-xs text-slate-400 px-3 py-1 rounded-md mx-auto w-1/2 text-center font-mono"
                    >
                        slate.app/dashboard
                    </div>
                </div>

                <div class="flex flex-col md:flex-row gap-6">
                    <!-- Sidebar -->
                    <div
                        class="hidden md:flex flex-col w-56 border-r border-slate-200 dark:border-slate-700 pr-4 space-y-6"
                    >
                        <div class="px-2">
                            <span
                                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                                >Main</span
                            >
                            <div class="mt-2 space-y-1">
                                <div
                                    class="flex items-center gap-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-primary rounded-lg font-medium text-sm"
                                >
                                    <span class="material-icons-round text-lg"
                                        >dashboard</span
                                    >
                                    Dashboard
                                </div>
                                <div
                                    class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium text-sm"
                                >
                                    <span class="material-icons-round text-lg"
                                        >analytics</span
                                    >
                                    Analytics
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
                                    <span class="material-icons-round text-lg"
                                        >receipt_long</span
                                    >
                                    Invoices
                                </div>
                                <div
                                    class="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium text-sm"
                                >
                                    <span class="material-icons-round text-lg"
                                        >payments</span
                                    >
                                    Payments
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content -->
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
                                class="bg-primary text-white text-sm px-4 py-2 rounded-lg font-medium shadow-md hover:bg-primary-hover flex items-center gap-2"
                            >
                                <span class="material-icons-round text-sm"
                                    >add</span
                                > New Invoice
                            </button>
                        </div>

                        <!-- Stats Cards -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                class="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-xl"
                            >
                                <div
                                    class="flex justify-between items-start mb-2"
                                >
                                    <span
                                        class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide"
                                        >Receivables</span
                                    >
                                    <span
                                        class="material-icons-round text-emerald-500 text-sm"
                                        >currency_rupee</span
                                    >
                                </div>
                                <div
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    ₹4,50,000
                                </div>
                                <div
                                    class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium"
                                >
                                    12 invoices outstanding
                                </div>
                            </div>
                            <div
                                class="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 p-5 rounded-xl"
                            >
                                <div
                                    class="flex justify-between items-start mb-2"
                                >
                                    <span
                                        class="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide"
                                        >Overdue</span
                                    >
                                    <span
                                        class="material-icons-round text-rose-500 text-sm"
                                        >warning</span
                                    >
                                </div>
                                <div
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    ₹45,000
                                </div>
                                <div
                                    class="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium"
                                >
                                    2 invoices need follow-up
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
                                        >GST Due</span
                                    >
                                    <span
                                        class="material-icons-round text-blue-500 text-sm"
                                        >account_balance</span
                                    >
                                </div>
                                <div
                                    class="text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    ₹72,000
                                </div>
                                <div
                                    class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium"
                                >
                                    Due by 20th Feb
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Built With Section -->
<section
    class="py-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"
>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10">
            <h2
                class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
            >
                Built with
            </h2>
        </div>
        <div class="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <!-- SvelteKit -->
            <div
                class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default"
            >
                <div
                    class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-3"
                >
                    <img
                        src="/brand_logos/svelte.png"
                        alt="SvelteKit"
                        class="h-full w-full object-contain"
                    />
                </div>
                <span
                    class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors"
                    >SvelteKit</span
                >
            </div>

            <!-- TailwindCSS -->
            <div
                class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default"
            >
                <div
                    class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-3"
                >
                    <img
                        src="/brand_logos/tailwind.svg"
                        alt="Tailwind CSS"
                        class="h-full w-full object-contain"
                    />
                </div>
                <span
                    class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-cyan-500 transition-colors"
                    >Tailwind CSS</span
                >
            </div>

            <!-- SQLite -->
            <div
                class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default"
            >
                <div
                    class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-3"
                >
                    <img
                        src="/brand_logos/sqlite.svg"
                        alt="SQLite"
                        class="h-full w-full object-contain"
                    />
                </div>
                <span
                    class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-sky-700 transition-colors"
                    >SQLite</span
                >
            </div>

            <!-- Drizzle -->
            <div
                class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default"
            >
                <div
                    class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-3"
                >
                    <img
                        src="/brand_logos/drizzle.svg"
                        alt="Drizzle ORM"
                        class="h-full w-full object-contain"
                    />
                </div>
                <span
                    class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-lime-500 transition-colors"
                    >Drizzle ORM</span
                >
            </div>

            <!-- Antigravity -->
            <div
                class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default"
            >
                <div
                    class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-3"
                >
                    <img
                        src="/brand_logos/antigravity.png"
                        alt="Antigravity"
                        class="h-full w-full object-contain"
                    />
                </div>
                <span
                    class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-purple-500 transition-colors"
                    >Antigravity</span
                >
            </div>

            <!-- Claude -->
            <div
                class="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default"
            >
                <div
                    class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-3"
                >
                    <img
                        src="/brand_logos/claude.svg"
                        alt="Claude"
                        class="h-full w-full object-contain"
                    />
                </div>
                <span
                    class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-orange-600 transition-colors"
                    >Claude</span
                >
            </div>
        </div>
    </div>
</section>

<!-- Features Bento Grid -->
<section class="py-24 bg-white dark:bg-slate-800" id="features">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
            <h2
                class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6"
            >
                Everything you need to <br />
                <span class="text-gradient">scale your business</span>
            </h2>
            <p class="text-slate-500 dark:text-slate-400 text-lg">
                Powerful features wrapped in a simple, intuitive interface.
                Built for Indian SMBs with GST compliance baked in.
            </p>
        </div>

        <!-- Bento Grid -->
        <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]"
        >
            <!-- Real-time Analytics - Large Card -->
            <div
                class="col-span-1 sm:col-span-2 row-span-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:border-primary/50 transition-colors relative overflow-hidden group"
            >
                <div class="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div
                            class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary"
                        >
                            <span class="material-icons-round">insights</span>
                        </div>
                        <h3
                            class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                        >
                            GST-Ready Invoices
                        </h3>
                        <p class="text-slate-500 dark:text-slate-400 max-w-sm">
                            Create tax-compliant invoices with automatic CGST,
                            SGST, IGST calculations. Generate e-invoices and
                            e-way bills seamlessly.
                        </p>
                    </div>
                    <div class="mt-8 flex gap-2 items-end h-32 w-full">
                        <div
                            class="w-1/5 bg-primary/20 h-[40%] rounded-t-lg transition-all duration-500 group-hover:h-[50%]"
                        ></div>
                        <div
                            class="w-1/5 bg-primary/40 h-[60%] rounded-t-lg transition-all duration-500 group-hover:h-[70%]"
                        ></div>
                        <div
                            class="w-1/5 bg-primary/30 h-[50%] rounded-t-lg transition-all duration-500 group-hover:h-[60%]"
                        ></div>
                        <div
                            class="w-1/5 bg-primary h-[85%] rounded-t-lg shadow-lg shadow-primary/20 transition-all duration-500 group-hover:h-[95%]"
                        ></div>
                        <div
                            class="w-1/5 bg-primary/30 h-[55%] rounded-t-lg transition-all duration-500 group-hover:h-[65%]"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- Fast Invoicing - Tall Card -->
            <div
                class="col-span-1 row-span-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-indigo-400 transition-colors group"
            >
                <div class="h-full flex flex-col">
                    <div
                        class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400"
                    >
                        <span class="material-icons-round">bolt</span>
                    </div>
                    <h3
                        class="text-lg font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Fast Invoicing
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        Create professional invoices in seconds. Send via email
                        or WhatsApp.
                    </p>
                    <div
                        class="mt-auto bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700"
                    >
                        <div class="flex items-center justify-between mb-2">
                            <div
                                class="h-2 w-16 bg-slate-200 dark:bg-slate-600 rounded"
                            ></div>
                            <div
                                class="h-2 w-8 bg-indigo-200 dark:bg-indigo-800 rounded"
                            ></div>
                        </div>
                        <div class="space-y-1">
                            <div
                                class="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded"
                            ></div>
                            <div
                                class="h-1.5 w-3/4 bg-slate-100 dark:bg-slate-700/50 rounded"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Expenses -->
            <div
                class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-emerald-400 transition-colors group"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <h3
                            class="font-bold text-slate-900 dark:text-white mb-1"
                        >
                            Expenses
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Track & categorize.
                        </p>
                    </div>
                    <div
                        class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400"
                    >
                        <span class="material-icons-round text-lg">receipt</span
                        >
                    </div>
                </div>
            </div>

            <!-- Payments -->
            <div
                class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-amber-400 transition-colors group"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <h3
                            class="font-bold text-slate-900 dark:text-white mb-1"
                        >
                            Payments
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            Track receivables.
                        </p>
                    </div>
                    <div
                        class="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400"
                    >
                        <span class="material-icons-round text-lg"
                            >payments</span
                        >
                    </div>
                </div>
            </div>

            <!-- Tax Reports - Wide Card -->
            <div
                class="col-span-1 sm:col-span-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex items-center justify-between hover:border-rose-400 transition-colors group overflow-hidden relative"
            >
                <div class="relative z-10">
                    <div
                        class="w-10 h-10 bg-rose-100 dark:bg-rose-900/20 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3"
                    >
                        <span class="material-icons-round text-lg"
                            >summarize</span
                        >
                    </div>
                    <h3
                        class="text-lg font-bold text-slate-900 dark:text-white mb-1"
                    >
                        GST Reports
                    </h3>
                    <p
                        class="text-sm text-slate-500 dark:text-slate-400 max-w-xs"
                    >
                        Auto-generated GSTR-1, GSTR-3B reports for easy filing.
                    </p>
                </div>
                <div
                    class="absolute right-[-20px] top-6 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 transform rotate-3 group-hover:rotate-0 transition-transform duration-300"
                >
                    <div class="flex gap-2 items-center mb-2">
                        <div
                            class="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-[10px] font-bold"
                        >
                            %
                        </div>
                        <div
                            class="text-xs font-bold text-slate-700 dark:text-slate-300"
                        >
                            Tax Summary
                        </div>
                    </div>
                    <div class="space-y-1 w-32">
                        <div
                            class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded w-full"
                        ></div>
                        <div
                            class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded w-2/3"
                        ></div>
                        <div
                            class="h-1.5 bg-slate-100 dark:bg-slate-700 rounded w-4/5"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- SQLite Backup -->
            <div
                class="col-span-1 row-span-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-blue-400 transition-colors group"
            >
                <div
                    class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3"
                >
                    <span class="material-icons-round text-lg">backup</span>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-1">
                    SQLite Backup
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    Your data, always yours.
                </p>
            </div>

            <!-- Customers -->
            <div
                class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-purple-400 transition-colors group"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0"
                    >
                        <span class="material-icons-round text-lg">people</span>
                    </div>
                    <div>
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            Customers
                        </h3>
                        <p
                            class="text-[10px] text-slate-500 dark:text-slate-400"
                        >
                            GSTIN & history.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Vendors -->
            <div
                class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-slate-400 transition-colors group"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
                    >
                        <span class="material-icons-round text-lg">store</span>
                    </div>
                    <div>
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            Vendors
                        </h3>
                        <p
                            class="text-[10px] text-slate-500 dark:text-slate-400"
                        >
                            Manage suppliers.
                        </p>
                    </div>
                </div>
            </div>

            <!-- PDF Export -->
            <div
                class="col-span-1 sm:col-span-2 lg:col-span-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-orange-400 transition-colors group flex flex-col justify-between"
            >
                <div>
                    <div
                        class="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3"
                    >
                        <span class="material-icons-round text-lg"
                            >picture_as_pdf</span
                        >
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white mb-1">
                        PDF Export
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        Professional invoices.
                    </p>
                </div>
            </div>

            <!-- WhatsApp Share -->
            <div
                class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-cyan-400 transition-colors group"
            >
                <div class="flex flex-col h-full justify-between">
                    <div
                        class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-2"
                    >
                        <span class="material-icons-round text-lg">share</span>
                    </div>
                    <div>
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            WhatsApp
                        </h3>
                        <p
                            class="text-[10px] text-slate-500 dark:text-slate-400"
                        >
                            Share instantly.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Credit Notes -->
            <div
                class="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-pink-400 transition-colors group"
            >
                <div class="flex flex-col h-full justify-between">
                    <div
                        class="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center text-pink-600 dark:text-pink-400 mb-2"
                    >
                        <span class="material-icons-round text-lg"
                            >assignment_return</span
                        >
                    </div>
                    <div>
                        <h3
                            class="font-bold text-slate-900 dark:text-white text-sm"
                        >
                            Credit Notes
                        </h3>
                        <p
                            class="text-[10px] text-slate-500 dark:text-slate-400"
                        >
                            Handle refunds.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Built for Trust Section -->
<section
    class="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"
    id="tech-stack"
>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Built for Trust
            </h2>
            <p class="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Enterprise-grade accounting principles for your small business
            </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="text-center p-6">
                <div
                    class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"
                >
                    <span class="material-icons-round text-3xl">lock</span>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-2">
                    Immutable Ledger
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Once recorded, entries cannot be deleted—only corrected with
                    adjusting entries. Full audit trail.
                </p>
            </div>
            <div class="text-center p-6">
                <div
                    class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"
                >
                    <span class="material-icons-round text-3xl">verified</span>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-2">
                    Idempotent Writes
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Duplicate submissions are safely ignored. No double entries,
                    ever.
                </p>
            </div>
            <div class="text-center p-6">
                <div
                    class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"
                >
                    <span class="material-icons-round text-3xl">123</span>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white mb-2">
                    Sequential Numbers
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Gap-free invoice numbering with fiscal year prefixes. GSTN
                    compliant.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Open Source Section -->
<section class="py-20 bg-white dark:bg-slate-800" id="open-source">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
            class="bg-slate-900 dark:bg-primary/10 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
        >
            <div
                class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
            >
                <div
                    class="absolute -top-24 -left-24 w-64 h-64 bg-primary rounded-full blur-3xl"
                ></div>
                <div
                    class="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl"
                ></div>
            </div>
            <div class="relative z-10">
                <div
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-6"
                >
                    <span class="material-icons-round text-lg">code</span>
                    100% Open Source
                </div>
                <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
                    Your data. Your control.
                </h2>
                <p
                    class="text-slate-300 dark:text-slate-200 mb-8 max-w-xl mx-auto text-lg"
                >
                    Self-host Slate on your own infrastructure. No vendor
                    lock-in. MIT licensed.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/register"
                        class="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
                    >
                        Get Started Free
                    </a>
                    <a
                        href="https://github.com"
                        target="_blank"
                        class="bg-transparent border border-slate-600 dark:border-primary/50 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 justify-center"
                    >
                        <svg
                            class="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                clip-rule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                fill-rule="evenodd"
                            /></svg
                        >
                        View on GitHub
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Footer -->
<footer
    class="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 pt-16 pb-8"
>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div class="col-span-2 md:col-span-1">
                <div class="flex items-center gap-2 mb-4">
                    <img src="/logo.svg" alt="Slate" class="w-6 h-6" />
                    <span
                        class="font-bold text-xl text-slate-900 dark:text-white"
                        >Slate</span
                    >
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Open source invoicing for Indian SMBs. GST-ready.
                    Self-hosted.
                </p>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">
                    Product
                </h4>
                <ul
                    class="space-y-2 text-sm text-slate-600 dark:text-slate-400"
                >
                    <li>
                        <a
                            class="hover:text-primary transition-colors"
                            href="#features">Features</a
                        >
                    </li>
                    <li>
                        <a
                            class="hover:text-primary transition-colors"
                            href="#tech-stack">Technology</a
                        >
                    </li>
                    <li>
                        <a
                            class="hover:text-primary transition-colors"
                            href="#open-source">Open Source</a
                        >
                    </li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">
                    Resources
                </h4>
                <ul
                    class="space-y-2 text-sm text-slate-600 dark:text-slate-400"
                >
                    <li>
                        <a class="hover:text-primary transition-colors" href="#"
                            >Documentation</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-primary transition-colors" href="#"
                            >API Reference</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-primary transition-colors" href="#"
                            >GitHub</a
                        >
                    </li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-slate-900 dark:text-white mb-4">
                    Legal
                </h4>
                <ul
                    class="space-y-2 text-sm text-slate-600 dark:text-slate-400"
                >
                    <li>
                        <a class="hover:text-primary transition-colors" href="#"
                            >MIT License</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-primary transition-colors" href="#"
                            >Privacy</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-primary transition-colors" href="#"
                            >Terms</a
                        >
                    </li>
                </ul>
            </div>
        </div>
        <div
            class="border-t border-slate-200 dark:border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
            <p class="text-sm text-slate-500 dark:text-slate-400">
                © 2024 Slate. Open source under MIT license.
            </p>
            <div class="flex gap-4">
                <a
                    class="text-slate-400 hover:text-primary transition-colors"
                    href="#"
                >
                    <span class="sr-only">GitHub</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"
                        ><path
                            clip-rule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                            fill-rule="evenodd"
                        /></svg
                    >
                </a>
            </div>
        </div>
    </div>
</footer>

<style>
    .text-gradient {
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-image: linear-gradient(135deg, #ea580c, #f97316);
    }

    .bg-grid {
        background-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
        background-size: 40px 40px;
    }

    :global(.dark) .bg-grid {
        background-image: linear-gradient(
                to right,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            ),
            linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
            );
    }

    .shadow-glow {
        box-shadow: 0 0 20px -5px rgba(234, 88, 12, 0.3);
    }
</style>
