"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Filter, Search, Frown } from "lucide-react";
import { Card } from "./card";
import React from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterBy: string;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  expandedRows?: Record<string, boolean>;
}

export function DataTable<TData, TValue>({
  columns,
  filterBy,
  data,
  renderExpandedRow,
  expandedRows = {},
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <Card className="mt-4 w-full overflow-hidden border-fuchsia-200 shadow-sm shadow-fuchsia-100 sm:mt-6 dark:border-fuchsia-900/50 dark:shadow-none">
      {/* Toolbar: stacked on mobile, single row from sm up */}
      <div className="flex flex-col gap-3 border-b border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-transparent p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-fuchsia-900/50 dark:from-fuchsia-950/30">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-fuchsia-500 sm:top-2.5"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={`Filter by ${filterBy.toUpperCase()}...`}
            value={
              (table.getColumn(filterBy)?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn(filterBy)?.setFilterValue(e.target.value)
            }
            className="w-full pl-9 sm:max-w-sm"
            aria-label={`Filter ${filterBy}`}
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-100 hover:text-fuchsia-800 sm:flex-none dark:border-fuchsia-800 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50"
              >
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-72 overflow-y-auto border-fuchsia-200 dark:border-fuchsia-900/50"
            >
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize focus:bg-fuchsia-50 focus:text-fuchsia-900 dark:focus:bg-fuchsia-950/50 dark:focus:text-fuchsia-100"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="shrink-0 rounded-lg border border-fuchsia-300 p-2 hover:bg-fuchsia-100 dark:border-fuchsia-800 dark:hover:bg-fuchsia-950/50"
            aria-label="Filters"
          >
            <Filter className="h-4 w-4 text-fuchsia-700 dark:text-fuchsia-300" />
          </button>
        </div>
      </div>

      {/* Table: scrolls horizontally on small screens */}
      <div className="w-full overflow-x-auto">
        <Table className="w-full min-w-[640px] text-xs sm:min-w-0 sm:text-sm">
          <TableHeader className="bg-fuchsia-50 dark:bg-fuchsia-950/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-fuchsia-200 hover:bg-transparent dark:border-fuchsia-900/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap p-2 font-semibold text-fuchsia-900 dark:text-fuchsia-200"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const id = (row.original as any).id;
                const isExpanded = expandedRows[id];

                return (
                  <React.Fragment key={id}>
                    {/* Main Row */}
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b border-fuchsia-100 transition-colors last:border-0 hover:bg-fuchsia-50/70 data-[state=selected]:bg-fuchsia-100 dark:border-fuchsia-900/30 dark:hover:bg-fuchsia-950/30 dark:data-[state=selected]:bg-fuchsia-950/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-2 sm:p-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {isExpanded && renderExpandedRow && (
                      <TableRow className="border-l-2 border-l-fuchsia-500 bg-fuchsia-50/60 hover:bg-fuchsia-50/60 dark:bg-fuchsia-950/20">
                        <TableCell colSpan={table.getAllColumns().length}>
                          <div className="p-2 sm:p-3">
                            {renderExpandedRow(row.original)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="p-4 text-right"
                >
                  <div className="flex items-center justify-center text-center text-fuchsia-700 dark:text-fuchsia-300">
                    <Frown size="18" className="me-1 text-fuchsia-500" />
                    <div className="text-sm">No results found.</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination: full-width buttons on mobile */}
      <div className="flex items-center gap-2 border-t border-fuchsia-100 p-3 py-6 sm:justify-end sm:space-x-0 sm:p-4 sm:py-12 dark:border-fuchsia-900/30">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-100 hover:text-fuchsia-800 disabled:border-fuchsia-100 disabled:text-fuchsia-300 sm:flex-none dark:border-fuchsia-800 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-100 hover:text-fuchsia-800 disabled:border-fuchsia-100 disabled:text-fuchsia-300 sm:flex-none dark:border-fuchsia-800 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </Card>
  );
}