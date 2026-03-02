<script lang="ts">
	import {
		FileText,
		Wallet,
		Receipt,
		Check,
		Github,
		Database,
		Globe,
		Zap,
		Layers,
		BarChart3,
		Plug,
		BookOpen,
		Fingerprint,
		ScrollText,
		Calculator,
		KeyRound,
	} from "lucide-svelte";
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>Slate — Simple Invoicing & Accounting for Indian Small Businesses</title>
	<meta
		name="description"
		content="Create GST invoices, track payments, and manage expenses. Open-source invoicing and accounting for Indian small businesses."
	/>
</svelte:head>

<div class="landing">
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
		<div class="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
			<a href="/" class="flex items-center gap-2.5">
				<img src="/logo.svg" alt="Slate" class="h-7 w-7 rounded-md" />
				<span class="text-[1.1rem] font-semibold tracking-tight text-[#111]">Slate</span>
			</a>

			<nav class="hidden items-center gap-6 md:flex">
				<a href="#features" class="text-sm text-slate-500 font-medium hover:text-[#111] transition-colors">Features</a>
				<a href="#stack" class="text-sm text-slate-500 font-medium hover:text-[#111] transition-colors">Stack</a>
				<a href="#open-source" class="text-sm text-slate-500 font-medium hover:text-[#111] transition-colors">Open Source</a>
			</nav>

			<div class="flex items-center gap-3">
				<a href="https://github.com/tahur/slate" target="_blank" rel="noopener" class="text-slate-400 hover:text-[#111] transition-colors hidden sm:inline-flex" title="GitHub">
					<Github class="size-5" />
				</a>
				<a href="/login" class="text-sm font-medium text-slate-600 hover:text-[#111] transition-colors hidden sm:inline-flex">Login</a>
				<a href="/register" class="inline-flex items-center rounded-md bg-[#111] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#272A2C]">Start free</a>
			</div>
		</div>
	</header>

	<main>
		<!-- Hero -->
		<section class="relative overflow-hidden px-5 pt-16 pb-20 lg:pt-24 lg:pb-28">
			<div class="hero-glow"></div>

			<div class="relative mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
				<div class="max-w-2xl">
					<p class="inline-flex rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-600">
						Free & open source
					</p>
					<h1 class="mt-5 text-4xl font-bold tracking-tight text-[#111] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
						Open-source invoicing for Indian small businesses.
					</h1>
					<p class="mt-5 max-w-lg text-base text-slate-500 leading-relaxed sm:text-lg">
						Create GST invoices, track payments, and manage expenses. Slate handles the bookkeeping and compliance automatically.
					</p>

					<div class="mt-8 flex flex-wrap gap-3">
						<a href="/register" class="inline-flex items-center rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#272A2C]">
							Get started free
						</a>
						<a href="/login" class="inline-flex items-center rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#111] shadow-sm transition-colors hover:bg-slate-50">
							Login
						</a>
					</div>

					<ul class="mt-8 flex flex-col gap-2 text-sm text-slate-500">
						<li class="flex items-center gap-2"><Check class="size-4 shrink-0 text-blue-500" /> GST invoices with CGST, SGST, IGST</li>
						<li class="flex items-center gap-2"><Check class="size-4 shrink-0 text-blue-500" /> Track who owes you and what you owe</li>
						<li class="flex items-center gap-2"><Check class="size-4 shrink-0 text-blue-500" /> Free and open source — your data, your server</li>
					</ul>
				</div>

				<!-- Workflow illustration -->
				<div class="hidden lg:flex items-center justify-center" aria-hidden="true">
					<div class="hero-flow-shell">
						<div class="hero-flow">
							<span class="hero-flow__connector hero-flow__connector--one"></span>
							<span class="hero-flow__connector hero-flow__connector--two"></span>

							<div
								class="hero-flow__card hero-flow__card--invoice min-h-[154px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
							>
								<p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
									Create Invoice
								</p>
								<div class="mt-2.5 space-y-2">
									<div>
										<p class="text-[9px] text-slate-400">Customer</p>
										<div
											class="mt-0.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-700"
										>
											Acme Corp
										</div>
									</div>
									<div class="grid grid-cols-2 gap-1.5">
										<div>
											<p class="text-[9px] text-slate-400">Amount</p>
											<div
												class="mt-0.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-700"
											>
												10,000
											</div>
										</div>
										<div>
											<p class="text-[9px] text-slate-400">GST</p>
											<div
												class="mt-0.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-700"
											>
												18%
											</div>
										</div>
									</div>
									<div
										class="rounded-md bg-[#111] px-2.5 py-1.5 text-center text-[10px] font-semibold text-white"
									>
										Save Invoice
									</div>
								</div>
							</div>

							<div
								class="hero-flow__card hero-flow__card--journal min-h-[154px] rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-lg"
							>
								<p class="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
									Journal Entry
								</p>
								<div class="mt-2.5 space-y-1.5">
									<div class="flex items-center gap-1.5 text-[10px] text-blue-700">
										<span
											class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold"
											>Dr</span
										>
										<span>Accounts Receivable</span>
										<span class="ml-auto font-medium">11,800</span>
									</div>
									<div class="flex items-center gap-1.5 text-[10px] text-blue-700">
										<span
											class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold"
											>Cr</span
										>
										<span>Sales Revenue</span>
										<span class="ml-auto font-medium">10,000</span>
									</div>
									<div class="flex items-center gap-1.5 text-[10px] text-blue-700">
										<span
											class="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold"
											>Cr</span
										>
										<span>CGST + SGST</span>
										<span class="ml-auto font-medium">1,800</span>
									</div>
								</div>
							</div>

							<div
								class="hero-flow__card hero-flow__card--ledger min-h-[154px] rounded-xl border border-slate-700 bg-[#111] p-4 shadow-xl"
							>
								<p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
									Ledger
								</p>
								<div class="mt-2.5 space-y-0">
									<div
										class="grid grid-cols-3 border-b border-slate-700 py-1.5 text-[9px] font-medium text-slate-500"
									>
										<span>Account</span><span class="text-right">Dr</span><span class="text-right">Cr</span>
									</div>
									<div class="grid grid-cols-3 border-b border-slate-800 py-1.5 text-[9px] text-slate-300">
										<span>Receivables</span><span class="text-right">11,800</span><span class="text-right">—</span>
									</div>
									<div class="grid grid-cols-3 border-b border-slate-800 py-1.5 text-[9px] text-slate-300">
										<span>Sales</span><span class="text-right">—</span><span class="text-right">10,000</span>
									</div>
									<div class="grid grid-cols-3 py-1.5 text-[9px] text-slate-300">
										<span>CGST Out</span><span class="text-right">—</span><span class="text-right">900</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Features -->
		<section class="px-5 pb-20" id="features">
			<div class="mx-auto max-w-5xl">
				<h2 class="text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">
					Everything to run your finances.
				</h2>
				<p class="mt-2 max-w-lg text-base text-slate-500">
					Simple for you, proper accounting underneath.
				</p>

				<div class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<!-- Row 1: GST hero + Payments -->
					<article class="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-7">
						<div class="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
							<FileText class="size-5" />
						</div>
						<h3 class="mt-4 text-lg font-semibold text-[#111]">GST Invoicing</h3>
						<p class="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
							Add line items with HSN/SAC codes, pick the GST rate, and send. CGST/SGST or IGST is calculated automatically based on your customer's state.
						</p>
						<div class="mt-4 flex flex-wrap gap-2">
							<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">CGST + SGST</span>
							<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">IGST</span>
							<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">Multi-rate (0–28%)</span>
							<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">PDF export</span>
						</div>
					</article>

					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Wallet class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Payment Tracking</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Record payments against invoices. Track outstanding balances, partial payments, and aging.
						</p>
					</article>

					<!-- Row 2: Expenses + Reports + Made for India -->
					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Receipt class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Expense Tracking</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Log expenses by category, supplier, and payment method. Input tax is tracked for GST filing.
						</p>
					</article>

					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<BarChart3 class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Reports</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Cashbook, ledger, receivables, and tax summaries. The reports you need without the ones you don't.
						</p>
					</article>

					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Globe class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Made for India</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							HSN/SAC codes, inter/intra-state tax, GSTIN validation, and INR formatting — all built in.
						</p>
					</article>

					<!-- Row 3: Double-entry dark hero + Auth -->
					<article class="sm:col-span-2 rounded-xl border border-slate-200 bg-[#111] p-7">
						<div class="flex size-10 items-center justify-center rounded-lg bg-white/10 text-white">
							<BookOpen class="size-5" />
						</div>
						<h3 class="mt-4 text-lg font-semibold text-white">Double-Entry Bookkeeping</h3>
						<p class="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
							Every transaction creates balanced journal entries — debits always equal credits. 7 invariants enforced on every write. Atomic transactions ensure nothing saves partially.
						</p>
						<div class="mt-4 flex flex-wrap gap-2">
							<span class="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300">Debits = Credits</span>
							<span class="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300">Immutable entries</span>
							<span class="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300">Atomic transactions</span>
						</div>
					</article>

					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<KeyRound class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Better Auth</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Secure session-based authentication. Email/password today, OAuth providers coming soon.
						</p>
					</article>

					<!-- Row 4: Idempotency + Decimal + Audit -->
					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Fingerprint class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Idempotency Keys</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Every write carries a unique key. Double-submits are caught — no duplicate invoices or payments, ever.
						</p>
					</article>

					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Calculator class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Decimal Precision</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							All money math uses decimal.js — no floating point errors. Server-side validation on every form.
						</p>
					</article>

					<article class="rounded-xl border border-slate-200 bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<ScrollText class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Full Audit Trail</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Every action is logged — who did what, when. Changed fields tracked for complete traceability.
						</p>
					</article>
				</div>
			</div>
		</section>

		<!-- Tech Stack -->
		<section class="px-5 pb-20" id="stack">
			<div class="mx-auto max-w-5xl">
				<h2 class="text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">
					Built on tools you trust.
				</h2>
				<p class="mt-2 max-w-lg text-base text-slate-500 leading-relaxed">
					Modern, open-source stack. Your data lives in your own Supabase PostgreSQL database — fully under your control.
				</p>

				<div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<div class="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
						<div class="flex size-9 items-center justify-center rounded-md bg-blue-100 text-blue-600 shrink-0">
							<Database class="size-4" />
						</div>
						<div>
							<p class="text-sm font-semibold text-[#111]">Supabase</p>
							<p class="text-xs text-slate-500">PostgreSQL storage</p>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
						<div class="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 shrink-0">
							<Zap class="size-4" />
						</div>
						<div>
							<p class="text-sm font-semibold text-[#111]">SvelteKit</p>
							<p class="text-xs text-slate-500">Full-stack framework</p>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
						<div class="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 shrink-0">
							<Layers class="size-4" />
						</div>
						<div>
							<p class="text-sm font-semibold text-[#111]">Drizzle ORM</p>
							<p class="text-xs text-slate-500">Type-safe queries</p>
						</div>
					</div>
					<div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
						<div class="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 shrink-0">
							<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
							</svg>
						</div>
						<div>
							<p class="text-sm font-semibold text-[#111]">TailwindCSS</p>
							<p class="text-xs text-slate-500">Utility-first CSS</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- MCP Server -->
		<section class="px-5 pb-20">
			<div class="mx-auto max-w-5xl rounded-xl border border-blue-100 bg-blue-50/40 p-8 sm:p-12 text-center">
				<p class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600">
					Coming soon
				</p>
				<h2 class="mt-4 text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">
					MCP Server
				</h2>
				<p class="mx-auto mt-3 max-w-lg text-base text-slate-500 leading-relaxed">
					Connect Slate to AI assistants via the Model Context Protocol. Create invoices, check balances, and pull reports — through natural language.
				</p>
				<div class="mt-6 flex items-center justify-center gap-4 text-sm text-slate-400">
					<span class="flex items-center gap-1.5"><Plug class="size-4" /> Claude, ChatGPT, Cursor & more</span>
				</div>
			</div>
		</section>

		<!-- Open Source -->
		<section class="px-5 pb-20" id="open-source">
			<div class="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-8 sm:p-12">
					<p class="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
						Open source
					</p>
					<h2 class="mt-4 text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">
						Your data belongs to you.
					</h2>
					<p class="mt-3 max-w-xl text-base text-slate-500 leading-relaxed">
						Slate is fully open source and self-hostable. Deploy to your own server, connect your own Supabase project, and own every byte of your financial data. No monthly subscriptions, no feature gates, no vendor lock-in.
					</p>
					<div class="mt-6 flex flex-wrap gap-3">
						<a href="/register" class="inline-flex items-center rounded-md bg-[#111] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#272A2C]">
							Get started free
						</a>
						<a href="https://github.com/tahur/slate" target="_blank" rel="noopener" class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#111] shadow-sm transition-colors hover:bg-slate-50">
							<Github class="size-4" />
							View on GitHub
						</a>
					</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-slate-200 bg-white">
		<div class="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
			<p>&copy; {currentYear} Slate</p>
			<div class="flex items-center gap-5">
				<a class="hover:text-[#111] transition-colors" href="#features">Features</a>
				<a class="hover:text-[#111] transition-colors" href="#stack">Stack</a>
				<a class="hover:text-[#111] transition-colors" href="#open-source">Open Source</a>
			</div>
		</div>
	</footer>
