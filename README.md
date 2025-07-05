# Forest Management WebGIS System

A comprehensive WebGIS admin system for forest management in Hai Phong province. The system provides tools for monitoring forest health, tracking observation points, and managing forest data.

## Features

- 🌳 Forest data management with GeoJSON support
- 📍 Monitoring points tracking
- 📊 Forest health indices visualization
- 🗺️ Interactive map interface
- 🌙 Dark mode support
- 📱 Responsive design
- 🔒 Secure JWT authentication

## Tech Stack

### Frontend
- React with Vite
- React Router for navigation
- Chart.js for data visualization
- Leaflet for map integration
- CSS Modules for styling
- Axios for API requests

### Backend
- Node.js + Express
- MongoDB for data storage
- JWT for authentication
- GeoJSON support

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/webgis-forest-management.git
cd webgis-forest-management
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/forest_management
JWT_SECRET=your_jwt_secret_here
```

5. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
```

### Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
# In the root directory
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
cd backend
npm start
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── ForestMap/
│   │   ├── Layout/
│   │   ├── Login/
│   │   ├── MonitoringPoints/
│   │   └── ForestStatus/
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
