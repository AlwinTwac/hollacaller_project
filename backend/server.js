const express = require('express');
const { PeerServer } = require('peer');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 9000;

// --- FIREBASE CONFIGURATION ---
// We initialize the app using the credentials you provided.
// In a large corporate environment, these should be Environment Variables,
// but for your specific setup, this direct integration ensures it works immediately.
const serviceAccount = {
  "type": "service_account",
  "project_id": "skillssg-9f2bf",
  "private_key_id": "972f324c697b40c7ba8a4f09a4f61e60",
  // The replace function handles the newlines in the private key string correctly
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7JmoZXoIkGM5b\npzO8NSkn4tMQfKDg9PrU4Jox2KfjGKINlCuLcxMgzWMrY+BMCWstaFs1ROsuWozY\nXJBdPaKdKgB/alEXxQ+QSaCbRfcvAKhjaM8msZ+GYOv2a0EQXZFn9OmS28zIS31y\nhTw8yYKQCN0KqyZG7u1eGp27xx7Rnppdfc8fvzxN/UVmKYetVkrAlf0kW/nWTDEE\np/P9DI8Gs8KyhysPyzdivlAjgan1dkZvd1TXh9bnvnrasZOMHo7L/w0KJ6OCgCoQ\nVRhmRWEsp3tiraqi+eR0BAh9VfZOd5ptBCv5GoadEP6ki9sY8cHs/M01DvzQiABz\nMHln8M8tAgMBAAECggEAAdT27eeka3kIsBH7aii1Dexk94DYzErpl6LZL4q43fq0\nP2DHalaGhegsw9R28heXgnrGhcd2a948CbQiP59mU5aBKb4fLBXkOJvX5B0ztbSS\ncWKpwG21q4mQVbmoCeJ4lWVq0eKv5vgCMthGBixMyF8l1sBlIAWfsi+dgqSI0zFv\ncXgXpnc9akJUqNna9BUL+vay8zplqSN5Bgbp0NF6gF/IflIz7aqdwiQikYAzZk3T\nuw+cMFDUHrCOzPP5p1goGmza8BcLj8gqBqvSeniNNqrB+ksNNWkTUVET+ghk4M0Z\nwoFEnxlRaftUhBOqAHqk1mdqjx+PM+ktLz57cABQoQKBgQDuM6u2m0amNLA6Omju\njB7swzF2jYgQJxXb3dHT9c+sfSYMqUS/MTEU99VJ4EYs/kROi4vIY0jZrJVLVNzF\nOIqZyLqEL1GOqihC7KPDKcyHeCluTjk5V0orqODkQ1tw5E46yYLJhvyUeOhvVxYG\nYn2lSvj/50DBdLAeq50icv+IEQKBgQDJIjln6HsHO+vnYdHWAxY4RiaBbi8ku1SY\nyxOk0wrfzXsCBDFcjsV2hH4w6ImLh5DujpVzV7S9LIYr7UdLgVi3hi1xiAmAEB9P\n9alKvlsL5mMOdNE5cRXKmExT3tgJoHFhZHEsBsrvbX0plAXcowpu0jNOL6EB58N9\n2HghfR9RXQKBgBaH7qsUHuejvjOTyM8fk+FDSU90bbVRbSDh53IMIzumjs3NyQHo\nrkLUemlFfH3PAzkGvA8VTRPB3lFE0qkZAwsu0G2maCl9cNd7uLXCI2WA+TJE1ebV\nmd9tVvBgaqrP/ZJT8zoKuaN1mE7Hxv6NnGLhJ5JVFmv2FJ6iDvfuNrtxAoGAbAd1\nzdmQOtJ0YlKn4crGpHMJO3ty1sfHKEnqwxyXOp2i8/JMkOoeJQoEvUAooEiwD3GF\n0+3HpdPEPNO091kBzZDD17a5Y49FQi0wQHT9cebMTXdw6OlUSvyCAooufv0t6KGK\nJ5t+ZBrqnupiO59Wey9rXxM151AUMAOUgmgx6gECgYEAuGzblrb/x/taClZsSkkJ\nj26nSfcDKaGSfigvdOtVb0TTd1q9aQCjc6hPPUiIau7PJk2w6zeoPWGZ350/eTxX\n1Jqj8tcFg+IUbB3ftq6+Wz8Gc53S4V4uSlFGcLXD9eh28sZf7uUBSZB6PxKCcW3n\n5RBgE/ndufdINAbaZTx6MG8=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@skillssg-9f2bf.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- API SERVER SETUP ---
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Login Endpoint: Checks if email exists in 'hollacaller' collection
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Query Firestore
        const usersRef = db.collection('hollacaller');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            // User not in the allowed list
            return res.status(403).json({ error: 'Access Denied: You are not authorized to use HollaCaller.' });
        }

        // Get user data
        let userData = {};
        snapshot.forEach(doc => {
            userData = doc.data();
        });

        console.log(`Login approved for: ${userData.Name} (${email})`);
        
        // Send back the Name and Email to the frontend
        res.json({ 
            success: true, 
            name: userData.Name, 
            email: userData.email 
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the Express HTTP Server
const server = app.listen(PORT, () => {
    console.log(`HollaCaller Backend running on port ${PORT}`);
});

// --- PEERJS SIGNALING SERVER ---
// We attach PeerJS to the existing Express server so they share the same port/domain
const peerServer = PeerServer({
  port: PORT,
  path: '/myapp',
  proxied: true, // Necessary for Coolify
  allow_discovery: true
}, server);

peerServer.on('connection', (client) => {
    console.log(`User connected to signaling: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`User disconnected: ${client.getId()}`);
});
