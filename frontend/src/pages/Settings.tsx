import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  fetchSettings,
  updateSettings,
  SettingsResponse,
  UpdateSettingsPayload,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

type SettingsForm = {
  lab_name: string;
  lab_address: string;
  lab_phone: string;
  lab_email: string;
  report_footer: string;
  db_host: string;
  db_port: string;
  db_name: string;
  db_user: string;
  db_password: string;
};

const defaultForm: SettingsForm = {
  lab_name: "",
  lab_address: "",
  lab_phone: "",
  lab_email: "",
  report_footer: "",
  db_host: "localhost",
  db_port: "3306",
  db_name: "",
  db_user: "",
  db_password: "",
};

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(defaultForm);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (!data) return;
    const settings = (data as SettingsResponse).settings;
    setForm((prev) => ({
      ...prev,
      lab_name: settings.lab_name ?? prev.lab_name,
      lab_address: settings.lab_address ?? prev.lab_address,
      lab_phone: settings.lab_phone ?? prev.lab_phone,
      lab_email: settings.lab_email ?? prev.lab_email,
      report_footer: settings.report_footer ?? prev.report_footer,
      db_host: settings.db_host ?? prev.db_host,
      db_port: settings.db_port ?? prev.db_port,
      db_name: settings.db_name ?? prev.db_name,
      db_user: settings.db_user ?? prev.db_user,
      db_password: settings.db_password ?? prev.db_password,
    }));
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({
        title: "Settings saved",
        description: "Configuration has been updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleChange =
    (field: keyof SettingsForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateSettingsPayload = {
      settings: {
        lab_name: form.lab_name,
        lab_address: form.lab_address,
        lab_phone: form.lab_phone,
        lab_email: form.lab_email,
        report_footer: form.report_footer,
        db_host: form.db_host,
        db_port: form.db_port,
        db_name: form.db_name,
        db_user: form.db_user,
        db_password: form.db_password,
      },
    };
    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure lab identity and database connection metadata
        </p>
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">
              Failed to load settings:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lab info */}
          <Card>
            <CardHeader>
              <CardTitle>Lab Information</CardTitle>
              <CardDescription>
                Details shown on reports and system headers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lab_name">Lab Name</Label>
                <Input
                  id="lab_name"
                  value={form.lab_name}
                  onChange={handleChange("lab_name")}
                  placeholder="MedLAB+ Diagnostics"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab_address">Address</Label>
                <Input
                  id="lab_address"
                  value={form.lab_address}
                  onChange={handleChange("lab_address")}
                  placeholder="123 Health Street, City"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lab_phone">Phone</Label>
                  <Input
                    id="lab_phone"
                    value={form.lab_phone}
                    onChange={handleChange("lab_phone")}
                    placeholder="+91-98765-43210"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lab_email">Email</Label>
                  <Input
                    id="lab_email"
                    value={form.lab_email}
                    onChange={handleChange("lab_email")}
                    placeholder="support@medlabplus.local"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report_footer">Report Footer</Label>
                <Input
                  id="report_footer"
                  value={form.report_footer}
                  onChange={handleChange("report_footer")}
                  placeholder="This is a computer-generated report..."
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* DB info (metadata) */}
          <Card>
            <CardHeader>
              <CardTitle>Database Connection</CardTitle>
              <CardDescription>
                Stored for reference; actual connection uses server config.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db_host">Host</Label>
                  <Input
                    id="db_host"
                    value={form.db_host}
                    onChange={handleChange("db_host")}
                    placeholder="localhost"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db_port">Port</Label>
                  <Input
                    id="db_port"
                    value={form.db_port}
                    onChange={handleChange("db_port")}
                    placeholder="3306"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="db_name">Database Name</Label>
                <Input
                  id="db_name"
                  value={form.db_name}
                  onChange={handleChange("db_name")}
                  placeholder="medlab_db"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db_user">Username</Label>
                <Input
                  id="db_user"
                  value={form.db_user}
                  onChange={handleChange("db_user")}
                  placeholder="medlab_user"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db_password">Password</Label>
                <Input
                  id="db_password"
                  type="password"
                  value={form.db_password}
                  onChange={handleChange("db_password")}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="gap-2"
            disabled={isLoading || updateMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
