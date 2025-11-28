require('dotenv').config();
const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');

const PORT = process.env.PORT || 9000;

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Setup Express
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const server = http.createServer(app);

// PeerJS Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp',
  allow_discovery: true,
  proxied: true
});

app.use('/peerjs', peerServer);

// Helper to sanitize email for use as PeerID
const sanitizeEmail = (email) => {
    return email.replace(/[^a-zA-Z0-9]/g, '_');
};

// API Endpoints
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const usersRef = db.collection('hollacaller');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Access Denied: User not found in Hollacaller collection.' });
        }

        let userData = null;
        let docId = null;

        snapshot.forEach(doc => {
            userData = doc.data();
            docId = doc.id;
        });

        if (userData.isInMeeting) {
             return res.status(409).json({ error: 'Access Denied: User already in a meeting.' });
        }

        res.json({
            name: userData.Name,
            email: userData.email,
            id: docId,
            peerId: sanitizeEmail(userData.email)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/status', async (req, res) => {
    const { email, status } = req.body; // status: true (in meeting) or false (out)
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const usersRef = db.collection('hollacaller');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'User not found' });
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { isInMeeting: status === true });
        });
        await batch.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Improved Disconnect Handling via API Helper
// We will update the /api/login to set the expected peerId in the DB.
app.post('/api/register-connection', async (req, res) => {
     const { email, peerId } = req.body;
     try {
        const usersRef = db.collection('hollacaller');
        const snapshot = await usersRef.where('email', '==', email).get();

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { peerId: peerId, isInMeeting: true });
        });
        await batch.commit();
        res.json({success: true});
     } catch(e) {
         res.status(500).json({error: e.message});
     }
});


peerServer.on('disconnect', async (client) => {
    const peerId = client.getId();
    console.log(`User disconnected: ${peerId}`);
    try {
        const usersRef = db.collection('hollacaller');
        const snapshot = await usersRef.where('peerId', '==', peerId).get();

        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.update(doc.ref, { isInMeeting: false });
            });
            await batch.commit();
            console.log(`Marked user with peerId ${peerId} as offline.`);
        }
    } catch (e) {
        console.error("Error handling disconnect", e);
    }
});


server.listen(PORT, () => {
  console.log(`HollaCaller Server running on port ${PORT}`);
});
