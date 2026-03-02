<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		Plus,
		ArrowRight,
		AlertTriangle,
		CalendarClock,
		Wallet,
		Receipt,
		Activity,
		TrendingUp,
		TrendingDown,
	} from "lucide-svelte";
	import type { PageData } from "./$types";
	import { formatINR } from "$lib/utils/currency";

	let { data }: { data: PageData } = $props();

	const overdueCount = $derived(data.alerts.overdue.count);
	const overdueAmount = $derived(data.alerts.overdue.amount);
	const dueSoonCount = $derived(data.alerts.dueSoon.count);
	const dueSoonAmount = $derived(data.alerts.dueSoon.amount);
	const toCollect = $derived(data.money.toCollect);
	const availableFunds = $derived(data.money.cash + data.money.bank);
	const monthlyProfit = $derived(data.monthly.profit);
	const gstPayable = $derived(data.money.gstDue > 0);
	const duePreview = $derived(data.dueInvoices.slice(0, 6));
	const activityPreview = $derived(data.recentActivity.slice(0, 6));

	function dueBadgeClass(daysOverdue: number): string {
		if (daysOverdue >= 30) return "bg-red-50 text-red-700";
		if (daysOverdue > 0) return "bg-amber-50 text-amber-700";
		return "bg-surface-2 text-text-muted";
	}

	function dueBadgeLabel(daysOverdue: number): string {
		if (daysOverdue >= 30) return `${daysOverdue}d critical`;
		if (daysOverdue > 0) return `${daysOverdue}d overdue`;
		return "Due soon";
	}

	function shortDate(dateIso: string): string {
		return new Date(dateIso).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
		});
	}

	function activityDate(dateIso: string): string {
		return new Date(dateIso).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			hour: "numeric",
			minute: "2-digit",
		});
	}
</script>

