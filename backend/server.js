const { PeerServer } = require('peer');

const PORT = process.env.PORT || 9000;

// Initialize the PeerJS Signaling Server
// This handles the "handshake" so users can find each other's IP addresses
const peerServer = PeerServer({
  port: PORT,
  path: '/myapp', // This must match the 'path' in index.html
  allow_discovery: true,
  proxied: true, // Critical for running behind Coolify's Nginx/Traefik
  // Optional: Generate a client key to prevent unauthorized websites from using your server
  // key: 'peerjs' 
});

console.log(`HollaCaller Signaling Server running on port ${PORT}`);

// Logging events to Coolify console for debugging
peerServer.on('connection', (client) => {
    console.log(`User connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`User disconnected: ${client.getId()}`);
});
