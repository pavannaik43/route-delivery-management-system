# Hatsun Agro Products — Route Delivery Management System (RDMS)

A daily-operations enterprise web application designed for route-based FMCG & dairy distribution for **Hatsun Agro Products** (Arokya Milk, Hatsun Curd, Hatsun Pure Cow Ghee, Hatsun Paneer, Arun Icecreams).

---

## 🚀 Key Features & Modules

- **M1: Authentication & Role-Based Access Control (RBAC)**: Secure JWT authentication with strict server-side middleware and frontend route guards for `admin` and `delivery_staff`.
- **M2: Live Dispatch Dashboard**: Real-time KPI counters (Revenue, Deliveries, Units, Remaining Vehicle Stock), route progress tracker, category sales charts (Recharts), and low-stock alerts.
- **M3: Product Master Catalog**: Manage SKUs, categories (Milk, Curd, Ghee, Paneer, Ice Cream, etc.), unit packaging, MRP, wholesale delivery rates, margins, and active/inactive availability.
- **M4: Retailer & Route Management**: Directory of retail shops grouped by delivery routes (Anna Nagar, T Nagar, Velachery), shopkeeper contact info, click-to-call, and delivery order history.
- **M5: Morning Vehicle Stock Loading**: Select loading date, configure physical truck stock with load presets, enforcing **Business Rule #1** (one load event per product per day, with Admin edit capability).
- **M6: Field Delivery Execution**: Select retail shop on route, dynamic line items with **live vehicle stock limit validation**, price calculation, and **atomic ACID transaction**.
- **M7: Real-Time Stock Engine**: Derived stock computation (`Loaded - Delivered = Remaining`), stock health status badges (In Stock, Low Stock, Out of Stock, Not Loaded), and depletion progress bars.
- **M8: Auto-Invoicing & PDF Export**: Every saved delivery generates a sequential GST tax invoice (`INV-YYYYMMDD-####`) with itemized details, amount in words, thermal print layout, and PDF download.
- **M9: End of Day (EOD) Reconciliation**: Complete daily settlement report: total revenue collected, deliveries count, top-selling product, and product-by-product return-to-depot manifest.
- **M10: Analytics & Performance Reports**: Admin business intelligence suite with interactive charts for Daily Sales Trends, Monthly Performance, Product Performance, and Retailer Spend Rankings + CSV Export.
- **User Management**: Admin-only user administration with role assignments and password management.

---

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, TanStack React Query, React Router v6, Recharts, jsPDF, html2canvas.
- **Backend**: Node.js, Express, SQLite (`sql.js`), JWT, bcryptjs, CORS, Dotenv.
- **Typography & Theme**: Google Font `Poppins` with Hatsun blue palette (`#005BAC`, `#0077CC`, `#F8FAFC`).

---

## 🏃 Running the Application

### 1. Start the Backend API
```bash
cd backend
npm install
npm run seed      # Populates authentic Hatsun products, shops, routes, and credentials
npm start         # Runs on http://localhost:5000
```

### 2. Start the Frontend App
```bash
cd frontend
npm install
npm run dev       # Runs on http://localhost:3000
```

---

## 📐 Business Rules Enforced

1. **Once-per-Day Loading**: A product can only be loaded onto a vehicle once per calendar day. Administrators can adjust existing load quantities after dispatch.
2. **Strict Non-Negative Stock**: A delivery cannot dispatch more units of a product than currently remaining on the vehicle (`Loaded − Already Delivered`).
3. **Atomic Delivery & Invoicing**: Deliveries and tax invoices are created in a single ACID database transaction. No delivery exists without an invoice.
4. **Immediate Real-Time Decrementation**: Stock levels update immediately upon delivery commit without manual reconciliation.
