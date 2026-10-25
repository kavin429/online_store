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
    <Card className="mt-6">
      <div className="flex justify-between items-center p-5 border-b">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none"
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
            className="pl-9 max-w-sm"
            aria-label={`Filter ${filterBy}`}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="ml-3 p-2 border rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800">
          <Filter className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="p-2">
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
                      className="border-b last:border-0"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {isExpanded && renderExpandedRow && (
                      <TableRow className="bg-zinc-50 dark:bg-neutral-900/30">
                        <TableCell colSpan={table.getAllColumns().length}>
                          <div className="p-3">{renderExpandedRow(row.original)}</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-4 text-right">
                  <div className="flex items-center justify-center text-center text-zinc-700 dark:text-zinc-400">
                    <Frown size="18" className="me-1" />
                    <div className="text-sm">No results found.</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-12 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
