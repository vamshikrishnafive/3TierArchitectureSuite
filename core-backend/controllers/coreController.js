const { pool } = require('../db');

// GET /api/core/dashboard (Protected)
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userAuthInfo = req.user; // { id, username, email, full_name }

    // 1. Fetch or create User Profile in arch_core_db
    let [profiles] = await pool.query('SELECT * FROM user_profiles WHERE user_id = ? LIMIT 1', [userId]);
    let profile = profiles[0];

    if (!profile) {
      await pool.query(
        'INSERT INTO user_profiles (user_id, department, role_title, bio) VALUES (?, ?, ?, ?)',
        [userId, 'Architecture & Operations', 'System Operator', 'Member of the decoupled 3-tier system demonstration.']
      );
      const [newProfiles] = await pool.query('SELECT * FROM user_profiles WHERE user_id = ? LIMIT 1', [userId]);
      profile = newProfiles[0];
    }

    // 2. Fetch or create Metrics in arch_core_db
    let [metricsList] = await pool.query('SELECT * FROM dashboard_metrics WHERE user_id = ? LIMIT 1', [userId]);
    let metrics = metricsList[0];

    if (!metrics) {
      await pool.query(
        'INSERT INTO dashboard_metrics (user_id, api_calls_count, projects_active, tier_status) VALUES (?, 1, 3, ?)',
        [userId, 'Tier-3 Decoupled']
      );
      const [newMetricsList] = await pool.query('SELECT * FROM dashboard_metrics WHERE user_id = ? LIMIT 1', [userId]);
      metrics = newMetricsList[0];
    } else {
      // Increment API access counter
      await pool.query('UPDATE dashboard_metrics SET api_calls_count = api_calls_count + 1 WHERE user_id = ?', [userId]);
      metrics.api_calls_count += 1;
    }

    // 3. Fetch recent user activities
    const [activities] = await pool.query(
      'SELECT id, action_type, description, tier_origin, created_at FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 15',
      [userId]
    );

    // 4. Fetch platform summary metrics across arch_core_db
    const [[{ totalActivities }]] = await pool.query('SELECT COUNT(*) as totalActivities FROM activities');
    const [[{ totalProfiles }]] = await pool.query('SELECT COUNT(*) as totalProfiles FROM user_profiles');

    return res.status(200).json({
      success: true,
      tier: 'Core Backend Tier (Port 5002)',
      message: 'Dashboard payload retrieved successfully from arch_core_db',
      data: {
        authUser: userAuthInfo,
        profile: profile,
        metrics: metrics,
        activities: activities,
        systemSummary: {
          totalActivitiesLogged: totalActivities,
          totalCoreProfiles: totalProfiles,
          authTierUrl: process.env.AUTH_SERVER_URL || 'http://localhost:5001',
          coreTierUrl: `http://localhost:${process.env.PORT || 5002}`,
          databaseEngine: 'MySQL 8.0 (arch_core_db)',
          serverTime: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard in Core Backend:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data from Core Backend.',
      error: error.message
    });
  }
};

// POST /api/core/activity (Protected)
exports.createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { actionType, description } = req.body;

    if (!actionType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Both actionType and description are required.'
      });
    }

    const [insertResult] = await pool.query(
      'INSERT INTO activities (user_id, action_type, description, tier_origin) VALUES (?, ?, ?, ?)',
      [userId, actionType, description, `Core Tier (:${process.env.PORT || 5002})`]
    );

    // Increment user metrics
    await pool.query('UPDATE dashboard_metrics SET api_calls_count = api_calls_count + 1 WHERE user_id = ?', [userId]);

    const newActivityId = insertResult.insertId;
    const [activities] = await pool.query('SELECT * FROM activities WHERE id = ?', [newActivityId]);

    return res.status(201).json({
      success: true,
      message: 'Activity successfully recorded in arch_core_db.',
      activity: activities[0]
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record activity in Core Backend.',
      error: error.message
    });
  }
};

// GET /health
exports.health = async (req, res) => {
  try {
    const [dbResult] = await pool.query('SELECT 1 as is_alive');
    return res.status(200).json({
      status: 'UP',
      tier: 'Tier-2: Core Backend',
      port: process.env.PORT || 5002,
      database: {
        name: process.env.DB_NAME || 'arch_core_db',
        connected: dbResult.length > 0
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'DEGRADED',
      tier: 'Tier-2: Core Backend',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
