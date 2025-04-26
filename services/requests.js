const fetch = require('node-fetch'); // import node-fetch (enables the fetch API to be used server-side)
const { Pool } = require('pg'); // import node-postgres

const pool = new Pool({ // create connection to database
  connectionString: process.env.DATABASE_URL,	// use DATABASE_URL environment variable from Render app 
  ssl: {
    rejectUnauthorized: false // don't check for SSL cert
  }
});

const getAllActivities = (req, res) => {
  const getString = 'SELECT * FROM "my_activities"'; // select all rows from the 'my_activities' table
  const countString = 'SELECT count(*) FROM "my_activities"' // get total row count from the 'my_activities' table
  pool.query(getString) // send query to select all rows from the 'my_activities' table 
    .then(activityResults => {
      let activities = activityResults.rows;
      pool.query(countString) // send query to get total row count from the 'my_activities' table
        .then(countResult => {
          let count = countResult.rows[0].count;
          console.log('Activities List:', activities);
          console.log(`Activities Count: ${count}`);
          res.json({ activities, count})
          // res.render('index', { activities: activities, count: count }); // render index.ejs, and send activity and count results to index.ejs
          // TODO: Send info to frontend 
        })
    })
    .catch(err => console.log(err));
}

const getSingleActivity = async (req, res) => {
  try {
    const response = await fetch('https://www.boredapi.com/api/activity');
    
    if (!response.ok) {
      throw new Error(`Bored API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.activity) {
      throw new Error('No activity found in API response');
    }

    // Spara till din databas:
    const insertString = 'INSERT INTO "my_activities" (activity) VALUES ($1) RETURNING *';
    const result = await pool.query(insertString, [data.activity]);

    // Skicka tillbaka det som svar till klienten
    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching and inserting activity:', error.message);
    res.status(500).json({ error: 'Failed to fetch and save new activity' });
  }
}


const addActivityToDB = (req, res) => {
  const activity = [ req.body.activity ]

  const addString = 'INSERT INTO "my_activities" (activity) VALUES ($1) RETURNING *'; // insert value into my_activities' table

  pool.query(addString, activity)
    .then(result => res.json(result))
    .catch(err => console.log(err));
}

const deleteAllActivites = (req, res) => {
  const removeString = 'DELETE FROM "my_activities"'; // delete all items in the 'my_activities' table
  pool.query(removeString) // send query delete all items in the 'my_activities' table
    .then(res.send('All activities cleared!')) // send confirmation to the browser
    .catch(err => console.log(err));  
}

module.exports = { getSingleActivity, addActivityToDB, getAllActivities, deleteAllActivites }
