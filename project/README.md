# SOC Dashboard - Security Operations Center

A comprehensive, real-time Security Operations Center (SOC) dashboard built with React, Node.js, and MySQL. This application provides advanced threat monitoring, incident response management, and security analytics capabilities designed for enterprise security operations.

## 🚀 Features

### Core Security Operations
- **Real-time Threat Monitoring** - Live security event stream with WebSocket updates
- **Interactive Geographical Threat Map** - Visual representation of global threat origins
- **Comprehensive Incident Response** - Full incident lifecycle management with playbooks
- **Advanced Security Analytics** - Vulnerability management and compliance monitoring
- **Asset Inventory Management** - Complete asset tracking with vulnerability correlation

### Technical Capabilities
- **Real-time Data Updates** - WebSocket-powered live dashboard updates
- **Role-Based Access Control** - Administrator, SOC Analyst, and SOC Manager roles
- **Dark Mode Interface** - Professional dark theme optimized for SOC environments
- **Responsive Design** - Optimized for desktop, tablet, and mobile viewing
- **Data Export Functionality** - CSV/PDF export capabilities for reports
- **MySQL Database Integration** - Robust data persistence and querying

### Security Features
- **JWT Authentication** - Secure token-based authentication system
- **Session Management** - Secure session handling with automatic expiration
- **Input Validation** - Comprehensive input sanitization and validation
- **SQL Injection Protection** - Parameterized queries and prepared statements

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Interactive data visualizations
- **React Leaflet** - Interactive mapping capabilities
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MySQL2** - MySQL database driver
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing

### Database
- **MySQL** - Relational database management system
- **Automatic Schema Creation** - Database tables created on first run
- **Sample Data Generation** - Realistic demo data for testing

## 📋 Prerequisites

Before running the SOC Dashboard, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **MySQL** (version 8.0 or higher)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd soc-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure MySQL Database

#### Option A: Local MySQL Installation
1. Install MySQL on your system
2. Create a MySQL user (or use root)
3. Update database configuration in `server/index.js`:
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'your-mysql-username',
  password: 'your-mysql-password',
  port: 3306
};
```

#### Option B: MySQL Docker Container
```bash
# Run MySQL in Docker
docker run --name soc-mysql -e MYSQL_ROOT_PASSWORD=password123 -p 3306:3306 -d mysql:8.0

# Update server/index.js with:
# password: 'password123'
```

### 4. Start the Application
```bash
# Start both backend server and frontend development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔐 Default Login Credentials

The application comes with pre-configured demo accounts:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Administrator | `admin` | `password123` | Full system access |
| SOC Analyst | `analyst1` | `password123` | Monitoring and analysis |
| SOC Manager | `manager1` | `password123` | Management and reporting |

## 📊 Database Schema

The application automatically creates the following tables:

### Core Tables
- **users** - User accounts and authentication
- **alerts** - Security alerts and events
- **incidents** - Security incidents and responses
- **assets** - IT asset inventory
- **playbooks** - Incident response procedures

### Supporting Tables
- **incident_alerts** - Links alerts to incidents
- **incident_comments** - Incident notes and updates
- **vulnerabilities** - Asset vulnerability data
- **compliance_frameworks** - Compliance monitoring
- **threat_indicators** - Threat intelligence data

## 🎯 Key Features Walkthrough

### 1. Security Overview Dashboard
- Real-time security metrics and KPIs
- Threat level indicators with dynamic updates
- Interactive charts showing alert trends
- Top security events and incident summaries

### 2. Real-time Threat Monitoring
- Live security event stream with filtering
- Interactive world map showing attack origins
- Advanced search and filtering capabilities
- Detailed event drill-down with full context

### 3. Incident Response Management
- Complete incident lifecycle tracking
- Response playbook integration
- Team collaboration with comments
- SLA tracking and escalation procedures

### 4. Security Analytics & Reporting
- Vulnerability management dashboard
- Asset inventory with risk correlation
- Compliance framework monitoring
- Threat intelligence integration

## 🔧 Configuration Options

### Environment Variables
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-secret-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Real-time Data Simulation
The application includes a real-time alert generator for demonstration purposes. This can be configured in `server/index.js`:

```javascript
// Adjust simulation frequency (milliseconds)
setInterval(async () => {
  // Generate alerts every 10 seconds
}, 10000);
```

## 📈 Performance Considerations

### Database Optimization
- Indexed columns for fast querying
- Optimized JOIN operations
- Connection pooling for scalability

### Frontend Performance
- Component lazy loading
- Efficient state management
- Optimized re-rendering with React.memo

### Real-time Updates
- WebSocket connection management
- Efficient data synchronization
- Automatic reconnection handling

## 🛡 Security Best Practices

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control (RBAC)
- Secure password hashing with bcrypt

### Data Protection
- SQL injection prevention
- XSS protection
- CSRF token validation
- Input sanitization and validation

### Network Security
- HTTPS enforcement (production)
- CORS configuration
- Rate limiting (recommended for production)

## 🚀 Production Deployment

### Database Setup
1. Create production MySQL database
2. Configure connection pooling
3. Set up database backups
4. Configure SSL connections

### Application Deployment
1. Build the frontend: `npm run build`
2. Configure environment variables
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificates
5. Set up monitoring and logging

### Recommended Production Stack
- **Web Server**: Nginx
- **Process Manager**: PM2
- **Database**: MySQL 8.0+
- **SSL**: Let's Encrypt
- **Monitoring**: Prometheus + Grafana

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check MySQL service status
sudo systemctl status mysql

# Verify connection parameters
mysql -u root -p -h localhost
```

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :3001  # Backend port
lsof -i :5173  # Frontend port
```

#### WebSocket Connection Issues
- Verify firewall settings
- Check proxy configuration
- Ensure CORS settings are correct

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=soc-dashboard:*
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout

### Dashboard Data
- `GET /api/dashboard/overview` - Main dashboard metrics
- `GET /api/alerts` - Security alerts with filtering
- `GET /api/incidents` - Security incidents
- `GET /api/assets` - Asset inventory

### Real-time Events
- WebSocket connection on `/socket.io`
- Event: `new-alert` - Real-time alert notifications
- Event: `incident-update` - Incident status changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the configuration documentation

## 🔮 Future Enhancements

- Machine learning-based threat detection
- Advanced threat hunting capabilities
- Integration with SIEM platforms
- Mobile application for on-call response
- Advanced reporting and analytics
- Multi-tenant architecture support

---

**SOC Dashboard** - Empowering security operations with real-time intelligence and comprehensive incident response capabilities.