<div class="page-full-bleed">
	<header class="page-header items-center">
		<div>
			<h1 class="text-xl font-bold tracking-tight text-text-strong">Dashboard</h1>
			<p class="text-sm text-text-muted">Overview of your business</p>
		</div>
		<Button href="/invoices/new" size="sm" class="gap-2">
			<Plus class="size-4" />
			<span class="hidden sm:inline">New Invoice</span>
			<span class="sm:hidden">New</span>
		</Button>
	</header>

	<div class="page-body">
		<div class="content-width-standard space-y-4">
			<!-- Row 1: Stat Cards -->
			<div class="grid gap-3 sm:grid-cols-3">
				<!-- To Collect -->
				<div class="rounded-xl border border-border bg-surface-0 p-4">
					<div class="flex items-center gap-2 text-text-muted mb-1">
						<AlertTriangle class="size-4" />
						<span class="text-xs font-medium uppercase tracking-wide">To Collect</span>
					</div>
					<p class="text-2xl font-bold font-mono text-text-strong">
						{formatINR(toCollect)}
					</p>
					<p class="mt-1 text-xs text-text-muted">
						{overdueCount} overdue · {dueSoonCount} due soon
					</p>
				</div>

				<!-- Cash & Bank -->
				<div class="rounded-xl border border-border bg-surface-0 p-4">
					<div class="flex items-center gap-2 text-text-muted mb-1">
						<Wallet class="size-4" />
						<span class="text-xs font-medium uppercase tracking-wide">Cash & Bank</span>
					</div>
					<p class="text-2xl font-bold font-mono text-text-strong">
						{formatINR(availableFunds)}
					</p>
					<p class="mt-1 text-xs text-text-muted">
						Cash {formatINR(data.money.cash)} · Bank {formatINR(data.money.bank)}
					</p>
				</div>

				<!-- This Month -->
				<div class="rounded-xl border border-border bg-surface-0 p-4">
					<div class="flex items-center gap-2 text-text-muted mb-1">
						{#if monthlyProfit >= 0}
							<TrendingUp class="size-4" />
						{:else}
							<TrendingDown class="size-4" />
						{/if}
						<span class="text-xs font-medium uppercase tracking-wide">This Month</span>
					</div>
					<p class="text-2xl font-bold font-mono {monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
						{formatINR(monthlyProfit)}
					</p>
					<p class="mt-1 text-xs text-text-muted">
						Sales {formatINR(data.monthly.sales)} · Expenses {formatINR(data.monthly.expenses)}
					</p>
				</div>
			</div>

			<!-- Row 2: GST Breakdown -->
			<div class="rounded-xl border border-border bg-surface-0 overflow-hidden">
				<div class="flex items-center justify-between px-5 py-3.5">
					<h2 class="text-sm font-semibold text-text-strong inline-flex items-center gap-2">
						<Receipt class="size-4 text-text-muted" />
						GST Summary
					</h2>
					<div class="flex items-center gap-2">
						<span class="text-xs text-text-muted">{gstPayable ? "Net Payable" : "ITC Credit"}:</span>
						<span class="font-mono text-sm font-bold {gstPayable ? 'text-amber-600' : 'text-green-600'}">
							{formatINR(Math.abs(data.money.gstDue))}
						</span>
					</div>
				</div>
				<div class="border-t border-border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border text-xs text-text-muted">
								<th class="px-5 py-2 text-left font-medium">Component</th>
								<th class="px-5 py-2 text-right font-medium">Output (Collected)</th>
								<th class="px-5 py-2 text-right font-medium">Input (Paid)</th>
								<th class="px-5 py-2 text-right font-medium">Net</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr class="hover:bg-surface-2/60">
								<td class="px-5 py-2.5 font-medium text-text-strong">CGST</td>
								<td class="px-5 py-2.5 text-right font-mono text-text-strong">{formatINR(data.money.gstOutput.cgst)}</td>
								<td class="px-5 py-2.5 text-right font-mono text-text-strong">{formatINR(data.money.gstInput.cgst)}</td>
								<td class="px-5 py-2.5 text-right font-mono font-semibold {data.money.gstOutput.cgst - data.money.gstInput.cgst > 0 ? 'text-amber-600' : 'text-green-600'}">
									{formatINR(Math.abs(data.money.gstOutput.cgst - data.money.gstInput.cgst))}
								</td>
							</tr>
							<tr class="hover:bg-surface-2/60">
								<td class="px-5 py-2.5 font-medium text-text-strong">SGST</td>
								<td class="px-5 py-2.5 text-right font-mono text-text-strong">{formatINR(data.money.gstOutput.sgst)}</td>
								<td class="px-5 py-2.5 text-right font-mono text-text-strong">{formatINR(data.money.gstInput.sgst)}</td>
								<td class="px-5 py-2.5 text-right font-mono font-semibold {data.money.gstOutput.sgst - data.money.gstInput.sgst > 0 ? 'text-amber-600' : 'text-green-600'}">
									{formatINR(Math.abs(data.money.gstOutput.sgst - data.money.gstInput.sgst))}
								</td>
							</tr>
							<tr class="hover:bg-surface-2/60">
								<td class="px-5 py-2.5 font-medium text-text-strong">IGST</td>
								<td class="px-5 py-2.5 text-right font-mono text-text-strong">{formatINR(data.money.gstOutput.igst)}</td>
								<td class="px-5 py-2.5 text-right font-mono text-text-strong">{formatINR(data.money.gstInput.igst)}</td>
								<td class="px-5 py-2.5 text-right font-mono font-semibold {data.money.gstOutput.igst - data.money.gstInput.igst > 0 ? 'text-amber-600' : 'text-green-600'}">
									{formatINR(Math.abs(data.money.gstOutput.igst - data.money.gstInput.igst))}
								</td>
							</tr>
						</tbody>
						<tfoot>
							<tr class="border-t border-border bg-surface-2/40">
								<td class="px-5 py-2.5 font-semibold text-text-strong">Total</td>
								<td class="px-5 py-2.5 text-right font-mono font-semibold text-text-strong">{formatINR(data.money.gstOutput.total)}</td>
								<td class="px-5 py-2.5 text-right font-mono font-semibold text-text-strong">{formatINR(data.money.gstInput.total)}</td>
								<td class="px-5 py-2.5 text-right font-mono font-bold {gstPayable ? 'text-amber-600' : 'text-green-600'}">
									{formatINR(Math.abs(data.money.gstDue))}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			<!-- Row 2: Lists -->
			<div class="grid gap-3 lg:grid-cols-5">
				<!-- Unpaid Invoices -->
				<div class="lg:col-span-3 rounded-xl border border-border bg-surface-0 overflow-hidden">
					<div class="flex items-center justify-between px-5 py-3.5">
						<h2 class="text-sm font-semibold text-text-strong">Unpaid Invoices</h2>
						<a
							href="/invoices?status=unpaid"
							class="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-strong"
						>
							View all <ArrowRight class="size-3" />
						</a>
					</div>

					{#if duePreview.length === 0}
						<div class="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 text-center border-t border-border">
							<div class="rounded-lg bg-surface-2 p-2.5 text-text-muted">
								<CalendarClock class="size-5" />
							</div>
							<p class="text-sm font-semibold text-text-strong">No pending invoices</p>
							<p class="text-xs text-text-muted">
								All invoices are settled or not yet due.
							</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each duePreview as invoice}
								<a
									href="/invoices/{invoice.id}"
									class="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2/60"
								>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-semibold text-text-strong">
											{invoice.customerName}
										</p>
										<p class="mt-0.5 truncate text-xs text-text-muted">
											#{invoice.invoiceNumber} · Due {shortDate(invoice.dueDate)}
										</p>
									</div>
									<div class="shrink-0 text-right">
										<p class="font-mono text-sm font-semibold text-text-strong">
											{formatINR(invoice.amount)}
										</p>
										<span
											class="mt-1 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {dueBadgeClass(invoice.daysOverdue)}"
										>
											{dueBadgeLabel(invoice.daysOverdue)}
										</span>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Recent Activity -->
				<div class="lg:col-span-2 rounded-xl border border-border bg-surface-0 overflow-hidden">
					<div class="flex items-center justify-between px-5 py-3.5">
						<h2 class="text-sm font-semibold text-text-strong inline-flex items-center gap-2">
							<Activity class="size-4 text-text-muted" />
							Recent Activity
						</h2>
						<a
							href="/activity-log"
							class="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-strong"
						>
							View all <ArrowRight class="size-3" />
						</a>
					</div>

					{#if activityPreview.length === 0}
						<div class="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 text-center border-t border-border">
							<div class="rounded-lg bg-surface-2 p-2.5 text-text-muted">
								<Activity class="size-5" />
							</div>
							<p class="text-sm font-semibold text-text-strong">No activity yet</p>
							<p class="text-xs text-text-muted">
								Actions will appear here as you work.
							</p>
						</div>
					{:else}
						<div class="divide-y divide-border">
							{#each activityPreview as item}
								<div class="flex items-center justify-between gap-4 px-5 py-3 hover:bg-surface-2/60">
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm text-text-strong">{item.description}</p>
										<p class="mt-0.5 text-xs text-text-muted">
											{activityDate(item.createdAt)}
										</p>
									</div>
									{#if item.amount}
										<span class="shrink-0 font-mono text-sm font-semibold text-text-strong">
											{formatINR(item.amount)}
										</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
