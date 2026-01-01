// frontend/src/lib/api.ts

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ---------- Dashboard ----------

export type OrdersLast7DayItem = {
  date: string;
  count: number;
};

export type DashboardStats = {
  ordersToday: number;
  ordersYesterday: number;
  pendingReports: number;
  urgentPendingReports: number;
  completedReports: number;
  completedYesterday: number;
  totalPatients: number;
  newPatientsThisWeek: number;
};

export type DashboardResponse = {
  stats: DashboardStats;
  ordersLast7Days: OrdersLast7DayItem[];
};

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`);

  if (!res.ok) {
    throw new Error(`Dashboard fetch failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as DashboardResponse;
}

// ---------- Patients ----------

export type Patient = {
  patient_id: number;
  full_name: string;
  date_of_birth: string | null;
  gender: "M" | "F" | "O" | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
};

export type CreatePatientPayload = {
  fullName: string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | "";
  phone?: string;
  email?: string;
  address?: string;
};

export type UpdatePatientPayload = {
  fullName?: string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | "";
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE_URL}/api/patients`);

  if (!res.ok) {
    throw new Error(`Patients fetch failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as Patient[];
}

export async function createPatient(
  payload: CreatePatientPayload
): Promise<Patient> {
  const res = await fetch(`${API_BASE_URL}/api/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create patient failed: ${res.status} ${text}`);
  }

  return (await res.json()) as Patient;
}

export async function updatePatient(
  id: number,
  payload: UpdatePatientPayload
): Promise<Patient> {
  const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update patient failed: ${res.status} ${text}`);
  }

  return (await res.json()) as Patient;
}

export async function deletePatient(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete patient failed: ${res.status} ${text}`);
  }
}

// ---------- Tests & Doctors ----------

export type TestItem = {
  test_id: number;
  test_name: string;
  sample_type: string | null;
  unit: string | null;
  price: number;
  category_name: string | null;
  any_range_text: string | null;
  male_range_text: string | null;
  female_range_text: string | null;
};

export async function fetchTests(): Promise<TestItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/tests`);
  if (!res.ok) {
    throw new Error(`Tests fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as TestItem[];
}

export type CreateTestPayload = {
  testName: string;
  sampleType?: string;
  unit?: string;
  normalMin?: number | null;
  normalMax?: number | null;
  price: number;
};

export async function createTest(
  payload: CreateTestPayload
): Promise<TestItem> {
  const res = await fetch(`${API_BASE_URL}/api/tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create test failed: ${res.status} ${text}`);
  }
  return (await res.json()) as TestItem;
}

export type DoctorItem = {
  doctor_id: number;
  full_name: string;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export async function fetchDoctors(): Promise<DoctorItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/doctors`);
  if (!res.ok) {
    throw new Error(`Doctors fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as DoctorItem[];
}

export type CreateDoctorPayload = {
  fullName: string;
  specialization?: string;
  phone?: string;
  email?: string;
};

export async function createDoctor(
  payload: CreateDoctorPayload
): Promise<DoctorItem> {
  const res = await fetch(`${API_BASE_URL}/api/doctors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create doctor failed: ${res.status} ${text}`);
  }
  return (await res.json()) as DoctorItem;
}

// ---------- Orders ----------

export type OrderListItem = {
  order_id: number;
  patient_name: string;
  order_date: string | null;
  tests_count: number;
  priority: "normal" | "urgent";
  status: "pending" | "in-progress" | "completed";
};

export async function fetchOrders(): Promise<OrderListItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/orders`);

  if (!res.ok) {
    throw new Error(`Orders fetch failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as OrderListItem[];
}

export type CreateOrderPayload = {
  patientId: number;
  doctorId?: number | null;
  priority: "normal" | "urgent";
  notes?: string;
  testIds: number[];
};

export async function createOrder(
  payload: CreateOrderPayload
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create order failed: ${res.status} ${text}`);
  }

  return await res.json();
}

export type OrderTestItem = {
  test_id: number;
  test_name: string;
  unit: string | null;
  normal_range_text: string | null;
  price: number;
};

export type OrderDetail = {
  order_id: number;
  order_date: string | null;
  priority: "normal" | "urgent";
  status: "pending" | "in-progress" | "completed";
  total_amount: number;
  notes: string | null;
  patient_id: number;
  patient_name: string;
  patient_dob: string | null;
  patient_gender: "M" | "F" | "O" | null;
  doctor_id: number | null;
  doctor_name: string | null;
  doctor_specialization: string | null;
  tests: OrderTestItem[];
};

export async function fetchOrderDetail(
  orderId: number
): Promise<OrderDetail> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch order detail failed: ${res.status} ${text}`);
  }
  return (await res.json()) as OrderDetail;
}

export type UpdateOrderPayload = {
  priority?: "normal" | "urgent";
  status?: "pending" | "in-progress" | "completed";
  notes?: string | null;
};

export async function updateOrder(
  orderId: number,
  payload: UpdateOrderPayload
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update order failed: ${res.status} ${text}`);
  }
}


// ---------- Update Test Results ----------
export type TestResultUpdateItem = {
  testId: number;
  value: number | null;
};

export type UpdateResultsPayload = {
  results: TestResultUpdateItem[];
  markCompleted?: boolean; // optional flag
};

export async function updateOrderResults(
  orderId: number,
  payload: UpdateResultsPayload
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/results`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update results failed: ${res.status} ${text}`);
  }
}




// ---------- Reports ----------

export type ReportListItem = {
  order_id: number;
  patient_name: string;
  order_date: string | null;
  priority: "normal" | "urgent";
  status: "completed";
  total_amount: number;
};

export async function fetchReports(): Promise<ReportListItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/reports`);
  if (!res.ok) {
    throw new Error(`Reports fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ReportListItem[];
}

// ---------- Activity ----------

export type ActivityLogItem = {
  log_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string | null;
  created_at: string;
};

export async function fetchActivity(
  limit = 50
): Promise<ActivityLogItem[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/activity?limit=${encodeURIComponent(String(limit))}`
  );
  if (!res.ok) {
    throw new Error(`Activity fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ActivityLogItem[];
}

// ---------- Settings ----------

export type SettingsResponse = {
  settings: Record<string, string>;
};

export type UpdateSettingsPayload = {
  settings: Record<string, string>;
};

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/settings`);
  if (!res.ok) {
    throw new Error(`Settings fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SettingsResponse;
}

export async function updateSettings(
  payload: UpdateSettingsPayload
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update settings failed: ${res.status} ${text}`);
  }
}

// ---------- SQL Demo ----------

export type SqlDemoResponse = {
  columns: string[];
  rows: any[][];
  rowCount: number;
  timeMs: number;
};

export async function runSqlDemo(query: string): Promise<SqlDemoResponse> {
  const res = await fetch(`${API_BASE_URL}/api/sql-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `SQL demo failed: ${res.status}`);
  }

  return JSON.parse(text) as SqlDemoResponse;
}
