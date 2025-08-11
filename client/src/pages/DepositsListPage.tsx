import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { getTransactions } from "@/services/transactionService";
import { useQuery } from "@tanstack/react-query";
import React from "react";

const DepositsListPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.deposits(user?.id),
    queryFn: () =>
      getTransactions({
        type: "deposit",
        userId: user?.id,
        limit: 10,
        sortBy: "createdAt",
        order: "desc",
      }),
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="w-[250px] h-[20px] mb-4" />
        <Skeleton className="w-full h-[200px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Deposits List</h1>
        <div className="text-red-500">
          Failed to load deposits. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Deposits List</h1>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.transactions.length ? (
              data.transactions.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    {deposit.createdAt
                      ? (() => {
                          const value = deposit.createdAt;
                          const date =
                            value instanceof Date
                              ? value
                              : new Date(value as string);
                          return isNaN(date.getTime())
                            ? "Invalid"
                            : date.toLocaleDateString();
                        })()
                      : "N/A"}
                  </TableCell>
                  <TableCell>${deposit.amount}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        deposit.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : deposit.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {deposit.status}
                    </span>
                  </TableCell>
                  <TableCell>{deposit.description}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No deposits available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default DepositsListPage;
