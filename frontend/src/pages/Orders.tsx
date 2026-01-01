import { useState, useMemo, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Eye, Edit, Printer } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

import {
  fetchOrders,
  OrderListItem,
  fetchOrderDetail,
  OrderDetail,
  updateOrder,
  UpdateOrderPayload,
} from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


// -----------------------------
// Helpers
// -----------------------------
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString();
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatGender(g: any): string {
  if (g === "M") return "Male";
  if (g === "F") return "Female";
  if (g === "O") return "Other";
  return "-";
}



// -----------------------------
// Component
// -----------------------------
export default function Orders() {

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit" | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // NEW PRINT STATES
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printOrderDetail, setPrintOrderDetail] =
    useState<OrderDetail | null>(null);


  const [editStatus, setEditStatus] =
    useState<"pending" | "in-progress" | "completed">("pending");

  const [editPriority, setEditPriority] =
    useState<"normal" | "urgent">("normal");

  const [editNotes, setEditNotes] = useState("");

  const queryClient = useQueryClient();


  // Load orders
  const {
    data: orders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  // Order detail for view/edit modal
  const {
    data: orderDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useQuery({
    queryKey: ["order-detail", selectedOrderId],
    queryFn: () =>
      selectedOrderId ? fetchOrderDetail(selectedOrderId) : Promise.reject(),
    enabled: selectedOrderId !== null && detailOpen,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateOrderPayload;
    }) => updateOrder(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({
        queryKey: ["order-detail", selectedOrderId],
      });
      setDetailMode("view");
    },
  });


  // load edit fields
  useEffect(() => {
    if (!orderDetail) return;
    setEditStatus(orderDetail.status);
    setEditPriority(orderDetail.priority);
    setEditNotes(orderDetail.notes ?? "");
  }, [orderDetail, detailMode]);


  // Filter list
  const filteredOrders = useMemo(() => {
    const list: OrderListItem[] = orders ?? [];

    return list.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (priorityFilter !== "all" && order.priority !== priorityFilter)
        return false;

      return true;
    });
  }, [orders, statusFilter, priorityFilter]);



  // -----------------------
  // PRINT HANDLER
  // -----------------------
  const handlePrintOrder = async (order: OrderListItem) => {
    try {
      const detail = await fetchOrderDetail(order.order_id);
      setPrintOrderDetail(detail);

      setIsPrintMode(true);

      setTimeout(() => {
        window.print();
      }, 150);

      window.onafterprint = () => {
        setIsPrintMode(false);
        setPrintOrderDetail(null);
      };

    } catch (e) {
      console.error("Print failed", e);
    }
  };


  // -----------------------
  // View/Edit handlers
  // -----------------------
  const handleViewOrder = (o: OrderListItem) => {
    setSelectedOrderId(o.order_id);
    setDetailMode("view");
    setDetailOpen(true);
  };

  const handleEditOrder = (o: OrderListItem) => {
    setSelectedOrderId(o.order_id);
    setDetailMode("edit");
    setDetailOpen(true);
  };


  const handleSaveOrder = () => {
    if (!orderDetail) return;

    updateMutation.mutate({
      id: orderDetail.order_id,
      payload: {
        priority: editPriority,
        status: editStatus,
        notes: editNotes,
      },
    });
  };



  // -----------------------
  // PRINT LAYOUT COMPONENT
  // -----------------------
  const PrintLayout = () => {
    if (!isPrintMode || !printOrderDetail) return null;
    const d = printOrderDetail;

    return (
      <div className="print-only p-8 text-black">
        <style>
          {`
            @media screen {
              .print-only { display: none; }
            }

            @media print {
              body * {
                visibility: hidden !important;
              }

              .print-only, .print-only * {
                visibility: visible !important;
              }

              .print-only {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}
        </style>

        <div className="border-b pb-3 mb-4">
          <h1 className="text-2xl font-bold">Medical Laboratory Report</h1>
          <p className="text-sm opacity-80">
            Computer Generated — No Signature Required
          </p>
        </div>

        {/* Main info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p><b>Order ID:</b> ORD{String(d.order_id).padStart(3, "0")}</p>
            <p><b>Date:</b> {formatDateTime(d.order_date)}</p>
            <p><b>Status:</b> {d.status}</p>
            <p><b>Priority:</b> {d.priority}</p>
            <p><b>Total:</b> ₹{d.total_amount.toFixed(2)}</p>
          </div>

          <div>
            <p>
              <b>Patient:</b> {d.patient_name} ({formatGender(d.patient_gender)})
            </p>
            <p>
              <b>DOB:</b> {d.patient_dob?.slice(0, 10) ?? "-"}{" "}
              {calculateAge(d.patient_dob) &&
                ` | Age: ${calculateAge(d.patient_dob)} yrs`}
            </p>
            <p>
              <b>Doctor:</b> {d.doctor_name ?? "-"} (
              {d.doctor_specialization ?? "-"})
            </p>
          </div>
        </div>

        {/* Tests */}
        <h2 className="text-lg font-semibold mb-2">Tests</h2>

        <table className="w-full border-collapse text-sm mb-4">
          <thead>
            <tr>
              <th className="border p-2 text-left">Test</th>
              <th className="border p-2 text-left">Unit</th>
              <th className="border p-2 text-left">Range</th>
              <th className="border p-2 text-left">Price</th>
            </tr>
          </thead>

          <tbody>
            {d.tests.map((t) => (
              <tr key={t.test_id}>
                <td className="border p-2">{t.test_name}</td>
                <td className="border p-2">{t.unit ?? "-"}</td>
                <td className="border p-2">{t.normal_range_text ?? "-"}</td>
                <td className="border p-2">₹{t.price?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        <h2 className="text-lg font-semibold mb-1">Notes</h2>
        <p className="border p-3 min-h-[80px]">
          {d.notes?.trim() || "No notes added."}
        </p>

        <p className="text-center text-xs mt-6 opacity-70">
          This is a computer-generated document and does not require a signature.
        </p>
      </div>
    );
  };



  // -----------------------
  // MAIN UI
  // -----------------------
  return (
    <>
      {PrintLayout()}

      <div className={`${isPrintMode ? "hidden" : "block"} space-y-6`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Orders</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track test orders
            </p>
          </div>

          <Link to="/orders/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Test Order
            </Button>
          </Link>
        </div>


        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter orders by status & priority
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label>Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label>Priority</label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Queue</CardTitle>
            <CardDescription>
              {isLoading
                ? "Loading..."
                : `Showing ${filteredOrders.length} order(s)`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!isLoading &&
                  filteredOrders.map((o) => {
                    const idLabel = `ORD${String(o.order_id).padStart(3, "0")}`;

                    return (
                      <TableRow key={o.order_id}>
                        <TableCell>{idLabel}</TableCell>
                        <TableCell>{o.patient_name}</TableCell>
                        <TableCell>{formatDateTime(o.order_date)}</TableCell>
                        <TableCell>{o.tests_count}</TableCell>
                        <TableCell>
                          <StatusBadge status={o.priority}>
                            {o.priority}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status}>
                            {o.status.replace("-", " ").toUpperCase()}
                          </StatusBadge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(o)}
                            >
                              <Eye className="h-4 w-4" /> View
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(o)}
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintOrder(o)}
                            >
                              <Printer className="h-4 w-4" /> Print
                            </Button>

                          </div>
                        </TableCell>

                      </TableRow>
                    );
                  })}
              </TableBody>

            </Table>
          </CardContent>
        </Card>




        {/* View / Edit Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {detailMode === "edit"
                  ? "Edit Order"
                  : "Order Details"}
              </DialogTitle>
            </DialogHeader>

            {detailLoading && <p>Loading...</p>}
            {detailError && <p>Error loading data</p>}


            {orderDetail && !detailLoading && (
              <>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p>
                      <b>Order ID:</b> ORD
                      {String(orderDetail.order_id).padStart(3, "0")}
                    </p>
                    <p><b>Date:</b> {formatDateTime(orderDetail.order_date)}</p>
                  </div>

                  <div>
                    <p><b>Patient:</b> {orderDetail.patient_name}</p>
                    <p><b>Doctor:</b> {orderDetail.doctor_name ?? "-"}</p>
                  </div>
                </div>


                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead>Range</TableHead>
                        <TableHead>Price</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {orderDetail.tests.map((t) => (
                        <TableRow key={t.test_id}>
                          <TableCell>{t.test_name}</TableCell>
                          <TableCell>{t.normal_range_text ?? "-"}</TableCell>
                          <TableCell>₹{t.price?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>



                {/* Notes */}
                <div className="mt-4">
                  <p className="font-medium">Notes</p>

                  {detailMode === "edit" ? (
                    <Textarea
                      rows={4}
                      className="mt-1"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  ) : (
                    <p className="border p-2 mt-1 bg-muted/40 rounded">
                      {orderDetail.notes || "No notes added"}
                    </p>
                  )}
                </div>




                {/* Edit buttons */}
                {detailMode === "edit" && (
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDetailMode("view")}
                    >
                      Cancel
                    </Button>

                    <Button onClick={handleSaveOrder}>
                      Save
                    </Button>
                  </div>
                )}

              </>
            )}

          </DialogContent>
        </Dialog>


      </div>
    </>
  );
}
