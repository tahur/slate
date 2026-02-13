export interface Pagination {
    page: number;
    pageSize: number;
    offset: number;
}

interface PaginationOptions {
    defaultPage?: number;
    defaultPageSize?: number;
    maxPageSize?: number;
}

export function parsePagination(searchParams: URLSearchParams, options: PaginationOptions = {}): Pagination {
    const defaultPage = options.defaultPage ?? 1;
    const defaultPageSize = options.defaultPageSize ?? 50;
    const maxPageSize = options.maxPageSize ?? 200;

    const parsedPage = Number.parseInt(searchParams.get('page') || '', 10);
    const parsedPageSize = Number.parseInt(searchParams.get('page_size') || '', 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : defaultPage;
    const requestedPageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : defaultPageSize;
    const pageSize = Math.min(requestedPageSize, maxPageSize);

    return {
        page,
        pageSize,
        offset: (page - 1) * pageSize
    };
}
