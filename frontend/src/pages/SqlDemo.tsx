import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Clock, Database, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { runSqlDemo, SqlDemoResponse } from "@/lib/api";

const sampleQueries = [
  {
    name: "All Patients",
    query: "SELECT * FROM patients LIMIT 10;",
  },
  {
    name: "Today's Orders",
    query: "SELECT * FROM test_orders WHERE DATE(order_date) = CURDATE();",
  },
  {
    name: "Pending Reports",
    query: "SELECT * FROM test_orders WHERE status = 'PENDING';",
  },
  {
    name: "Patient Count",
    query: "SELECT COUNT(*) AS total_patients FROM patients;",
  },
];

export default function SqlDemo() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SqlDemoResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  const handleRunQuery = async () => {
    setError("");
    setResults(null);
    setExecutionTime(0);

    const trimmed = query.trim();
    if (!trimmed) return;

    const lowered = trimmed.toLowerCase();
    if (!lowered.startsWith("select")) {
      setError("Only SELECT queries are allowed for demonstration purposes.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await runSqlDemo(trimmed);
      setResults(res);
      setExecutionTime(res.timeMs);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "Failed to execute query.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    setResults(null);
    setError("");
    setExecutionTime(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          SQL Query Demo Console
        </h1>
        <p className="text-muted-foreground mt-1">
          For demonstration purposes - Only SELECT queries are allowed
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This console is designed for project demonstration and educational
          purposes. Only SELECT statements are permitted to ensure database
          safety.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Query Editor
              </CardTitle>
              <CardDescription>Enter your SQL SELECT query below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM patients LIMIT 10;"
                className="font-mono text-sm min-h-[150px]"
              />
              <div className="flex justify-between items-center">
                <Button
                  onClick={handleRunQuery}
                  disabled={!query.trim() || isLoading}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isLoading ? "Running..." : "Run Query"}
                </Button>
                {executionTime > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Execution time: {executionTime}ms
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Query Results</CardTitle>
                <CardDescription>
                  Rows returned: {results.rowCount} | Time: {results.timeMs}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {results.columns.map((column) => (
                          <TableHead key={column} className="font-semibold">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.rows.map((row, index) => (
                        <TableRow key={index}>
                          {row.map((cell, cellIndex) => (
                            <TableCell
                              key={cellIndex}
                              className="font-mono text-sm"
                            >
                              {String(cell)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sample Queries</CardTitle>
              <CardDescription>Click to load a sample query</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sampleQueries.map((sample, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => loadSampleQuery(sample.query)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{sample.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {sample.query}
                    </p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Info</CardTitle>
              <CardDescription>Available tables and schemas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-foreground">patients</p>
                  <p className="text-xs text-muted-foreground">
                    patient_id, full_name, date_of_birth, gender, phone, email,
                    address
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">test_orders</p>
                  <p className="text-xs text-muted-foreground">
                    order_id, patient_id, doctor_id, order_date, priority,
                    status, total_amount
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">tests</p>
                  <p className="text-xs text-muted-foreground">
                    test_id, test_name, category_id, sample_type, unit,
                    normal_min, normal_max, price
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">doctors</p>
                  <p className="text-xs text-muted-foreground">
                    doctor_id, full_name, specialization, phone, email
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
