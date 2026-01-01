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
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Mail } from "lucide-react";
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
  DoctorItem,
  fetchDoctors,
  createDoctor,
  CreateDoctorPayload,
} from "@/lib/api";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

export default function Doctors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const queryClient = useQueryClient();

  const {
    data: doctors,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateDoctorPayload) => createDoctor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setFullName("");
      setSpecialization("");
      setPhone("");
      setEmail("");
      setIsDialogOpen(false);
    },
  });

  const handleSaveDoctor = () => {
    if (!fullName.trim()) {
      alert("Full name is required");
      return;
    }
    createMutation.mutate({
      fullName: fullName.trim(),
      specialization: specialization || undefined,
      phone: phone || undefined,
      email: email || undefined,
    });
  };

  const filteredDoctors = useMemo(() => {
    const list: DoctorItem[] = doctors ?? [];
    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((d) => {
      const name = d.full_name.toLowerCase();
      const spec = (d.specialization ?? "").toLowerCase();
      return name.includes(term) || spec.includes(term);
    });
  }, [doctors, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted-foreground mt-1">
            Manage referring doctors and their details
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Enter doctor information to add them to the list
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="Dr. Amit Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="Pathologist / General Physician"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+91-9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
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
                onClick={handleSaveDoctor}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Save Doctor"}
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
          <CardTitle>Search Doctors</CardTitle>
          <CardDescription>
            Filter doctors by name or specialization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading doctors..."
              : `Total doctors: ${filteredDoctors.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive mb-4">
              Failed to load doctors:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading &&
                filteredDoctors.map((d) => {
                  const idLabel = `D${String(d.doctor_id).padStart(3, "0")}`;
                  return (
                    <TableRow key={d.doctor_id}>
                      <TableCell className="font-medium">{idLabel}</TableCell>
                      <TableCell className="font-semibold">
                        {d.full_name}
                      </TableCell>
                      <TableCell>{d.specialization ?? "-"}</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {d.phone ?? "-"}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {d.email ?? "-"}
                      </TableCell>
                      <TableCell>{formatDate(d.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredDoctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm">
                    No doctors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
