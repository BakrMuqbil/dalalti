# Dalalti

**Dalalti (دلالتي)** is a multi-store e-commerce platform that enables store owners to create and manage their online stores and allows customers to browse products, add them to a shopping cart, and place orders through a mobile-friendly storefront.

The project is designed with a focus on simplicity, Arabic/RTL support, responsive interfaces, and a clear separation between the public storefront, store-owner dashboard, and platform administration.

---

## ✨ Main Features

### Customer Storefront

- Browse products and categories.
- View product details.
- Select product variants when available.
- Add products to the shopping cart.
- Update quantities and remove products from the cart.
- Proceed from the cart to checkout.
- Enter customer information.
- Enter structured shipping information.
- Submit an order.
- View order confirmation.
- Access customer order history.

### Store Owner Dashboard

Store owners can manage their store through a dedicated dashboard, including:

- Dashboard overview.
- Products.
- Categories.
- Orders.
- Customers.
- Store settings.

### Platform Administration

The platform includes an administration area for managing the platform itself:

- Admin dashboard.
- Subscription plans.
- Stores.

### Order Management

Orders contain information about:

- Customer.
- Products.
- Product variants.
- Quantities.
- Prices.
- Order status.
- Shipping address information.

Shipping information is stored as part of the order so that the address used when placing an order remains associated with that order.

---

## 🛠️ Technology Stack

Dalalti is built using modern web technologies:

- **Next.js** — Application framework.
- **React** — User interface.
- **TypeScript** — Type-safe development.
- **Prisma** — Database ORM.
- **PostgreSQL** — Relational database.
- **Supabase** — PostgreSQL/database hosting environment.
- **Zod** — Request and form validation.
- **Tailwind CSS** — UI styling.
- **Node.js / npm** — JavaScript runtime and package management.

---

## 🏗️ Application Architecture

The application is divided into three main areas.

### Public Storefront

```text
/[storeSlug]
```

This is the customer-facing store.

Typical pages include:

```text
/[storeSlug]
/[storeSlug]/products/...
/[storeSlug]/checkout
/[storeSlug]/account
/[storeSlug]/account/orders
```

### Store Owner Dashboard

```text
/store
```

The store owner area includes:

```text
/store/dashboard
/store/orders
/store/customers
/store/products
/store/categories
/store/settings
```

### Platform Administration

```text
/admin
```

The admin area is intended for platform-level management, including:

```text
/admin
/admin/plans
/admin/stores
```

---

## 📁 Project Structure

The main project structure is approximately:

```text
dalalti/
├── app/
│   ├── [storeSlug]/
│   │   ├── account/
│   │   ├── checkout/
│   │   └── ...
│   │
│   ├── admin/
│   │   ├── plans/
│   │   ├── stores/
│   │   └── ...
│   │
│   ├── api/
│   │   ├── admin/
│   │   ├── public/
│   │   └── store/
│   │
│   ├── store/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── products/
│   │   ├── categories/
│   │   └── settings/
│   │
│   ├── globals.css
│   └── ...
│
├── components/
│   ├── icons/
│   └── ...
│
├── lib/
│   ├── validation/
│   └── ...
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
├── package.json
├── next.config.*
├── tsconfig.json
└── README.md
```

The exact contents may change as the project evolves.

---

# 🚀 Getting Started

## Requirements

Before running Dalalti locally, install:

- Node.js
- npm
- PostgreSQL or access to a PostgreSQL database
- Git

A Supabase PostgreSQL database can be used instead of running PostgreSQL locally.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/BakrMuqbil/dalalti.git
```

Enter the project directory:

```bash
cd dalalti
```

Install dependencies:

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

The exact variables depend on the current application configuration. At minimum, the application requires a PostgreSQL database connection for Prisma.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

Do not commit `.env` or any file containing secrets to the repository.

For Supabase, use the appropriate PostgreSQL connection string provided by the Supabase project.

---

# 🗄️ Database Setup

Dalalti uses Prisma as its database ORM.

The Prisma schema is located at:

```text
prisma/schema.prisma
```

Generate the Prisma Client:

```bash
npx prisma generate
```

When working with a development database and Prisma migrations:

```bash
npx prisma migrate dev
```

To inspect the database visually:

```bash
npx prisma studio
```

The database uses PostgreSQL and can be hosted through Supabase.

---

# ▶️ Running the Application

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

Open the URL in a browser to access the application.

---

# 🧭 Basic Usage

## Customer

The typical customer journey is:

```text
Open Store
    ↓
Browse Products
    ↓
Open Product
    ↓
Select Variant (if available)
    ↓
Add to Cart
    ↓
Open Cart
    ↓
Checkout
    ↓
Enter Customer Information
    ↓
