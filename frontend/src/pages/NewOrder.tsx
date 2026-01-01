import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchPatients,
  fetchTests,
  fetchDoctors,
  createOrder,
  Patient,
  TestItem,
  DoctorItem,
  CreateOrderPayload,
} from "@/lib/api";

export default function NewOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [notes, setNotes] = useState("");

  // Load data
  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  const { data: tests } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  const testsList: TestItem[] = tests ?? [];
  const patientsList: Patient[] = patients ?? [];
  const doctorsList: DoctorItem[] = doctors ?? [];

  const handleTestToggle = (testId: number) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const selectedTestsInfo = useMemo(
    () => testsList.filter((t) => selectedTests.includes(t.test_id)),
    [testsList, selectedTests]
  );

  const totalPrice = selectedTestsInfo.reduce(
    (sum, test) => sum + (test.price || 0),
    0
  );

  const selectedPatient = useMemo(
    () =>
      patientsList.find(
        (p) => String(p.patient_id) === selectedPatientId
      ) ?? null,
    [patientsList, selectedPatientId]
  );

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Order Created Successfully",
        description: "Test order has been created and added to the queue.",
      });
      navigate("/orders");
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create order",
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId) {
      toast({
        title: "Select patient",
        description: "Please choose a patient for this order.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTests.length === 0) {
      toast({
        title: "Select at least one test",
        description: "Please choose tests to be performed.",
        variant: "destructive",
      });
      return;
    }

    const payload: CreateOrderPayload = {
      patientId: parseInt(selectedPatientId, 10),
      doctorId: selectedDoctorId ? parseInt(selectedDoctorId, 10) : null,
      priority,
      notes: notes || undefined,
      testIds: selectedTests,
    };

    createOrderMutation.mutate(payload);
  };

  const getDisplayRangeForTest = (test: TestItem): string => {
    const gender = selectedPatient?.gender; // 'M','F','O', or null
    if (gender === "M") {
      return (
        test.male_range_text ||
        test.any_range_text ||
        test.female_range_text ||
        "-"
      );
    }
    if (gender === "F") {
      return (
        test.female_range_text ||
        test.any_range_text ||
        test.male_range_text ||
        "-"
      );
    }
    // Other / unknown gender
    return (
      test.any_range_text ||
      test.male_range_text ||
      test.female_range_text ||
      "-"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Test Order</h1>
          <p className="text-muted-foreground mt-1">
            Create a new test order for a patient
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>
                  Select an existing patient from the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Patient</Label>
                  <Select
                    value={selectedPatientId}
                    onValueChange={setSelectedPatientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsList.map((p) => {
                        const idLabel = `P${String(p.patient_id).padStart(
                          3,
                          "0"
                        )}`;
                        return (
                          <SelectItem
                            key={p.patient_id}
                            value={String(p.patient_id)}
                          >
                            {p.full_name} - {idLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/patients")}
                >
                  + Add New Patient
                </Button>

                {selectedPatient && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Selected: {selectedPatient.full_name}{" "}
                    {selectedPatient.gender
                      ? `(${selectedPatient.gender})`
                      : ""}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Test Selection</CardTitle>
                <CardDescription>
                  Choose tests to be performed for this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tests configured in system.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {testsList.map((test) => (
                      <div
                        key={test.test_id}
                        className="flex items-start justify-between p-3 rounded-lg border hover:border-primary transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`test-${test.test_id}`}
                            checked={selectedTests.includes(test.test_id)}
                            onCheckedChange={() =>
                              handleTestToggle(test.test_id)
                            }
                          />
                          <div>
                            <label
                              htmlFor={`test-${test.test_id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {test.test_name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {test.sample_type || "Sample not specified"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Unit:{" "}
                              <span className="font-mono">
                                {test.unit || "-"}
                              </span>
                              {" • "}
                              Ref range:{" "}
                              <span className="font-mono">
                                {getDisplayRangeForTest(test)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          ₹{test.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Order details and notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Referring Doctor</Label>
                    <Select
                      value={selectedDoctorId}
                      onValueChange={setSelectedDoctorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorsList.map((d) => (
                          <SelectItem
                            key={d.doctor_id}
                            value={String(d.doctor_id)}
                          >
                            {d.full_name}
                            {d.specialization
                              ? ` - ${d.specialization}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(val) =>
                        setPriority(val as "normal" | "urgent")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or instructions..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Selected Tests:
                    </span>
                    <span className="font-medium">
                      {selectedTestsInfo.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedTestsInfo.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Selected Tests:</p>
                    <ul className="space-y-1">
                      {selectedTestsInfo.map((test) => (
                        <li
                          key={test.test_id}
                          className="text-xs text-muted-foreground flex justify-between gap-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {test.test_name}
                            </span>
                            <span>
                              Unit:{" "}
                              <span className="font-mono">
                                {test.unit || "-"}
                              </span>
                              {" • Range: "}
                              <span className="font-mono">
                                {getDisplayRangeForTest(test)}
                              </span>
                            </span>
                          </div>
                          <span className="whitespace-nowrap">
                            ₹{test.price.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={
                    selectedTestsInfo.length === 0 ||
                    !selectedPatientId ||
                    createOrderMutation.isPending
                  }
                >
                  <Save className="h-4 w-4" />
                  {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
