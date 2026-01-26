# SolarNova Backend

The SolarNova Backend is an Express-based API server that powers the SolarNova ecosystem. It handles user authentication, solar unit management, invoice generation, and anomaly detection logic.

## 🚀 Features

- **RESTful API**: Clean and well-documented endpoints for frontend integration.
- **Authentication & Authorization**: Secure access control using Clerk and RBAC.
- **Automated Invoicing**: Scheduled jobs for generating monthly invoices based on energy usage.
- **Anomaly Detection**: Logic for identifying and flagging irregular energy production data.
- **Database Integration**: Robust data persistence using MongoDB and Mongoose.
- **Payment Processing**: Integration with Stripe for secure billing and payments.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Scheduling**: [Node-cron](https://www.npmjs.com/package/node-cron)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   CLERK_SECRET_KEY=your_clerk_secret_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Scripts

- `npm run dev`: Starts the server with Nodemon and TSX.
- `npm run build`: Builds the project using Tsup.
- `npm run start`: Starts the production build.
- `npm run seed`: Seeds the database with initial data.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