Enter Shipping Information
    ↓
Submit Order
    ↓
Order Confirmation
```

---

## Store Owner

A store owner uses the dashboard to manage the store:

```text
Store Dashboard
    ├── Products
    ├── Categories
    ├── Orders
    ├── Customers
    └── Settings
```

Orders received through the public storefront are available through the store owner's order management interface.

---

## Platform Administrator

The administrator manages platform-level resources through:

```text
/admin
```

The admin area is separate from the store owner's dashboard.

---

# 🛒 Shopping Cart

The shopping cart is part of the public storefront.

Customers can:

- Add products.
- Select variants where applicable.
- Change quantities.
- Remove products.
- Review the order before checkout.

The cart is maintained on the client side and is used to build the checkout order.

---

# 📦 Checkout and Orders

Checkout collects the information required to create a customer order.

The current shipping-address model contains structured fields such as:

```text
shippingCity
shippingDistrict
shippingAddress
shippingNotes
```

The shipping address is stored with the order rather than relying exclusively on the customer's current profile address.

This prevents a later customer-address change from replacing the shipping information associated with an existing order.

---

# 🔌 API Structure

The project separates API endpoints according to their purpose.

### Public APIs

```text
/api/public/...
```

These APIs support functionality used by the public storefront and customers.

For example:

```text
/api/public/stores/[slug]/orders
```

is used for public order creation and order-related operations.

### Store APIs

```text
/api/store/...
```

These APIs support store-owner functionality.

### Admin APIs

```text
/api/admin/...
```

These APIs support platform administration.

---

# 🧾 Data Model

The database is managed through Prisma.

Important entities include:

```text
Store
Customer
Order
OrderItem
Product
ProductVariant
Category
```

The relationships allow a store to manage its products, customers, and orders while keeping store data separated through store identifiers.

An order is associated with its store and customer and contains its order items.

---

# 🌐 Multi-Store Model

Dalalti uses a store-based URL structure.

A public store is accessed using its store slug:

```text
/[storeSlug]
```

This allows each store to have its own public storefront while the platform operates from a single application.

Conceptually:

```text
Dalalti Platform
│
├── Store A
│   └── /store-a
│
├── Store B
│   └── /store-b
│
└── Store C
    └── /store-c
```

Store data is associated with a specific `storeId` to maintain separation between stores.

---

# 📱 Responsive and RTL Design

The storefront and dashboards are designed to support responsive layouts, with particular attention to mobile usage.

The project also supports Arabic interfaces and right-to-left layouts.

UI components should maintain:

- RTL compatibility.
- Mobile usability.
- Consistent spacing.
- Accessible form controls.
- Clear loading and error states.

---

# 🔐 Security

Important security principles used throughout the application include:

- Server-side validation of incoming data.
- Server-side price calculation.
- Product validation before creating orders.
- Store ownership checks for store-level operations.
- Separation of public, store, and admin APIs.
- Environment variables for sensitive configuration.
- Database constraints and relations through Prisma.

Client-side values should not be trusted for sensitive business logic such as final prices or authorization.

---

# 🧪 Development

During development, useful commands include:

### Start development server

```bash
npm run dev
```

### TypeScript check

```bash
npx tsc --noEmit
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Prisma migrations

```bash
npx prisma migrate dev
```

### Open Prisma Studio

```bash
npx prisma studio
```

Available npm scripts can be viewed in:

```text
package.json
```

---

# 🏭 Production

Create a production build with:

```bash
npm run build
```

Start the production server with:

```bash
npm start
```

Before deploying, make sure that:

- Production environment variables are configured.
- The production database is accessible.
- Prisma Client has been generated.
- Required database migrations have been applied.
- Sensitive credentials are not committed to the repository.

---

# 🗃️ Database Hosting with Supabase

Supabase can be used as the PostgreSQL database provider.

The general setup is:

```text
Dalalti / Next.js
       │
       │ DATABASE_URL
       ▼
   Supabase
       │
       ▼
  PostgreSQL
```

The database connection string should be configured through the environment rather than hard-coded in the application.

---

# 🤝 Contributing

When modifying the project:

1. Keep changes focused on the feature being developed.
2. Follow the existing project structure.
3. Reuse existing components and utilities where appropriate.
4. Validate input on the server.
5. Avoid exposing secrets.
6. Check TypeScript before committing changes.
7. Test the affected user flow before deployment.

---

# 📄 License

The licensing terms for Dalalti should be defined by the project owner.

If the project is intended to be distributed publicly, add the appropriate license file and license information here.

---

## 📞 Project

**Dalalti — دلالتي**

A modern multi-store e-commerce platform for creating online storefronts and managing products, customers, and orders.
