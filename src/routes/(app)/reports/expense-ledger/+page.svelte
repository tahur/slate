<script lang="ts">
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { Card } from "$lib/components/ui/card";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select";
	import {
		Table,
		TableHeader,
		TableBody,
		TableRow,
		TableHead,
		TableCell,
		TableFooter,
	} from "$lib/components/ui/table";
	import { ArrowLeft, RefreshCw } from "lucide-svelte";
	import { formatINR } from "$lib/utils/currency";
	import { formatDate } from "$lib/utils/date";

	let { data } = $props();

	type Preset = "this-month" | "last-month" | "fy" | "last-90";

	let startDate = $state(data.startDate);
	let endDate = $state(data.endDate);
	let selectedCategoryId = $state(data.selectedCategoryId);
	let pageSize = $state(data.pagination?.pageSize || 50);
	const ALL_CATEGORIES = "__all_categories";

	function buildIsoDate(date: Date): string {
		const year = date.getFullYear();
		const month = `${date.getMonth() + 1}`.padStart(2, "0");
		const day = `${date.getDate()}`.padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	function getPresetRange(preset: Preset) {
		const now = new Date();

		if (preset === "this-month") {
			return {
				from: buildIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
				to: buildIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
			};
		}

		if (preset === "last-month") {
			return {
				from: buildIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
				to: buildIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
			};
		}

		if (preset === "last-90") {
			const ninetyDaysAgo = new Date(now);
			ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
			return {
				from: buildIsoDate(ninetyDaysAgo),
				to: buildIsoDate(now),
			};
		}

		const currentYear = now.getFullYear();
		const isAfterMarch = now.getMonth() >= 3;
		const startYear = isAfterMarch ? currentYear : currentYear - 1;
		const endYear = isAfterMarch ? currentYear + 1 : currentYear;
		return {
			from: `${startYear}-04-01`,
			to: `${endYear}-03-31`,
		};
	}

	function applyPreset(preset: Preset) {
		const range = getPresetRange(preset);
		startDate = range.from;
		endDate = range.to;
	}

	function isPresetActive(preset: Preset) {
		const range = getPresetRange(preset);
		return startDate === range.from && endDate === range.to;
	}

	function buildQuery(nextPage = 1) {
		const params = new URLSearchParams();
		params.set("from", startDate);
		params.set("to", endDate);
		params.set("page", String(nextPage));
		params.set("page_size", String(pageSize));

		if (selectedCategoryId) {
			params.set("category", selectedCategoryId);
		}

		return params;
	}

	function applyFilter(nextPage = 1) {
		const params = buildQuery(nextPage);
		goto(`/reports/expense-ledger?${params.toString()}`);
	}

	function selectCategory(categoryId: string) {
		selectedCategoryId = categoryId;
		const params = new URLSearchParams();
		params.set("from", startDate);
		params.set("to", endDate);
		params.set("category", categoryId);
		params.set("page", "1");
		params.set("page_size", String(pageSize));
		goto(`/reports/expense-ledger?${params.toString()}`);
	}

	function getSelectedCategoryLabel() {
		if (!selectedCategoryId) return "All Categories";
		const opt = data.categoryOptions.find(
			(item: any) => item.id === selectedCategoryId,
		);
		return opt ? opt.name : "All Categories";
	}

	function getStatusClass(status: string): string {
		if (status === "paid") return "bg-green-50 text-green-700";
		return "bg-amber-50 text-amber-700";
	}

	function getStatusLabel(status: string): string {
		if (status === "paid") return "Paid";
		return "Unpaid";
	}

	const grandTotal = $derived(
		data.categorySummary.reduce((sum: number, row: any) => sum + row.total, 0),
	);
</script>

<div class="page-full-bleed">
	<header class="page-header items-center">
		<div class="flex items-center gap-4">
			<Button variant="ghost" href="/reports" size="icon" class="h-8 w-8">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-xl font-bold tracking-tight text-text-strong">
					Expense Ledger
				</h1>
				<p class="text-sm text-text-muted">
					Spending by category with payment details
				</p>
			</div>
		</div>
	</header>

	<main class="page-body">
		<div class="content-width-standard space-y-4">
			<Card class="p-4">
				<div class="flex flex-wrap items-end gap-4">
					<div class="space-y-2">
						<Label for="from" variant="form">From</Label>
						<Input type="date" id="from" bind:value={startDate} />
					</div>

					<div class="space-y-2">
						<Label for="to" variant="form">To</Label>
						<Input type="date" id="to" bind:value={endDate} />
					</div>

					<div class="space-y-2 min-w-56">
						<Label for="category" variant="form">Category</Label>
						<Select.Root
							type="single"
							value={selectedCategoryId || ALL_CATEGORIES}
							onValueChange={(value) =>
								(selectedCategoryId =
									value === ALL_CATEGORIES ? "" : value)}
						>
							<Select.Trigger id="category" class="w-full">
								{getSelectedCategoryLabel()}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value={ALL_CATEGORIES}
									>All Categories</Select.Item
								>
								{#each data.categoryOptions as opt}
									<Select.Item value={opt.id}>
										{opt.name}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2 min-w-28">
						<Label for="page-size" variant="form">Rows</Label>
						<Select.Root
							type="single"
							value={`${pageSize}`}
							onValueChange={(value) =>
								(pageSize = Number(value))}
						>
							<Select.Trigger id="page-size" class="w-full">
								{pageSize}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="25">25</Select.Item>
								<Select.Item value="50">50</Select.Item>
								<Select.Item value="100">100</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<Button onclick={() => applyFilter(1)}>
						<RefreshCw class="mr-2 size-4" />
						Apply
					</Button>
				</div>

				<div class="flex flex-wrap gap-2 mt-4">
					<Button
						variant="outline"
						size="sm"
						class={isPresetActive("this-month")
							? "border-primary text-primary bg-surface-0"
							: ""}
						onclick={() => applyPreset("this-month")}
					>
						This Month
					</Button>
					<Button
						variant="outline"
						size="sm"
						class={isPresetActive("last-month")
							? "border-primary text-primary bg-surface-0"
							: ""}
						onclick={() => applyPreset("last-month")}
					>
						Last Month
					</Button>
					<Button
						variant="outline"
						size="sm"
						class={isPresetActive("fy")
							? "border-primary text-primary bg-surface-0"
							: ""}
						onclick={() => applyPreset("fy")}
					>
						This FY
					</Button>
					<Button
						variant="outline"
						size="sm"
						class={isPresetActive("last-90")
							? "border-primary text-primary bg-surface-0"
							: ""}
						onclick={() => applyPreset("last-90")}
					>
						Last 90 Days
					</Button>
				</div>
			</Card>

			<!-- Category Summary Table (always visible) -->
			<Card class="p-4">
				<div class="mb-3">
					<h2
						class="text-xs font-semibold uppercase tracking-wider text-text-muted"
					>
						Category Summary
					</h2>
					<p class="text-xs text-text-muted mt-1">
						{startDate} to {endDate}
					</p>
				</div>

				{#if data.categorySummary.length === 0}
					<p class="text-sm text-text-muted py-8 text-center">
						No expenses found in this period.
					</p>
				{:else}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow class="hover:bg-transparent">
									<TableHead>Category</TableHead>
									<TableHead class="text-right w-20"
										>Count</TableHead
									>
									<TableHead class="text-right w-36"
										>Total</TableHead
									>
									<TableHead class="text-right w-24"
										>% of Total</TableHead
									>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each data.categorySummary as row}
									<TableRow
										class="cursor-pointer {selectedCategoryId === row.categoryId ? 'bg-slate-50' : ''}"
										onclick={() =>
											selectCategory(row.categoryId)}
									>
										<TableCell
											class="font-medium text-text-strong"
										>
											{row.accountName}
										</TableCell>
										<TableCell
											class="text-right font-mono tabular-nums text-[0.8125rem] text-text-subtle"
										>
											{row.count}
										</TableCell>
										<TableCell
											class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong"
										>
											{formatINR(row.total)}
										</TableCell>
										<TableCell
											class="text-right font-mono tabular-nums text-[0.8125rem] text-text-muted"
										>
											{grandTotal > 0
												? `${Math.round((row.total / grandTotal) * 100)}%`
												: "—"}
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
							<TableFooter>
								<TableRow
									class="hover:bg-transparent bg-surface-2/60 font-semibold"
								>
									<TableCell>Total</TableCell>
									<TableCell
										class="text-right font-mono tabular-nums text-[0.8125rem]"
									>
										{data.categorySummary.reduce(
											(sum: number, r: any) =>
												sum + r.count,
											0,
										)}
									</TableCell>
									<TableCell
										class="text-right font-mono tabular-nums text-[0.8125rem]"
									>
										{formatINR(grandTotal)}
									</TableCell>
									<TableCell
										class="text-right font-mono tabular-nums text-[0.8125rem]"
									>
										100%
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				{/if}
			</Card>

			<!-- Detail Section (when category selected) -->
			{#if data.ledger}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card class="p-4">
						<p class="text-xs text-text-muted">Opening</p>
						<p
							class="text-2xl font-bold font-mono text-text-strong"
						>
							{formatINR(data.ledger.opening)}
						</p>
					</Card>
					<Card class="p-4">
						<p class="text-xs text-text-muted">
							Period Expenses
						</p>
						<p
							class="text-2xl font-bold font-mono text-text-strong"
						>
							{formatINR(data.ledger.periodTotal)}
						</p>
					</Card>
					<Card class="p-4">
						<p class="text-xs text-text-muted">Paid</p>
						<p
							class="text-2xl font-bold font-mono text-green-600"
						>
							{formatINR(data.ledger.periodPaid)}
						</p>
					</Card>
					<Card class="p-4">
						<p class="text-xs text-text-muted">Unpaid</p>
						<p
							class="text-2xl font-bold font-mono {data.ledger.periodUnpaid > 0 ? 'text-amber-600' : 'text-text-muted'}"
						>
							{formatINR(data.ledger.periodUnpaid)}
						</p>
					</Card>
				</div>

				<Card class="p-4">
					<div
						class="mb-3 flex items-center justify-between gap-3"
					>
						<div>
							<h3
								class="text-xs font-semibold uppercase tracking-wider text-text-muted"
							>
								{data.ledger.categoryName} — Detail
							</h3>
							<p class="text-xs text-text-muted mt-1">
								{startDate} to {endDate}
							</p>
						</div>
						{#if data.pagination}
							<p class="text-xs text-text-muted">
								{data.pagination.totalEntries === 0
									? "0 entries"
									: `${(data.pagination.page - 1) * data.pagination.pageSize + 1}-${Math.min(
											data.pagination.page *
												data.pagination.pageSize,
											data.pagination.totalEntries,
										)} of ${data.pagination.totalEntries}`}
							</p>
						{/if}
					</div>

					{#if data.ledger.entries.length === 0}
						<p
							class="text-sm text-text-muted py-8 text-center"
						>
							No entries in selected period.
						</p>
					{:else}
						<div class="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow
										class="hover:bg-transparent"
									>
										<TableHead class="w-28"
											>Date</TableHead
										>
										<TableHead class="w-32"
											>Expense #</TableHead
										>
										<TableHead class="min-w-[12rem]"
											>Description</TableHead
										>
										<TableHead class="w-36"
											>Supplier</TableHead
										>
										<TableHead class="w-24"
											>Status</TableHead
										>
										<TableHead class="w-28"
											>Method</TableHead
										>
										<TableHead
											class="text-right w-32"
											>Total</TableHead
										>
										<TableHead
											class="text-right w-36"
											>Running Total</TableHead
										>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each data.ledger.entries as entry}
										<TableRow>
											<TableCell
												class="text-text-muted"
											>
												{formatDate(entry.date)}
											</TableCell>
											<TableCell>
												<a
													href={entry.href}
													class="font-mono text-primary hover:underline"
												>
													{entry.number}
												</a>
											</TableCell>
											<TableCell
												class="text-sm text-text-subtle"
											>
												{entry.description ||
													"—"}
											</TableCell>
											<TableCell
												class="text-text-strong"
											>
												{entry.supplierName ||
													"—"}
											</TableCell>
											<TableCell>
												<span
													class="inline-flex px-2 py-0.5 rounded text-xs font-medium {getStatusClass(entry.paymentStatus)}"
												>
													{getStatusLabel(
														entry.paymentStatus,
													)}
												</span>
											</TableCell>
											<TableCell
												class="text-xs text-text-muted"
											>
												{entry.methodLabel ||
													"—"}
											</TableCell>
											<TableCell
												class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong"
											>
												{formatINR(entry.total)}
											</TableCell>
											<TableCell
												class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold text-text-strong"
											>
												{formatINR(
													entry.runningTotal,
												)}
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
								<TableFooter>
									<TableRow
										class="hover:bg-transparent bg-surface-2/60 font-semibold"
									>
										<TableCell colspan={6}
											>Period Total</TableCell
										>
										<TableCell
											class="text-right font-mono tabular-nums text-[0.8125rem]"
										>
											{formatINR(
												data.ledger.periodTotal,
											)}
										</TableCell>
										<TableCell
											class="text-right font-mono tabular-nums text-[0.8125rem]"
										>
											{formatINR(
												data.ledger.opening +
													data.ledger
														.periodTotal,
											)}
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					{/if}

					{#if data.pagination && data.pagination.totalPages > 1}
						<div
							class="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3"
						>
							<Button
								variant="outline"
								size="sm"
								onclick={() =>
									applyFilter(
										data.pagination.page - 1,
									)}
								disabled={!data.pagination
									.hasPreviousPage}
							>
								Previous
							</Button>
							<p class="text-xs text-text-muted px-2">
								Page {data.pagination.page} of {data
									.pagination.totalPages}
							</p>
							<Button
								variant="outline"
								size="sm"
								onclick={() =>
									applyFilter(
										data.pagination.page + 1,
									)}
								disabled={!data.pagination.hasNextPage}
							>
								Next
							</Button>
						</div>
					{/if}
				</Card>
			{/if}
		</div>
	</main>
</div>
