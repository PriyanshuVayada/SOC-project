/**
 * SOC Dashboard Backend Server
 * 
 * This is the main server file that handles:
 * - MySQL database connection and automatic schema creation
 * - Real-time WebSocket communication for live dashboard updates
 * - JWT-based authentication and role-based access control
 * - RESTful API endpoints for all dashboard data
 * - Automatic data generation for demonstration purposes
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Server configuration
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'soc-dashboard-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Update with your MySQL password
  port: 3306
};

let db;

/**
 * Initialize MySQL database connection and create SOC_Dashboard database if it doesn't exist
 */
async function initializeDatabase() {
  try {
    // Connect to MySQL server without specifying database
    const connection = await mysql.createConnection(dbConfig);
    
    // Create SOC_Dashboard database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS SOC_Dashboard');
    console.log('✅ SOC_Dashboard database created or already exists');
    
    await connection.end();
    
    // Connect to the SOC_Dashboard database
    db = await mysql.createConnection({
      ...dbConfig,
      database: 'SOC_Dashboard'
    });
    
    console.log('✅ Connected to SOC_Dashboard database');
    
    // Create tables if they don't exist
    await createTables();
    
    // Initialize sample data
    await initializeSampleData();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Create all required tables for the SOC Dashboard
 */
async function createTables() {
  const tables = [
    // Users table for authentication and role management
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('Administrator', 'SOC Analyst', 'SOC Manager') DEFAULT 'SOC Analyst',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE
    )`,
    
    // Security alerts table - core data for threat monitoring
    `CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alert_type VARCHAR(255) NOT NULL,
      severity ENUM('Critical', 'High', 'Medium', 'Low', 'Informational') NOT NULL,
      source_ip VARCHAR(45),
      destination_ip VARCHAR(45),
      source_port INT,
      destination_port INT,
      protocol VARCHAR(20),
      description TEXT,
      raw_event JSON,
      status ENUM('New', 'Assigned', 'In Progress', 'Resolved', 'False Positive') DEFAULT 'New',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      assigned_to INT,
      country_code VARCHAR(2),
      city VARCHAR(255),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`,
    
    // Security incidents table for incident response management
    `CREATE TABLE IF NOT EXISTS incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
      status ENUM('New', 'Assigned', 'In Progress', 'Resolved', 'Closed') DEFAULT 'New',
      assignee_id INT,
      reporter_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      root_cause TEXT,
      remediation_steps TEXT,
      alert_count INT DEFAULT 0,
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    )`,
    
    // Link alerts to incidents (many-to-many relationship)
    `CREATE TABLE IF NOT EXISTS incident_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      incident_id INT NOT NULL,
      alert_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
      UNIQUE KEY unique_incident_alert (incident_id, alert_id)
    )`,
    
    // Assets inventory for asset management
    `CREATE TABLE IF NOT EXISTS assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45),
      asset_type ENUM('Server', 'Endpoint', 'Network Device', 'Cloud Resource') NOT NULL,
      operating_system VARCHAR(255),
      criticality ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
      owner VARCHAR(255),
      location VARCHAR(255),
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      vulnerability_count INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE
    )`,
    
    // Vulnerabilities for vulnerability management
    `CREATE TABLE IF NOT EXISTS vulnerabilities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      asset_id INT NOT NULL,
      cve_id VARCHAR(20),
      severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
      description TEXT,
      discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      patched_at TIMESTAMP NULL,
      status ENUM('Open', 'Patched', 'Mitigated', 'Accepted Risk') DEFAULT 'Open',
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    )`,
    
    // Incident response playbooks
    `CREATE TABLE IF NOT EXISTS playbooks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      incident_type VARCHAR(255),
      steps JSON,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    // Incident comments/notes
    `CREATE TABLE IF NOT EXISTS incident_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      incident_id INT NOT NULL,
      user_id INT NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    // Compliance frameworks and controls
    `CREATE TABLE IF NOT EXISTS compliance_frameworks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      total_controls INT DEFAULT 0,
      passed_controls INT DEFAULT 0,
      failed_controls INT DEFAULT 0,
      compliance_percentage DECIMAL(5,2) DEFAULT 0.00,
      last_assessment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    )`,
    
    // Threat intelligence indicators
    `CREATE TABLE IF NOT EXISTS threat_indicators (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indicator_type ENUM('IP', 'Domain', 'Hash', 'URL') NOT NULL,
      indicator_value VARCHAR(255) NOT NULL,
      threat_type VARCHAR(255),
      confidence_level ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
      first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      source VARCHAR(255),
      description TEXT
    )`
  ];

  for (const tableSQL of tables) {
    try {
      await db.execute(tableSQL);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  }
  
  console.log('✅ All database tables created successfully');
}

/**
 * Initialize sample data for demonstration purposes
 */
async function initializeSampleData() {
  try {
    // Check if users already exist
    const [existingUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      // Create default users
      const defaultUsers = [
        { username: 'admin', email: 'admin@soc.local', role: 'Administrator' },
        { username: 'analyst1', email: 'analyst1@soc.local', role: 'SOC Analyst' },
        { username: 'manager1', email: 'manager1@soc.local', role: 'SOC Manager' }
      ];

      for (const user of defaultUsers) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await db.execute(
          'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [user.username, user.email, hashedPassword, user.role]
        );
      }
      
      console.log('✅ Default users created');
    }

    // Initialize sample assets
    const [existingAssets] = await db.execute('SELECT COUNT(*) as count FROM assets');
    if (existingAssets[0].count === 0) {
      const sampleAssets = [
        { name: 'Web Server 01', ip: '192.168.1.10', type: 'Server', os: 'Ubuntu 20.04', criticality: 'Critical', owner: 'IT Team' },
        { name: 'Database Server', ip: '192.168.1.20', type: 'Server', os: 'CentOS 8', criticality: 'Critical', owner: 'DBA Team' },
        { name: 'Employee Laptop', ip: '192.168.2.15', type: 'Endpoint', os: 'Windows 11', criticality: 'Medium', owner: 'John Doe' },
        { name: 'Core Switch', ip: '192.168.1.1', type: 'Network Device', os: 'Cisco IOS', criticality: 'High', owner: 'Network Team' },
        { name: 'Cloud Instance', ip: '10.0.1.5', type: 'Cloud Resource', os: 'Amazon Linux', criticality: 'High', owner: 'DevOps Team' }
      ];

      for (const asset of sampleAssets) {
        await db.execute(
          'INSERT INTO assets (name, ip_address, asset_type, operating_system, criticality, owner) VALUES (?, ?, ?, ?, ?, ?)',
          [asset.name, asset.ip, asset.type, asset.os, asset.criticality, asset.owner]
        );
      }
      
      console.log('✅ Sample assets created');
    }

    // Initialize compliance frameworks
    const [existingFrameworks] = await db.execute('SELECT COUNT(*) as count FROM compliance_frameworks');
    if (existingFrameworks[0].count === 0) {
      const frameworks = [
        { name: 'PCI DSS', description: 'Payment Card Industry Data Security Standard', total: 12, passed: 10, failed: 2 },
        { name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act', total: 18, passed: 15, failed: 3 },
        { name: 'ISO 27001', description: 'Information Security Management', total: 114, passed: 98, failed: 16 },
        { name: 'SOX', description: 'Sarbanes-Oxley Act', total: 8, passed: 7, failed: 1 }
      ];

      for (const framework of frameworks) {
        const percentage = ((framework.passed / framework.total) * 100).toFixed(2);
        await db.execute(
          'INSERT INTO compliance_frameworks (name, description, total_controls, passed_controls, failed_controls, compliance_percentage) VALUES (?, ?, ?, ?, ?, ?)',
          [framework.name, framework.description, framework.total, framework.passed, framework.failed, percentage]
        );
      }
      
      console.log('✅ Compliance frameworks initialized');
    }

    // Initialize sample playbooks
    const [existingPlaybooks] = await db.execute('SELECT COUNT(*) as count FROM playbooks');
    if (existingPlaybooks[0].count === 0) {
      const playbooks = [
        {
          name: 'Malware Detection Response',
          description: 'Standard response procedure for malware detection alerts',
          type: 'Malware',
          steps: JSON.stringify([
            'Isolate affected system from network',
            'Collect forensic evidence',
            'Analyze malware sample',
            'Determine scope of infection',
            'Clean infected systems',
            'Update security controls',
            'Document lessons learned'
          ])
        },
        {
          name: 'Data Breach Response',
          description: 'Emergency response for data breach incidents',
          type: 'Data Breach',
          steps: JSON.stringify([
            'Activate incident response team',
            'Contain the breach',
            'Assess data exposure',
            'Notify legal and compliance teams',
            'Prepare external notifications',
            'Implement remediation measures',
            'Conduct post-incident review'
          ])
        }
      ];

      for (const playbook of playbooks) {
        await db.execute(
          'INSERT INTO playbooks (name, description, incident_type, steps, created_by) VALUES (?, ?, ?, ?, ?)',
          [playbook.name, playbook.description, playbook.type, playbook.steps, 1]
        );
      }
      
      console.log('✅ Sample playbooks created');
    }

    // Generate sample security data
    await generateSampleSecurityData();
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

/**
 * Generate realistic sample security alerts and incidents for demonstration
 */
async function generateSampleSecurityData() {
  const alertTypes = [
    'Brute Force Attack', 'SQL Injection', 'Cross-Site Scripting', 'Port Scan', 
    'Malware Detection', 'Suspicious Network Traffic', 'Failed Login', 'Data Exfiltration',
    'Privilege Escalation', 'DNS Tunneling', 'Command Injection', 'File Integrity Violation'
  ];
  
  const severities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
  const statuses = ['New', 'Assigned', 'In Progress', 'Resolved', 'False Positive'];
  
  // Sample geographic locations for threat mapping
  const locations = [
    { country: 'CN', city: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { country: 'RU', city: 'Moscow', lat: 55.7558, lng: 37.6176 },
    { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060 },
    { country: 'BR', city: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { country: 'IN', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { country: 'DE', city: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { country: 'FR', city: 'Paris', lat: 48.8566, lng: 2.3522 },
    { country: 'KR', city: 'Seoul', lat: 37.5665, lng: 126.9780 }
  ];

  // Check if alerts already exist
  const [existingAlerts] = await db.execute('SELECT COUNT(*) as count FROM alerts');
  
  if (existingAlerts[0].count < 100) {
    console.log('🔄 Generating sample security alerts...');
    
    for (let i = 0; i < 150; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Generate realistic IP addresses
      const sourceIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const destIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // Generate timestamp within last 30 days
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const rawEvent = {
        timestamp: createdAt.toISOString(),
        event_id: `EVT-${Date.now()}-${i}`,
        source: 'Security Scanner',
        details: `${alertType} detected from ${sourceIP} targeting ${destIP}`
      };

      await db.execute(
        `INSERT INTO alerts (alert_type, severity, source_ip, destination_ip, source_port, destination_port, 
         protocol, description, raw_event, status, created_at, country_code, city, latitude, longitude) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alertType, severity, sourceIP, destIP, 
          Math.floor(Math.random() * 65535), Math.floor(Math.random() * 65535),
          ['TCP', 'UDP', 'ICMP'][Math.floor(Math.random() * 3)],
          `${alertType} detected from ${sourceIP}`,
          JSON.stringify(rawEvent), status, createdAt,
          location.country, location.city, location.lat, location.lng
        ]
      );
    }
    
    console.log('✅ Sample alerts generated');
  }

  // Generate sample incidents
  const [existingIncidents] = await db.execute('SELECT COUNT(*) as count FROM incidents');
  
  if (existingIncidents[0].count < 20) {
    console.log('🔄 Generating sample security incidents...');
    
    const incidentTypes = [
      'Security Breach Investigation', 'Malware Outbreak Response', 'Phishing Campaign Analysis',
      'Insider Threat Investigation', 'Network Intrusion Response', 'Data Loss Prevention'
    ];
    
    for (let i = 0; i < 25; i++) {
      const title = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      const severity = ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)];
      const status = ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'][Math.floor(Math.random() * 5)];
      const createdAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
      
      await db.execute(
        'INSERT INTO incidents (title, description, severity, status, reporter_id, created_at, alert_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          title, 
          `Investigation into ${title.toLowerCase()} reported by automated systems`,
          severity, status, 1, createdAt,
          Math.floor(Math.random() * 10) + 1
        ]
      );
    }
    
    console.log('✅ Sample incidents generated');
  }
}

