const admin = require('firebase-admin');
const fs = require('fs');  // Import fs module

// Import your service account key JSON file
const serviceAccount = require('./dorakingdom-firebase-adminsdk-lnura-4330df1880.json');

// Initialize the Firebase Admin SDK with your credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a reference to the Firestore database
const db = admin.firestore();

// Load nerdmissions.json file
fs.readFile('outdoor_adventure_missions.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file', err);
    return;
  }

  const missionsData = JSON.parse(data);

  // Reference to the 'missions' collection
  const missionsRef = db.collection('missions');

  // Add data to Firestore for each mission
  missionsData.missions.forEach(async (mission, index) => {
    try {
      // Add the mission to Firestore
      await missionsRef.add({
        createdAt: mission.createdAt,
        createdBy: mission.createdBy,
        description: mission.description,
        emoji: mission.emoji,
        isPrivate: mission.isPrivate,
        quests: mission.quests, // Assumes quest details are nested inside missionsData.missions[0].quests
        title: mission.title
      });

      console.log(`Mission "${mission.title}" added to Firestore.`);
    } catch (error) {
      console.error('Error adding mission', error);
    }
  });
});
