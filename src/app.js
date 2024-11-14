import express from 'express';
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Test route to confirm the server is running
app.get('/deck', (req, res) => {
  res.send("Server is working!");
});

// Route to add a card to a deck (POST)
app.post('/deck/:id', async (req, res) => {
  const deckId = req.params.id;
  const { frontText, backText } = req.body; // Assuming each card has frontText and backText
  
  try {
    // Reference the deck's collection and add a new card
    const newCard = await addDoc(collection(db, 'decks', deckId, 'cards'), {
      frontText,
      backText,
    });
    res.status(201).json({ id: newCard.id, frontText, backText });
  } catch (error) {
    console.error("Error adding card:", error);
    res.status(500).json({ error: "Failed to add card to the deck" });
  }
});

// Route to update a specific card (PUT)
app.put('/card/:id', async (req, res) => {
  const cardId = req.params.id;
  const { frontText, backText } = req.body;

  try {
    const cardRef = doc(db, 'cards', cardId);
    await updateDoc(cardRef, { frontText, backText });
    res.status(200).send(`Card ${cardId} updated successfully`);
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Failed to update the card" });
  }
});

// Route to delete a specific card (DELETE)
app.delete('/card/:id', async (req, res) => {
  const cardId = req.params.id;

  try {
    const cardRef = doc(db, 'cards', cardId);
    await deleteDoc(cardRef);
    res.status(200).send(`Card ${cardId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Failed to delete the card" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
