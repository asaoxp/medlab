import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Printer, FileText, Edit, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchReports,
  fetchOrderDetail,
  updateOrderResults,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function fmt(dt?: string | null) {
  return dt ? new Date(dt).toLocaleString() : "-";
}

export default function Reports() {
  const qc = useQueryClient();
  const { toast } = useToast();

  // -------------------- state --------------------
  const [orderIdInput, setOrderIdInput] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [results, setResults] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // -------------------- queries --------------------
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", activeOrderId],
    queryFn: () => fetchOrderDetail(activeOrderId!),
    enabled: activeOrderId !== null,
  });

  // -------------------- handlers --------------------
  const openEditByOrderId = () => {
    const id = Number(orderIdInput.trim());
    if (!id || isNaN(id)) {
      toast({
        title: "Invalid Order ID",
        description: "Please enter a valid numeric order ID",
        variant: "destructive",
      });
      return;
    }
    setActiveOrderId(id);
    setEditOpen(true);
  };

  const saveResults = async () => {
    if (!activeOrderId || !order) return;

    setIsSaving(true);
    try {
      await updateOrderResults(activeOrderId, {
        results: order.tests.map((t) => ({
          testId: t.test_id,
          value: results[t.test_id] ? Number(results[t.test_id]) : null,
        })),
        markCompleted: true,
      });

      toast({
        title: "Success",
        description: "Test results saved successfully",
      });

      setEditOpen(false);
      setResults({});
      setActiveOrderId(null);
      setOrderIdInput("");
      
      // Invalidate queries to refresh data
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", activeOrderId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save results",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load existing results when order loads
  useEffect(() => {
    if (!order) return;
    const r: Record<number, string> = {};
    order.tests.forEach((t) => {
      if (t.result_value !== null && t.result_value !== undefined) {
        r[t.test_id] = String(t.result_value);
      }
    });
    setResults(r);
  }, [order]);

  // Reset when dialog closes
  useEffect(() => {
    if (!editOpen) {
      setActiveOrderId(null);
      setResults({});
    }
  }, [editOpen]);

  // -------------------- UI --------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              View, edit, and print finalized lab reports
            </p>
          </div>
        </div>

        {/* ADD / EDIT REPORT SECTION */}
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Enter Order ID"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openEditByOrderId()}
            className="w-40"
          />
          <Button onClick={openEditByOrderId} size="default">
            <Edit className="h-4 w-4 mr-2" />
            Add / Edit Report
          </Button>
        </div>
      </div>

      {/* REPORT LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Reports</CardTitle>
          <CardDescription>
            {reportsLoading ? "Loading..." : `${reports.length} report(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.order_id}>
                  <TableCell className="font-medium">
                    REP{String(r.order_id).padStart(3, "0")}
                  </TableCell>
                  <TableCell>{r.patient_name}</TableCell>
                  <TableCell>{fmt(r.order_date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.priority as any}>
                      {r.priority.toUpperCase()}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>₹{r.total_amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveOrderId(r.order_id);
                          setViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveOrderId(r.order_id);
                          setViewOpen(true);
                          setTimeout(() => window.print(), 300);
                        }}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && !reportsLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm py-8">
                    No completed reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {orderLoading
                ? "Loading Order..."
                : order
                ? `Edit Report - Order #${order.order_id}`
                : "Order Not Found"}
            </DialogTitle>
          </DialogHeader>

          {orderLoading && (
            <div className="py-8 text-center text-muted-foreground">
              Loading order details...
            </div>
          )}

          {!orderLoading && !order && (
            <div className="py-8 text-center">
              <p className="text-destructive font-medium mb-2">
                Order not found
              </p>
              <p className="text-sm text-muted-foreground">
                Please check the order ID and try again
              </p>
            </div>
          )}

          {!orderLoading && order && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{order.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{fmt(order.order_date)}</p>
                </div>
                {order.doctor_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Doctor</p>
                    <p className="font-medium">{order.doctor_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={order.status as any}>
                    {order.status.toUpperCase()}
                  </StatusBadge>
                </div>
              </div>

              {/* Results Table */}
              <div>
                <h3 className="font-semibold mb-3">Test Results</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Test Name</TableHead>
                      <TableHead className="w-[20%]">Result Value</TableHead>
                      <TableHead className="w-[15%]">Unit</TableHead>
                      <TableHead className="w-[25%]">Normal Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.tests.map((t) => (
                      <TableRow key={t.test_id}>
                        <TableCell className="font-medium">
                          {t.test_name}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter value"
                            value={results[t.test_id] ?? ""}
                            onChange={(e) =>
                              setResults({
                                ...results,
                                [t.test_id]: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.unit ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.normal_range_text ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={saveResults} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save & Mark Complete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:bg-white">
          <DialogHeader className="print:hidden">
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>

          {orderLoading && (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          )}

          {!orderLoading && order && (
            <div className="space-y-6 print:text-black">
              {/* Report Header */}
              <div className="text-center border-b pb-4 print:border-black">
                <h2 className="text-2xl font-bold print:text-3xl">
                  Laboratory Report
                </h2>
                <p className="text-sm text-muted-foreground print:text-gray-700">
                  Report ID: REP{String(order.order_id).padStart(3, "0")}
                </p>
              </div>

              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-2 gap-6 print:gap-8">
                <div>
                  <h3 className="font-semibold mb-2 print:text-lg">
                    Patient Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {order.patient_name}
                    </p>
                    {order.patient_dob && (
                      <p>
                        <span className="font-medium">DOB:</span>{" "}
                        {new Date(order.patient_dob).toLocaleDateString()}
                      </p>
                    )}
                    {order.patient_gender && (
                      <p>
                        <span className="font-medium">Gender:</span>{" "}
                        {order.patient_gender}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 print:text-lg">
                    Report Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {fmt(order.order_date)}
                    </p>
                    {order.doctor_name && (
                      <p>
                        <span className="font-medium">Referring Doctor:</span>{" "}
                        {order.doctor_name}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Priority:</span>{" "}
                      {order.priority.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h3 className="font-semibold mb-3 print:text-lg">
                  Test Results
                </h3>
                <Table className="print:border print:border-black">
                  <TableHeader>
                    <TableRow className="print:border-b print:border-black">
                      <TableHead className="print:text-black print:font-bold">
                        Test Name
                      </TableHead>
                      <TableHead className="print:text-black print:font-bold">
                        Result
                      </TableHead>
                      <TableHead className="print:text-black print:font-bold">
                        Unit
                      </TableHead>
                      <TableHead className="print:text-black print:font-bold">
                        Normal Range
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.tests.map((t) => (
                      <TableRow
                        key={t.test_id}
                        className="print:border-b print:border-gray-300"
                      >
                        <TableCell className="font-medium print:text-black">
                          {t.test_name}
                        </TableCell>
                        <TableCell className="print:text-black">
                          {t.result_value !== null &&
                          t.result_value !== undefined
                            ? t.result_value
                            : "-"}
                        </TableCell>
                        <TableCell className="print:text-black">
                          {t.unit ?? "-"}
                        </TableCell>
                        <TableCell className="print:text-black">
                          {t.normal_range_text ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground print:text-gray-600 print:mt-12 border-t pt-4">
                <p>End of Report</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}