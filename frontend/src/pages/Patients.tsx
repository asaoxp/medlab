import { useMemo, useState, useEffect } from "react";
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
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Patient,
  fetchPatients,
  createPatient,
  CreatePatientPayload,
  updatePatient,
  UpdatePatientPayload,
  deletePatient,
} from "@/lib/api";

// Helper: calculate age
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

function formatGender(g: Patient["gender"]): string {
  if (g === "M") return "Male";
  if (g === "F") return "Female";
  if (g === "O") return "Other";
  return "-";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Add form
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female" | "other">("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Edit
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState<"" | "male" | "female" | "other">("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");

  // NEW: View Patient Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  const queryClient = useQueryClient();

  // Load data
  const {
    data: patients,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  // Create patient
  const createMutation = useMutation({
    mutationFn: (payload: CreatePatientPayload) => createPatient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setFullName("");
      setDateOfBirth("");
      setGender("");
      setPhone("");
      setEmail("");
      setAddress("");
      setIsDialogOpen(false);
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePatientPayload }) =>
      updatePatient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setEditDialogOpen(false);
      setEditingPatient(null);
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const handleSavePatient = () => {
    if (!fullName.trim()) {
      alert("Full name is required");
      return;
    }

    createMutation.mutate({
      fullName: fullName.trim(),
      dateOfBirth: dateOfBirth || null,
      gender: gender || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
    });
  };

  // Prepare edit form
  useEffect(() => {
    if (!editingPatient) return;
    setEditFullName(editingPatient.full_name);
    setEditDob(editingPatient.date_of_birth ? editingPatient.date_of_birth.slice(0, 10) : "");

    let g: "" | "male" | "female" | "other" = "";
    if (editingPatient.gender === "M") g = "male";
    else if (editingPatient.gender === "F") g = "female";
    else if (editingPatient.gender === "O") g = "other";

    setEditGender(g);
    setEditPhone(editingPatient.phone ?? "");
    setEditEmail(editingPatient.email ?? "");
    setEditAddress(editingPatient.address ?? "");
  }, [editingPatient]);

  const handleSaveEdit = () => {
    if (!editingPatient) return;
    if (!editFullName.trim()) {
      alert("Full name is required");
      return;
    }

    const payload: UpdatePatientPayload = {
      fullName: editFullName.trim(),
      dateOfBirth: editDob || null,
      gender: editGender || undefined,
      phone: editPhone || null,
      email: editEmail || null,
      address: editAddress || null,
    };

    updateMutation.mutate({ id: editingPatient.patient_id, payload });
  };

  // Search filter
  const filteredPatients = useMemo(() => {
    const list = patients ?? [];
    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter((p) => {
      const name = p.full_name?.toLowerCase() ?? "";
      const phoneVal = p.phone ?? "";
      return name.includes(term) || phoneVal.includes(searchTerm);
    });
  }, [patients, searchTerm]);

  // View Dialog
  const handleViewPatient = (p: Patient) => {
    setViewingPatient(p);
    setViewDialogOpen(true);
  };

  const handleEditPatientClick = (p: Patient) => {
    setEditingPatient(p);
    setEditDialogOpen(true);
  };

  const handleDeletePatientClick = (p: Patient) => {
    if (!window.confirm(`Are you sure you want to delete patient "${p.full_name}"?`)) return;
    deleteMutation.mutate(p.patient_id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage patient records</p>
        </div>

        {/* Add Patient Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>Enter patient information to create a new record</DialogDescription>
            </DialogHeader>

            {/* Add Form */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={(val) => setGender(val as any)}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePatient}>
                {createMutation.isPending ? "Saving..." : "Save Patient"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
            </DialogHeader>

            {editingPatient ? (
              <>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gender</Label>
                      <Select value={editGender} onValueChange={(val) => setEditGender(val as any)}>
                        <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveEdit}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </>
            ) : (
              <p>No patient selected.</p>
            )}
          </DialogContent>
        </Dialog>

        {/* VIEW PATIENT DIALOG (NEW) */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Patient Details</DialogTitle>
              <DialogDescription>Information about the selected patient</DialogDescription>
            </DialogHeader>

            {viewingPatient ? (
              <div className="space-y-3 py-2">
                <p><b>Name:</b> {viewingPatient.full_name}</p>
                <p><b>Age:</b> {calculateAge(viewingPatient.date_of_birth ?? null) ?? "-"}</p>
                <p><b>Gender:</b> {formatGender(viewingPatient.gender)}</p>
                <p><b>Phone:</b> {viewingPatient.phone ?? "-"}</p>
                <p><b>Email:</b> {viewingPatient.email ?? "-"}</p>
                <p><b>Address:</b> {viewingPatient.address ?? "-"}</p>
                <p><b>Created At:</b> {formatDate(viewingPatient.created_at)}</p>
              </div>
            ) : (
              <p>No data</p>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Patients</CardTitle>
          <CardDescription>Find patients by name or phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input className="pl-10" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `Total patients: ${filteredPatients.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!isLoading &&
                filteredPatients.map((patient) => {
                  const age = calculateAge(patient.date_of_birth ?? null);
                  const idLabel = `P${String(patient.patient_id).padStart(3, "0")}`;

                  return (
                    <TableRow key={patient.patient_id}>
                      <TableCell>{idLabel}</TableCell>
                      <TableCell>{patient.full_name}</TableCell>
                      <TableCell>{age ?? "-"}</TableCell>
                      <TableCell>{formatGender(patient.gender)}</TableCell>
                      <TableCell>{patient.phone ?? "-"}</TableCell>
                      <TableCell>{patient.email ?? "-"}</TableCell>
                      <TableCell>{formatDate(patient.created_at)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* VIEW */}
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                            onClick={() => handleViewPatient(patient)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* EDIT */}
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                            onClick={() => handleEditPatientClick(patient)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* DELETE */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePatientClick(patient)}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