</div>

<style>
	.landing {
		background:
			radial-gradient(circle, #c8ccd0 1px, transparent 1px) 0 0 / 22px 22px,
			#ffffff;
		color: #111111;
		font-family: var(--font-sans);
	}

	.hero-glow {
		position: absolute;
		top: -30%;
		right: -10%;
		width: 600px;
		height: 600px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
		pointer-events: none;
	}

	.hero-flow-shell {
		position: relative;
		border: 1px solid rgb(148 163 184 / 0.3);
		border-radius: 1rem;
		padding: 0.9rem 1rem 1rem;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.82), rgb(248 250 252 / 0.72));
		box-shadow:
			0 10px 30px rgb(15 23 42 / 0.08),
			inset 0 1px 0 rgb(255 255 255 / 0.9);
	}

	.hero-flow-shell::before {
		content: "";
		position: absolute;
		inset: 12px 14px;
		border-radius: 0.85rem;
		border: 1px dashed rgb(148 163 184 / 0.35);
		pointer-events: none;
		z-index: 0;
	}

	.hero-flow-shell > * {
		position: relative;
		z-index: 1;
	}

	.hero-flow {
		position: relative;
		width: 468px;
		height: 332px;
	}

	.hero-flow::before {
		content: "";
		position: absolute;
		left: 42px;
		bottom: 22px;
		width: 386px;
		height: 68px;
		background: radial-gradient(
			ellipse at center,
			rgb(15 23 42 / 0.22) 0%,
			rgb(15 23 42 / 0.11) 44%,
			transparent 74%
		);
		filter: blur(8px);
		opacity: 0.62;
		pointer-events: none;
		z-index: 1;
	}

	.hero-flow::after {
		content: "";
		position: absolute;
		left: 16px;
		top: 236px;
		width: 434px;
		border-top: 1px solid rgb(148 163 184 / 0.48);
		border-radius: 999px;
		transform: rotate(-8deg);
		pointer-events: none;
		z-index: 5;
	}

	.hero-flow__card {
		position: absolute;
		width: 220px;
		transform: rotate(-8deg);
		transform-origin: center;
		box-shadow: 0 14px 28px rgb(15 23 42 / 0.14);
		outline: 1px solid rgb(148 163 184 / 0.15);
		outline-offset: -1px;
		transition:
			transform var(--motion-base) var(--ease-standard),
			box-shadow var(--motion-fast) var(--ease-standard);
	}

	.hero-flow__card--invoice {
		left: 0;
		top: 12px;
		z-index: 30;
	}

	.hero-flow__card--journal {
		left: 124px;
		top: 90px;
		z-index: 20;
	}

	.hero-flow__card--ledger {
		left: 248px;
		top: 168px;
		z-index: 10;
		box-shadow: 0 16px 32px rgb(2 6 23 / 0.35);
		outline-color: rgb(148 163 184 / 0.24);
	}

	.hero-flow__connector {
		position: absolute;
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, rgba(147, 197, 253, 0.55), rgba(96, 165, 250, 0.95));
		z-index: 15;
	}

	.hero-flow__connector::after {
		content: "";
		position: absolute;
		right: -2px;
		top: 50%;
		width: 7px;
		height: 7px;
		border-top: 2px solid rgba(96, 165, 250, 0.95);
		border-right: 2px solid rgba(96, 165, 250, 0.95);
		transform: translateY(-50%) rotate(45deg);
	}

	.hero-flow__connector--one {
		left: 192px;
		top: 88px;
		width: 84px;
		transform: rotate(34deg);
	}

	.hero-flow__connector--two {
		left: 316px;
		top: 166px;
		width: 84px;
		transform: rotate(34deg);
	}

	.hero-flow:hover .hero-flow__card--invoice {
		transform: translate3d(-3px, -2px, 0) rotate(-8deg);
	}

	.hero-flow:hover .hero-flow__card--journal {
		transform: translate3d(0, -3px, 0) rotate(-8deg);
	}

	.hero-flow:hover .hero-flow__card--ledger {
		transform: translate3d(3px, -4px, 0) rotate(-8deg);
	}
</style>
