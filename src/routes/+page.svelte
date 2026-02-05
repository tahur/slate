<script>
    import { onMount } from "svelte";
    // Import global styles or specific styles if needed
    // But we are using utility classes
</script>

<div
    class="bg-bg-light dark:bg-bg-dark text-txt-light dark:text-txt-dark font-sans antialiased transition-colors duration-300 min-h-screen"
>
    <nav
        class="fixed w-full z-50 bg-surf-light/80 dark:bg-surf-dark/80 backdrop-blur-md border-b border-bord-light dark:border-bord-dark"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center gap-2">
                    <div class="bg-brand/10 p-2 rounded-lg">
                        <span class="material-icons-round text-brand"
                            >pie_chart</span
                        >
                    </div>
                    <span
                        class="font-bold text-xl tracking-tight text-slate-900 dark:text-white"
                        >Poly</span
                    >
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors"
                        href="#features">Features</a
                    >
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors"
                        href="https://github.com/openbill/openbill">GitHub</a
                    >
                    <a
                        class="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-brand transition-colors"
                        href="#testimonials">Customers</a
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
                        Register
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <section class="pt-32 pb-20 overflow-hidden relative">
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
                v2.0 is now live
            </div>
            <h1
                class="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6"
            >
                The Open Source <br />
                <span class="text-gradient">Financial Stack</span>.
            </h1>
            <p
                class="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10"
            >
                Free, self-hosted, and privacy-first. Poly gives you full
                control over your business finances without the monthly fees.
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
                    class="bg-white dark:bg-surf-dark border border-bord-light dark:border-bord-dark text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    href="https://github.com/openbill/openbill"
                >
                    <span class="material-icons-round text-slate-400">code</span
                    >
                    Generic GitHub
                </a>
            </div>
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
                            poly.app/dashboard
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
                            <!-- Dashboard Content Mockup -->
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
                                        ₹118.00
                                    </div>
                                    <div
                                        class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium"
                                    >
                                        5 invoices outstanding
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
                                        ₹0.00
                                    </div>
                                    <div
                                        class="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium"
                                    >
                                        No action needed
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
                                            >DSO</span
                                        >
                                        <span
                                            class="material-icons-round text-blue-500 text-sm"
                                            >schedule</span
                                        >
                                    </div>
                                    <div
                                        class="text-3xl font-bold text-slate-900 dark:text-white"
                                    >
                                        0.0 days
                                    </div>
                                    <div
                                        class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium"
                                    >
                                        Based on last 30 days
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-surf-light dark:bg-surf-dark" id="features">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <h2
                    class="text-3xl font-bold text-slate-900 dark:text-white mb-4"
                >
                    Enterprise power, Open Source freedom
                </h2>
                <p class="text-slate-500 dark:text-slate-400">
                    100% free and open source. Hosted by you, controlled by you.
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Feature 1 -->
                <div
                    class="md:col-span-2 bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-brand/50 transition-colors relative overflow-hidden group"
                >
                    <div class="relative z-10">
                        <div
                            class="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center mb-4 text-brand"
                        >
                            <span class="material-icons-round">insights</span>
                        </div>
                        <h3
                            class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                        >
                            Real-time Analytics
                        </h3>
                        <p
                            class="text-slate-500 dark:text-slate-400 mb-6 max-w-md"
                        >
                            Track your income, expenses, and profit margins
                            instantly. Visual charts help you understand your
                            financial health at a glance.
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
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-blue-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400"
                    >
                        <span class="material-icons-round">bolt</span>
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Fast Invoicing
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Create professional invoices in seconds. Send them via
                        email or WhatsApp directly.
                    </p>
                </div>

                <!-- Feature 3 -->
                <div
                    class="bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-emerald-400 transition-colors group"
                >
                    <div
                        class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400"
                    >
                        <span class="material-icons-round">receipt</span>
                    </div>
                    <h3
                        class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                        Expense Tracking
                    </h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm">
                        Upload receipts and categorize expenses to keep your
                        books tax-ready always.
                    </p>
                </div>

                <!-- Feature 4 -->
                <div
                    class="md:col-span-2 bg-bg-light dark:bg-slate-800/50 border border-bord-light dark:border-bord-dark rounded-2xl p-8 hover:border-rose-400 transition-colors relative overflow-hidden group"
                >
                    <div
                        class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                        <div class="max-w-xs">
                            <div
                                class="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400"
                            >
                                <span class="material-icons-round"
                                    >notifications_active</span
                                >
                            </div>
                            <h3
                                class="text-xl font-bold text-slate-900 dark:text-white mb-2"
                            >
                                Automated Reminders
                            </h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">
                                Set it and forget it. Poly chases overdue
                                payments for you with polite, automated email
                                reminders.
                            </p>
                        </div>
                        <div
                            class="bg-white dark:bg-surf-dark border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm w-full max-w-xs transform group-hover:-rotate-1 transition-transform"
                        >
                            <div class="flex items-center gap-3 mb-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500"
                                >
                                    <span class="material-icons-round text-sm"
                                        >mail</span
                                    >
                                </div>
                                <div>
                                    <div
                                        class="text-xs font-bold text-slate-800 dark:text-slate-200"
                                    >
                                        Payment Reminder
                                    </div>
                                    <div class="text-[10px] text-slate-400">
                                        Sent 2 hours ago
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
            </div>
        </div>
    </section>

    <section
        class="py-24 bg-white dark:bg-bg-dark border-t border-bord-light dark:border-bord-dark"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-12">
                Built for Developers
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <!-- Stack Item 1 -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform"
                    >
                        <span class="material-icons-round text-3xl">code</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white">
                        SvelteKit
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Full-stack Framework
                    </p>
                </div>

                <!-- Stack Item 2 -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"
                    >
                        <span class="material-icons-round text-3xl"
                            >storage</span
                        >
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white">
                        SQLite
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Embedded Database
                    </p>
                </div>

                <!-- Stack Item 3 -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"
                    >
                        <span class="material-icons-round text-3xl">dns</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white">
                        Drizzle ORM
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Type-safe SQL
                    </p>
                </div>

                <!-- Stack Item 4 -->
                <div class="flex flex-col items-center gap-3 group">
                    <div
                        class="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"
                    >
                        <span class="material-icons-round text-3xl">style</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white">
                        Tailwind CSS
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Utility-first Styling
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer
        class="bg-surf-light dark:bg-surf-dark border-t border-bord-light dark:border-bord-dark pt-16 pb-8"
    >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div class="col-span-2 md:col-span-1">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="material-icons-round text-brand"
                            >pie_chart</span
                        >
                        <span
                            class="font-bold text-xl text-slate-900 dark:text-white"
                            >Poly</span
                        >
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        Making accounting simple, beautiful, and effortless for
                        modern businesses.
                    </p>
                </div>
                <!-- Links omitted for brevity, keeping structure -->
                <div>
                    <h4 class="font-bold text-slate-900 dark:text-white mb-4">
                        Product
                    </h4>
                    <ul
                        class="space-y-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                        <li>
                            <a
                                class="hover:text-brand transition-colors"
                                href="#features">Features</a
                            >
                        </li>
                        <li>
                            <a
                                class="hover:text-brand transition-colors"
                                href="https://github.com/openbill/openbill"
                                >GitHub</a
                            >
                        </li>
                    </ul>
                </div>
                <!-- More columns -->
            </div>
            <div
                class="border-t border-bord-light dark:border-bord-dark pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
            >
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Released under the MIT License. Open Source & Free.
                </p>
            </div>
        </div>
    </footer>
</div>
