<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import {
		Plus,
		Clock,
		Receipt,
		ArrowRight,
		Activity,
		IndianRupee,
		FileText,
		AlertCircle,
	} from "lucide-svelte";
	import type { PageData } from "./$types";
	import { formatINR } from "$lib/utils/currency";

	let { data }: { data: PageData } = $props();

	function getDaysOverdueColor(days: number) {
		if (days > 30) return "border border-red-200 bg-red-50 text-red-700";
		if (days > 7)
			return "border border-amber-200 bg-amber-50 text-amber-700";
		return "border border-yellow-200 bg-yellow-50 text-yellow-700";
	}

	const overdueCount = $derived(data.dueInvoices.length);
	const overdueTotal = $derived(
		data.dueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
	);
	const displayedInvoices = $derived(data.dueInvoices.slice(0, 5));
</script>

<div class="page-full-bleed">
	<header class="page-header items-center">
		<h1 class="text-lg font-semibold tracking-tight text-[#111] md:text-xl">
			Dashboard
		</h1>
		<Button href="/invoices/new" size="sm" class="gap-2">
			<Plus class="size-4" />
			<span class="hidden sm:inline">New Invoice</span>
			<span class="sm:hidden">New</span>
		</Button>
	</header>
	<main class="page-body">
		<div class="content-width-standard flex flex-col gap-5">
			<!-- Row 1: Three stat cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<!-- Sales This Month -->
				<Card>
					<CardContent class="pt-3 px-4 pb-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
									Sales This Month
								</p>
								<p class="mt-2 truncate text-2xl font-bold tracking-tight text-[#111]">
									{formatINR(data.monthly.sales)}
								</p>
							</div>
							<span class="rounded-md bg-blue-50 p-2 text-blue-600">
								<IndianRupee class="size-4" />
							</span>
						</div>
					</CardContent>
				</Card>

				<!-- To Collect -->
				<Card>
					<CardContent class="pt-3 px-4 pb-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
									To Collect
								</p>
								<p class="mt-2 truncate text-2xl font-bold tracking-tight text-[#111]">
									{formatINR(data.money.toCollect)}
								</p>
							</div>
							<span class="rounded-md bg-blue-50 p-2 text-blue-600">
								<FileText class="size-4" />
							</span>
						</div>
					</CardContent>
				</Card>

				<!-- Overdue -->
				<Card class={overdueCount > 0 ? "border-red-200 bg-red-50/30" : ""}>
					<CardContent class="pt-3 px-4 pb-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs font-semibold uppercase tracking-wider {overdueCount > 0 ? 'text-red-500' : 'text-slate-400'}">
									Overdue
								</p>
								{#if overdueCount > 0}
									<p class="mt-2 truncate text-2xl font-bold tracking-tight text-red-700">
										{formatINR(overdueTotal)}
									</p>
									<p class="mt-1 text-xs text-red-600/70">
										{overdueCount} invoice{overdueCount > 1 ? "s" : ""}
									</p>
								{:else}
									<p class="mt-2 text-2xl font-bold tracking-tight text-[#111]">
										None
									</p>
									<p class="mt-1 text-xs text-slate-400">All caught up</p>
								{/if}
							</div>
							<span class="rounded-md {overdueCount > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'} p-2">
								<AlertCircle class="size-4" />
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Row 2: Due Invoices + GST Position side-by-side -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
				<!-- Due Invoices (takes 3/5) -->
				<Card class="lg:col-span-3">
					<CardHeader class="border-b border-slate-200 py-4">
						<div class="flex items-center justify-between">
							<CardTitle
								class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2"
							>
								<Clock class="size-4" />
								Due Invoices
							</CardTitle>
							<a
								href="/invoices?status=unpaid"
								class="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
							>
								View All <ArrowRight class="size-3" />
							</a>
						</div>
					</CardHeader>
					<CardContent class="p-0">
						{#if data.dueInvoices.length === 0}
							<div
								class="flex h-[220px] flex-col items-center justify-center text-center p-6"
							>
								<div class="p-3 bg-slate-100 rounded-full mb-3">
									<Receipt class="size-6 text-blue-300" />
								</div>
								<p class="text-sm font-medium text-[#111]">
									All caught up!
								</p>
								<p class="text-xs text-slate-400">
									No invoices due for payment.
								</p>
							</div>
						{:else}
							<div class="divide-y divide-slate-100">
								{#each displayedInvoices as invoice}
									<a
										href="/invoices/{invoice.id}"
										class="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-blue-50/50"
									>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span class="font-medium text-sm text-[#111] truncate">
													{invoice.customerName}
												</span>
												{#if invoice.daysOverdue > 0}
													<span
														class={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getDaysOverdueColor(invoice.daysOverdue)}`}
													>
														{invoice.daysOverdue}d late
													</span>
												{/if}
											</div>
											<p class="text-xs text-slate-400 mt-0.5">
												Due {new Date(
													invoice.dueDate,
												).toLocaleDateString("en-IN", {
													day: "numeric",
													month: "short",
												})} · #{invoice.invoiceNumber}
											</p>
										</div>
										<span class="font-mono text-sm font-semibold text-[#111] shrink-0">
											{formatINR(invoice.amount)}
										</span>
									</a>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- GST Position (takes 2/5) -->
				<Card class="lg:col-span-2">
					<CardHeader class="border-b border-slate-200 py-4">
						<CardTitle
							class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
						>
							<Receipt class="size-4" />
							GST Position
						</CardTitle>
					</CardHeader>
					<CardContent class="p-5">
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<p class="text-sm text-slate-500">Output GST</p>
								<p class="font-mono text-sm font-semibold text-[#111]">
									{formatINR(data.money.gstOutput)}
								</p>
							</div>
							<div class="flex items-center justify-between">
								<p class="text-sm text-slate-500">Input GST (ITC)</p>
								<p class="font-mono text-sm font-semibold text-[#111]">
									{formatINR(data.money.gstInput)}
								</p>
							</div>
							<hr class="border-slate-100" />
							<div class="flex items-center justify-between">
								<p class="text-sm font-medium {data.money.gstDue > 0 ? 'text-amber-700' : 'text-green-700'}">
									{data.money.gstDue > 0 ? "Net Payable" : "ITC Carry Forward"}
								</p>
								<p class="font-mono text-lg font-bold {data.money.gstDue > 0 ? 'text-amber-700' : 'text-green-700'}">
									{formatINR(Math.abs(data.money.gstDue))}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- Row 3: Recent Activity (full-width) -->
			<Card>
				<CardHeader class="border-b border-slate-200 py-4">
					<div class="flex items-center justify-between">
						<CardTitle
							class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2"
						>
							<Activity class="size-4" />
							Recent Activity
						</CardTitle>
						<a
							href="/activity-log"
							class="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
						>
							View All <ArrowRight class="size-3" />
						</a>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					{#if data.recentActivity.length === 0}
						<div
							class="flex h-[140px] flex-col items-center justify-center text-center p-6"
						>
							<div class="p-3 bg-slate-100 rounded-full mb-3">
								<Activity class="size-6 text-blue-300" />
							</div>
							<p class="text-sm font-medium text-[#111]">
								No activity yet
							</p>
							<p class="text-xs text-slate-400">
								Actions will appear here as you work.
							</p>
						</div>
					{:else}
						<div class="divide-y divide-slate-100">
							{#each data.recentActivity as item}
								<div
									class="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-blue-50/50"
								>
									<div class="min-w-0 flex-1">
										<p class="text-sm text-[#111] truncate">
											{item.description}
										</p>
										<p class="mt-0.5 text-xs text-slate-400">
											{new Date(
												item.createdAt,
											).toLocaleDateString("en-IN", {
												day: "numeric",
												month: "short",
												hour: "numeric",
												minute: "2-digit",
											})}
										</p>
									</div>
									{#if item.amount}
										<span class="font-mono text-sm font-semibold text-[#111]">
											{formatINR(item.amount)}
										</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</main>
</div>
