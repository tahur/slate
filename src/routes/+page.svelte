<script lang="ts">
	import {
		FileText,
		Wallet,
		Receipt,
		Check,
		Github,
		Database,
		Shield,
		Globe,
		Zap,
		Layers,
		BarChart3,
		Plug,
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

			<div class="relative mx-auto max-w-5xl">
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

				<div class="mt-10 grid gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
					<article class="bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<FileText class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">GST Invoicing</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Add line items, pick the GST rate, and send. CGST/SGST or IGST calculated automatically based on your customer's state.
						</p>
					</article>

					<article class="bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Wallet class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Payment Tracking</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Record payments against invoices. Track outstanding balances, partial payments, and aging — updated in real time.
						</p>
					</article>

					<article class="bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Receipt class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Expense Tracking</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Log expenses by category, supplier, and payment method. Input tax is tracked automatically for filing time.
						</p>
					</article>

					<article class="bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<BarChart3 class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Reports</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Cashbook, receivables, and tax summaries. The reports you need without the ones you don't.
						</p>
					</article>

					<article class="bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Globe class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Made for India</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							HSN/SAC codes, multi-rate GST (0–28%), inter/intra-state tax handling, and INR formatting built in.
						</p>
					</article>

					<article class="bg-white p-6">
						<div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
							<Shield class="size-4" />
						</div>
						<h3 class="mt-3 text-[15px] font-semibold text-[#111]">Reliable</h3>
						<p class="mt-1.5 text-sm text-slate-500 leading-relaxed">
							Every action saves completely or not at all. Double-entry bookkeeping ensures your numbers always balance.
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
</style>
