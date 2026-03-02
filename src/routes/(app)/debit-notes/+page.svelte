<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Plus, FileText } from "lucide-svelte";
	import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
	import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
	import { formatINR } from "$lib/utils/currency";
	import { formatDate } from "$lib/utils/date";

	let { data } = $props();
</script>

<div class="page-full-bleed">
	<!-- Header / Filter Bar -->
	<header class="page-header items-center">
		<div class="flex items-center gap-4">
			<h1 class="text-xl font-bold tracking-tight text-text-strong">
				Debit Notes
			</h1>
		</div>
		<Button href="/debit-notes/new">
			<Plus class="mr-2 size-4" />
			New Debit Note
		</Button>
	</header>

	<!-- Content -->
	<main class="page-body">
		<div class="content-width-standard">
		{#if data.debitNotes.length === 0}
			<div
				class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
			>
				<FileText class="size-12 text-text-muted/30 mb-4" />
				<h3 class="text-lg font-bold text-text-strong">
					No debit notes yet
				</h3>
				<p class="text-sm text-text-subtle mb-6">
					Create your first debit note to get started
				</p>
				<Button href="/debit-notes/new">
					<Plus class="mr-2 size-4" />
					Create Debit Note
				</Button>
			</div>
		{:else}
			<div
				class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
			>
				<Table>
					<TableHeader>
						<TableRow class="hover:bg-transparent">
							<TableHead class="w-28">Date</TableHead>
							<TableHead>DN #</TableHead>
							<TableHead>Supplier</TableHead>
							<TableHead>Reason</TableHead>
							<TableHead class="text-right w-28">Status</TableHead>
							<TableHead class="text-right w-32">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each data.debitNotes as dn}
							<TableRow class="group cursor-pointer">
								<TableCell class="text-text-muted font-medium">
									<a href="/debit-notes/{dn.id}" class="flex items-center w-full h-full text-inherit no-underline">
										{formatDate(dn.debit_note_date)}
									</a>
								</TableCell>
								<TableCell>
									<a href="/debit-notes/{dn.id}" class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-primary whitespace-nowrap">
										{dn.debit_note_number}
									</a>
								</TableCell>
								<TableCell>
									<a href="/debit-notes/{dn.id}" class="flex items-center w-full h-full text-inherit no-underline">
										<span
											class="text-sm font-semibold text-text-strong"
											>{dn.vendor_name || "—"}</span
										>
									</a>
								</TableCell>
								<TableCell>
									<a href="/debit-notes/{dn.id}" class="flex items-center w-full h-full text-inherit no-underline">
										<span
											class="text-sm text-text-subtle capitalize"
											>{dn.reason}</span
										>
									</a>
								</TableCell>
								<TableCell class="text-right">
									<a href="/debit-notes/{dn.id}" class="flex items-center justify-end w-full h-full text-inherit no-underline">
										<StatusBadge
											status={dn.status}
										/>
									</a>
								</TableCell>
								<TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
									<a href="/debit-notes/{dn.id}" class="flex items-center justify-end w-full h-full text-inherit no-underline">
										{formatINR(dn.total)}
									</a>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
		</div>
	</main>
</div>
