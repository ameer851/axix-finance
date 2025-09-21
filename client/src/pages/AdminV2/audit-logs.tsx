import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminService } from "@/services/adminService";
import { AuditLog } from "@/types/admin";
import React, { useEffect, useMemo, useState } from "react";
import AdminV2Layout from "./layout";

const ACTION_DEFAULT = "resend_webhook";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [jobRuns, setJobRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Separate pagination per tab
  const [pageAudit, setPageAudit] = useState(1);
  const [pageLedger, setPageLedger] = useState(1);
  const [pageJobs, setPageJobs] = useState(1);
  const [limit] = useState(20);
  const [totalAudit, setTotalAudit] = useState(0);
  const [totalLedger, setTotalLedger] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [action, setAction] = useState<string>(ACTION_DEFAULT);
  const [search, setSearch] = useState<string>("");

  const totalPagesAudit = useMemo(
    () => Math.max(1, Math.ceil(totalAudit / limit)),
    [totalAudit, limit]
  );
  const totalPagesLedger = useMemo(
    () => Math.max(1, Math.ceil(totalLedger / limit)),
    [totalLedger, limit]
  );
  const totalPagesJobs = useMemo(
    () => Math.max(1, Math.ceil(totalJobs / limit)),
    [totalJobs, limit]
  );

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({
        page: pageAudit,
        limit,
        search,
        action,
      });
      setLogs(res.data);
      setTotalAudit(res.pagination.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  // Ledger filters
  const [ledgerUserId, setLedgerUserId] = useState<string>("");
  const [ledgerEntryType, setLedgerEntryType] = useState<string>("");
  const [ledgerRefTable, setLedgerRefTable] = useState<string>("");
  const [ledgerRefId, setLedgerRefId] = useState<string>("");

  const loadLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.ledger.list({
        page: pageLedger,
        limit,
        userId: ledgerUserId ? Number(ledgerUserId) : undefined,
        entryType: ledgerEntryType || undefined,
        referenceTable: ledgerRefTable || undefined,
        referenceId: ledgerRefId ? Number(ledgerRefId) : undefined,
      });
      setLedgerItems(res.data);
      setTotalLedger(res.pagination.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  // Job runs filters
  const [jobName, setJobName] = useState<string>("");
  const [jobSuccess, setJobSuccess] = useState<string>("");

  const loadJobRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.jobRuns.list({
        page: pageJobs,
        limit,
        jobName: jobName || undefined,
        success:
          jobSuccess === "true"
            ? true
            : jobSuccess === "false"
              ? false
              : undefined,
      });
      setJobRuns(res.data);
      setTotalJobs(res.pagination.total);
    } catch (e: any) {
      setError(e?.message || "Failed to load job runs");
    } finally {
      setLoading(false);
    }
  };

  const [tab, setTab] = useState("audit");

  useEffect(() => {
    if (tab === "audit") loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageAudit, action, tab]);
  useEffect(() => {
    if (tab === "ledger") loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageLedger,
    ledgerUserId,
    ledgerEntryType,
    ledgerRefTable,
    ledgerRefId,
    tab,
  ]);
  useEffect(() => {
    if (tab === "jobs") loadJobRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageJobs, jobName, jobSuccess, tab]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageAudit(1);
    loadLogs();
  };

  return (
    <AdminV2Layout>
      <div className="space-y-6">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setPage(1);
            setTab(v);
          }}
        >
          <TabsList>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="ledger">Financial Ledger</TabsTrigger>
            <TabsTrigger value="jobs">Job Runs</TabsTrigger>
          </TabsList>
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={onSearchSubmit}
                  className="flex flex-col md:flex-row gap-3 mb-4"
                >
                  <select
                    value={action}
                    onChange={(e) => {
                      setPage(1);
                      setAction(e.target.value);
                    }}
                    className="border rounded px-3 py-2"
                    aria-label="Action filter"
                  >
                    <option value="">All actions</option>
                    <option value="resend_webhook">resend_webhook</option>
                    <option value="login">login</option>
                    <option value="error">error</option>
                  </select>
                  <Input
                    placeholder="Search subject or recipient (to)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </form>

                {error && (
                  <div className="text-red-600 text-sm mb-2">{error}</div>
                )}

                <div className="overflow-auto border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">To</th>
                        <th className="px-3 py-2">Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const created =
                          (log as any).createdAt || (log as any).created_at;
                        const details = (log as any).details || {};
                        const to =
                          details?.to ||
                          details?.recipient ||
                          details?.email ||
                          "";
                        const subject =
                          details?.subject || details?.message_subject || "";
                        return (
                          <tr key={log.id} className="border-t">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(created).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              {(log as any).action || (log as any).type}
                            </td>
                            <td className="px-3 py-2">
                              {(log as any).description || (log as any).message}
                            </td>
                            <td className="px-3 py-2">{to}</td>
                            <td className="px-3 py-2">{subject}</td>
                          </tr>
                        );
                      })}
                      {!loading && logs.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-6 text-center text-gray-500"
                            colSpan={5}
                          >
                            No logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {pageAudit} of {totalPagesAudit} · {totalAudit} total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={pageAudit <= 1 || loading}
                      onClick={() => setPageAudit((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pageAudit >= totalPagesAudit || loading}
                      onClick={() => setPageAudit((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <CardTitle>Financial Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPageLedger(1);
                    loadLedger();
                  }}
                  className="flex flex-col md:flex-row gap-3 mb-4"
                >
                  <Input
                    placeholder="User ID"
                    value={ledgerUserId}
                    onChange={(e) => setLedgerUserId(e.target.value)}
                    className="w-28"
                  />
                  <Input
                    placeholder="Entry Type"
                    value={ledgerEntryType}
                    onChange={(e) => setLedgerEntryType(e.target.value)}
                    className="w-40"
                  />
                  <Input
                    placeholder="Ref Table"
                    value={ledgerRefTable}
                    onChange={(e) => setLedgerRefTable(e.target.value)}
                    className="w-40"
                  />
                  <Input
                    placeholder="Ref ID"
                    value={ledgerRefId}
                    onChange={(e) => setLedgerRefId(e.target.value)}
                    className="w-32"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? "Filtering..." : "Apply"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => {
                      setLedgerUserId("");
                      setLedgerEntryType("");
                      setLedgerRefTable("");
                      setLedgerRefId("");
                      setPageLedger(1);
                      loadLedger();
                    }}
                  >
                    Reset
                  </Button>
                </form>
                <div className="overflow-auto border rounded mb-4">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Δ Amount</th>
                        <th className="px-3 py-2">Balance After</th>
                        <th className="px-3 py-2">Active After</th>
                        <th className="px-3 py-2">Ref</th>
                        <th className="px-3 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerItems.map((it) => (
                        <tr key={it.id} className="border-t">
                          <td className="px-3 py-2">{it.id}</td>
                          <td className="px-3 py-2">{it.user_id}</td>
                          <td className="px-3 py-2">{it.entry_type}</td>
                          <td className="px-3 py-2">{it.amount_delta}</td>
                          <td className="px-3 py-2">{it.balance_after}</td>
                          <td className="px-3 py-2">
                            {it.active_deposits_after}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {it.reference_table}:{it.reference_id}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {new Date(it.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {!loading && ledgerItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-3 py-6 text-center text-gray-500"
                          >
                            No entries
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {pageLedger} of {totalPagesLedger} · {totalLedger}{" "}
                    total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={pageLedger <= 1 || loading}
                      onClick={() => setPageLedger((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pageLedger >= totalPagesLedger || loading}
                      onClick={() => setPageLedger((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPageJobs(1);
                    loadJobRuns();
                  }}
                  className="flex flex-col md:flex-row gap-3 mb-4"
                >
                  <Input
                    placeholder="Job Name"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    className="w-48"
                  />
                  <select
                    value={jobSuccess}
                    onChange={(e) => {
                      setJobSuccess(e.target.value);
                    }}
                    className="border rounded px-3 py-2"
                    aria-label="Success filter"
                  >
                    <option value="">All statuses</option>
                    <option value="true">Success</option>
                    <option value="false">Failure</option>
                  </select>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Filtering..." : "Apply"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => {
                      setJobName("");
                      setJobSuccess("");
                      setPageJobs(1);
                      loadJobRuns();
                    }}
                  >
                    Reset
                  </Button>
                </form>
                <div className="overflow-auto border rounded mb-4">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-3 py-2">Started</th>
                        <th className="px-3 py-2">Job</th>
                        <th className="px-3 py-2">Success</th>
                        <th className="px-3 py-2">Processed</th>
                        <th className="px-3 py-2">Completed</th>
                        <th className="px-3 py-2">Applied</th>
                        <th className="px-3 py-2">Duration</th>
                        <th className="px-3 py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobRuns.map((j) => {
                        const dur = j.finished_at
                          ? (new Date(j.finished_at).getTime() -
                              new Date(j.started_at).getTime()) /
                            1000
                          : null;
                        return (
                          <tr key={j.id} className="border-t">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(j.started_at).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">{j.job_name}</td>
                            <td className="px-3 py-2">
                              {j.success === true
                                ? "✅"
                                : j.success === false
                                  ? "❌"
                                  : "-"}
                            </td>
                            <td className="px-3 py-2">{j.processed_count}</td>
                            <td className="px-3 py-2">{j.completed_count}</td>
                            <td className="px-3 py-2">{j.total_applied}</td>
                            <td className="px-3 py-2">
                              {dur !== null ? dur + "s" : "-"}
                            </td>
                            <td
                              className="px-3 py-2 text-xs max-w-[160px] truncate"
                              title={j.error_text || ""}
                            >
                              {j.error_text || ""}
                            </td>
                          </tr>
                        );
                      })}
                      {!loading && jobRuns.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-3 py-6 text-center text-gray-500"
                          >
                            No runs
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {pageJobs} of {totalPagesJobs} · {totalJobs} total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={pageJobs <= 1 || loading}
                      onClick={() => setPageJobs((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={pageJobs >= totalPagesJobs || loading}
                      onClick={() => setPageJobs((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminV2Layout>
  );
}
