import { useMemo, useState } from "react";
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
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  TestItem,
  fetchTests,
  createTest,
  CreateTestPayload,
} from "@/lib/api";

export default function Tests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // form state
  const [testName, setTestName] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [unit, setUnit] = useState("");
  const [normalMin, setNormalMin] = useState("");
  const [normalMax, setNormalMax] = useState("");
  const [price, setPrice] = useState("");

  const queryClient = useQueryClient();

  const {
    data: tests,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTestPayload) => createTest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      setTestName("");
      setSampleType("");
      setUnit("");
      setNormalMin("");
      setNormalMax("");
      setPrice("");
      setIsDialogOpen(false);
    },
  });

  const handleSaveTest = () => {
    if (!testName.trim()) {
      alert("Test name is required");
      return;
    }
    const payload: CreateTestPayload = {
      testName: testName.trim(),
      sampleType: sampleType || undefined,
      unit: unit || undefined,
      normalMin: normalMin ? parseFloat(normalMin) : null,
      normalMax: normalMax ? parseFloat(normalMax) : null,
      price: price ? parseFloat(price) : 0,
    };
    createMutation.mutate(payload);
  };

  const filteredTests = useMemo(() => {
    const list: TestItem[] = tests ?? [];
    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((t) => {
      const name = t.test_name.toLowerCase();
      const sample = (t.sample_type ?? "").toLowerCase();
      const cat = (t.category_name ?? "").toLowerCase();
      return (
        name.includes(term) ||
        sample.includes(term) ||
        cat.includes(term)
      );
    });
  }, [tests, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Manage available lab tests, pricing and reference ranges
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Test</DialogTitle>
              <DialogDescription>
                Configure a new test for the catalog. Gender-specific ranges
                can be set from the database (test_reference_ranges table).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  placeholder="Hemoglobin (Hb)"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample-type">Sample Type</Label>
                  <Input
                    id="sample-type"
                    placeholder="Blood / Urine / Serum"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="mg/dL, g/dL, U/L"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="normal-min">Generic Normal Min</Label>
                  <Input
                    id="normal-min"
                    type="number"
                    value={normalMin}
                    onChange={(e) => setNormalMin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="normal-max">Generic Normal Max</Label>
                  <Input
                    id="normal-max"
                    type="number"
                    value={normalMax}
                    onChange={(e) => setNormalMax(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTest}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Save Test"}
              </Button>
            </div>
            {createMutation.isError && (
              <p className="mt-2 text-sm text-destructive">
                {(createMutation.error as Error).message}
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Tests</CardTitle>
          <CardDescription>
            Filter tests by name, sample type or category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by test name, sample type or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Tests</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading tests..."
              : `Total tests: ${filteredTests.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive mb-4">
              Failed to load tests:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          )}
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test ID</TableHead>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Normal (ANY)</TableHead>
                  <TableHead>Male Range</TableHead>
                  <TableHead>Female Range</TableHead>
                  <TableHead>Price (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading &&
                  filteredTests.map((t) => {
                    const idLabel = `T${String(t.test_id).padStart(3, "0")}`;
                    return (
                      <TableRow key={t.test_id}>
                        <TableCell className="font-medium">
                          {idLabel}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {t.test_name}
                        </TableCell>
                        <TableCell>{t.sample_type ?? "-"}</TableCell>
                        <TableCell>{t.unit ?? "-"}</TableCell>
                        <TableCell>{t.any_range_text ?? "-"}</TableCell>
                        <TableCell>{t.male_range_text ?? "-"}</TableCell>
                        <TableCell>{t.female_range_text ?? "-"}</TableCell>
                        <TableCell>₹{t.price.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredTests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm">
                      No tests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