/**
 * JWT Authentication middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/**
 * Role-Based Access Control middleware
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard overview endpoints
app.get('/api/dashboard/overview', authenticateToken, async (req, res) => {
  try {
    // Get key metrics for dashboard overview
    const [alerts24h] = await db.execute(
      'SELECT COUNT(*) as count FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    
    const [alerts7d] = await db.execute(
      'SELECT COUNT(*) as count FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    const [alerts30d] = await db.execute(
      'SELECT COUNT(*) as count FROM alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    
    const [severityBreakdown] = await db.execute(
      `SELECT severity, COUNT(*) as count 
       FROM alerts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) 
       GROUP BY severity`
    );
    
    const [incidentStatus] = await db.execute(
      'SELECT status, COUNT(*) as count FROM incidents GROUP BY status'
    );
    
    const [topAlertTypes] = await db.execute(
      `SELECT alert_type, COUNT(*) as count 
       FROM alerts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
       GROUP BY alert_type 
       ORDER BY count DESC 
       LIMIT 5`
    );
    
    // Calculate threat level based on recent high severity alerts
    const [criticalAlerts] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM alerts 
       WHERE severity IN ('Critical', 'High') 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );
    
    let threatLevel = 'Green';
    if (criticalAlerts[0].count > 10) threatLevel = 'Red';
    else if (criticalAlerts[0].count > 5) threatLevel = 'Yellow';
    
    res.json({
      metrics: {
        alerts24h: alerts24h[0].count,
        alerts7d: alerts7d[0].count,
        alerts30d: alerts30d[0].count,
        threatLevel
      },
      severityBreakdown,
      incidentStatus,
      topAlertTypes
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Real-time alerts endpoint with filtering
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      status,
      alertType,
      sourceIp,
      destinationIp,
      timeRange,
      search
    } = req.query;
    
    let query = 'SELECT * FROM alerts WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1';
    const params = [];
    
    // Apply filters
    if (severity) {
      query += ' AND severity = ?';
      countQuery += ' AND severity = ?';
      params.push(severity);
    }
    
    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }
    
    if (alertType) {
      query += ' AND alert_type = ?';
      countQuery += ' AND alert_type = ?';
      params.push(alertType);
    }
    
    if (sourceIp) {
      query += ' AND source_ip LIKE ?';
      countQuery += ' AND source_ip LIKE ?';
      params.push(`%${sourceIp}%`);
    }
    
    if (destinationIp) {
      query += ' AND destination_ip LIKE ?';
      countQuery += ' AND destination_ip LIKE ?';
      params.push(`%${destinationIp}%`);
    }
    
    if (timeRange) {
      query += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)';
      countQuery += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)';
      params.push(parseInt(timeRange));
    }
    
    if (search) {
      query += ' AND (alert_type LIKE ? OR description LIKE ? OR source_ip LIKE ?)';
      countQuery += ' AND (alert_type LIKE ? OR description LIKE ? OR source_ip LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const [totalResult] = await db.execute(countQuery, params);
    const total = totalResult[0].total;
    
    // Add pagination and ordering
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const [alerts] = await db.execute(query, params);
    
    res.json({
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Geographic threat data for mapping
app.get('/api/threats/geographic', authenticateToken, async (req, res) => {
  try {
    const [geoData] = await db.execute(
      `SELECT country_code, city, latitude, longitude, COUNT(*) as alert_count,
              MAX(severity) as max_severity, MAX(created_at) as latest_alert
       FROM alerts 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY country_code, city, latitude, longitude`
    );
    
    res.json(geoData);
  } catch (error) {
    console.error('Geographic data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Incidents management endpoints
app.get('/api/incidents', authenticateToken, async (req, res) => {
  try {
    const { status, severity, assignee, search } = req.query;
    
    let query = `SELECT i.*, u.username as assignee_name 
                 FROM incidents i 
                 LEFT JOIN users u ON i.assignee_id = u.id 
                 WHERE 1=1`;
    const params = [];
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    if (severity) {
      query += ' AND i.severity = ?';
      params.push(severity);
    }
    
    if (assignee) {
      query += ' AND i.assignee_id = ?';
      params.push(assignee);
    }
    
    if (search) {
      query += ' AND (i.title LIKE ? OR i.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const [incidents] = await db.execute(query, params);
    res.json(incidents);
  } catch (error) {
    console.error('Incidents fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assets management endpoints
app.get('/api/assets', authenticateToken, async (req, res) => {
  try {
    const { assetType, criticality, owner, search } = req.query;
    
    let query = 'SELECT * FROM assets WHERE is_active = TRUE';
    const params = [];
    
    if (assetType) {
      query += ' AND asset_type = ?';
      params.push(assetType);
    }
    
    if (criticality) {
      query += ' AND criticality = ?';
      params.push(criticality);
    }
    
    if (owner) {
      query += ' AND owner LIKE ?';
      params.push(`%${owner}%`);
    }
    
    if (search) {
      query += ' AND (name LIKE ? OR ip_address LIKE ? OR operating_system LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY criticality DESC, name ASC';
    
    const [assets] = await db.execute(query, params);
    res.json(assets);
  } catch (error) {
    console.error('Assets fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Playbooks management endpoints
app.get('/api/playbooks', authenticateToken, async (req, res) => {
  try {
    const [playbooks] = await db.execute(
      `SELECT p.*, u.username as created_by_name 
       FROM playbooks p 
       LEFT JOIN users u ON p.created_by = u.id 
       WHERE p.is_active = TRUE 
       ORDER BY p.created_at DESC`
    );
    
    res.json(playbooks);
  } catch (error) {
    console.error('Playbooks fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Compliance data endpoint
app.get('/api/compliance', authenticateToken, async (req, res) => {
  try {
    const [frameworks] = await db.execute(
      'SELECT * FROM compliance_frameworks WHERE is_active = TRUE ORDER BY name'
    );
    
    res.json(frameworks);
  } catch (error) {
    console.error('Compliance fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users management (Admin only)
app.get('/api/users', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, created_at, last_login, is_active FROM users ORDER BY created_at DESC'
    );
    
    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chart data endpoints for dashboard visualizations
app.get('/api/charts/alerts-timeline', authenticateToken, async (req, res) => {
  try {
    const [data] = await db.execute(
      `SELECT DATE(created_at) as date, severity, COUNT(*) as count
       FROM alerts 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at), severity
       ORDER BY date DESC`
    );
    
    res.json(data);
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Real-time WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected for real-time updates');
  
  // Join room based on user role for targeted updates
  socket.on('join-role', (role) => {
    socket.join(role);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

/**
 * Simulate real-time alert generation for demonstration
 * In a real SOC environment, this would be replaced with actual data ingestion
 */
