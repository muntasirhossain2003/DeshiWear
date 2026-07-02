# DeshiWear

DeshiWear is a modern e-commerce platform specializing in traditional and contemporary Bangladeshi fashion. Built with cutting-edge technologies to provide a seamless shopping experience.

## 🚀 Features

- Responsive design for all devices
- Modern and intuitive user interface
- Fast and reliable worldwide shipping
- Social media integration
- Real-time customer support

## 🛠️ Tech Stack

### Frontend

- React.js with Vite
- Tailwind CSS for styling
- React Icons for UI elements
- Responsive design principles

### Backend

- Node.js + Express REST API
- MongoDB with Mongoose (embedded dev DB, Atlas-ready)
- JWT authentication (customer/admin roles)
- Cash on Delivery orders with Dhaka-aware delivery charges

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/muntasirhossain2003/DeshiWear.git
cd DeshiWear
```

2. Start the backend (API on http://localhost:9002 — an embedded MongoDB starts automatically, no install needed):

```bash
cd backend
npm install
npm run seed   # first time only: loads 20 products + admin account
npm run dev
```

3. Start the frontend (http://localhost:5173) in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Admin login: `admin@deshiwear.com` / `admin123` → then visit `/admin`.

For a real database, set `MONGO_URI` in `backend/.env` to a MongoDB Atlas connection string.

## 🌐 Environment Setup

Make sure you have the following installed:

- Node.js (Latest LTS version)
- npm (comes with Node.js)

## 📞 Contact

For support or inquiries:

- Phone: (+880) 1748 004936
- email: muntasirhossain2003@gmail.com

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](#).

## 📜 License

[Add your license information]

---

Made with ❤️ in Bangladesh
