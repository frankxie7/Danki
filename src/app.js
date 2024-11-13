// app.js
const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccount.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore(); // Initialize Firestore
const app = express();
app.use(express.json()); 
const PORT = process.env.PORT || 3000;


// creates a new deck
app.post('/decks', async (req, res) => {
    const { title, description } = req.body;
    try {
      const deckRef = await db.collection('decks').add({
        title,
        description,
      });
      res.status(201).json({ id: deckRef.id, title, description });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create deck' });
    }
  });
  
  // GET all decks
  app.get('/decks', async (req, res) => {
    try {
      const decksSnapshot = await db.collection('decks').get();
      const decks = decksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(decks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve decks' });
    }
  });
  
  // CREATE a new card in a specific deck
  app.post('/decks/:deckId/cards', async (req, res) => {
    const { deckId } = req.params;
    const { frontText, backText } = req.body;
    try {
      const cardRef = await db.collection('decks').doc(deckId).collection('cards').add({
        frontText,
        backText,
        deckId,
      });
      res.status(201).json({ id: cardRef.id, frontText, backText, deckId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create card' });
    }
  });
  
  // GET all cards in a specific deck
  app.get('/decks/:deckId/cards', async (req, res) => {
    const { deckId } = req.params;
    try {
      const cardsSnapshot = await db.collection('decks').doc(deckId).collection('cards').get();
      const cards = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(cards);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve cards' });
    }
  });
  
  // DELETE a specific card in a specific deck
  app.delete('/decks/:deckId/cards/:cardId', async (req, res) => {
    const { deckId, cardId } = req.params;
    try {
      await db.collection('decks').doc(deckId).collection('cards').doc(cardId).delete();
      res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete card' });
    }
  });
  
  // DELETE a specific deck and its cards
  app.delete('/decks/:deckId', async (req, res) => {
    const { deckId } = req.params;
    try {
      // Delete all cards in the deck
      const cardsSnapshot = await db.collection('decks').doc(deckId).collection('cards').get();
      const deletePromises = cardsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
  
      // Delete the deck itself
      await db.collection('decks').doc(deckId).delete();
      res.status(200).json({ message: 'Deck and its cards deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete deck' });
    }
  });
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  