function simulateRealTimeAlerts() {
  setInterval(async () => {
    try {
      // Generate a new alert randomly
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        const alertTypes = ['Port Scan', 'Failed Login', 'Suspicious Network Traffic', 'Malware Detection'];
        const severities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
        const locations = [
          { country: 'CN', city: 'Beijing', lat: 39.9042, lng: 116.4074 },
          { country: 'RU', city: 'Moscow', lat: 55.7558, lng: 37.6176 },
          { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060 }
        ];
        
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const sourceIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        const [result] = await db.execute(
          `INSERT INTO alerts (alert_type, severity, source_ip, destination_ip, description, 
           country_code, city, latitude, longitude, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            alertType, severity, sourceIP, '192.168.1.100',
            `Real-time ${alertType} detected from ${sourceIP}`,
            location.country, location.city, location.lat, location.lng, 'New'
          ]
        );
        
        // Get the new alert with full details
        const [newAlert] = await db.execute('SELECT * FROM alerts WHERE id = ?', [result.insertId]);
        
        // Emit to all connected clients
        io.emit('new-alert', newAlert[0]);
        
        console.log(`📡 Real-time alert generated: ${alertType} (${severity})`);
      }
    } catch (error) {
      console.error('Error generating real-time alert:', error);
    }
  }, 10000); // Every 10 seconds
}

// Initialize database and start server
async function startServer() {
  await initializeDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 SOC Dashboard server running on port ${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:5173`);
    console.log(`🔐 Default login - Username: admin, Password: password123`);
    
    // Start real-time alert simulation
    simulateRealTimeAlerts();
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});