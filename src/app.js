import express from 'express';
import { db } from '../server/firebase.js';
import { collection, setDoc, getDoc, getDocs, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Helper function to get the next unique card ID
async function getNextCardId() {
  const counterRef = doc(db, 'counters', 'cardCounter');
  try {
    const counterSnapshot = await getDoc(counterRef);

    if (counterSnapshot.exists()) {
      await updateDoc(counterRef, { count: increment(1) });
      return counterSnapshot.data().count + 1;
    } else {
      await setDoc(counterRef, { count: 1 });
      return 1;
    }
  } catch (error) {
    console.error("Error updating card counter:", error);
    throw new Error("Failed to generate card ID");
  }
}

// Helper function to get the next unique deck ID
async function getNextDeckId() {
  const counterRef = doc(db, 'counters', 'deckCounter');
  try {
    const counterSnapshot = await getDoc(counterRef);
    
    if (counterSnapshot.exists()) {
      await updateDoc(counterRef, { count: increment(1) });
      return counterSnapshot.data().count + 1;
    } else {
      await setDoc(counterRef, { count: 1 });
      return 1;
    }
  } catch (error) {
    console.error("Error updating deck counter:", error);
    throw new Error("Failed to generate deck ID");
  }
}

// Route to delete a deck by ID
app.delete('/deck/:id', async (req, res) => {
  const deckId = req.params.id;
  try {
    await deleteDoc(doc(db, 'decks', deckId));
    res.status(200).json({ message: `Deck with ID ${deckId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting deck:", error);
    res.status(500).json({ error: "Failed to delete deck" });
  }
});

// Route to create a card within a specific deck
app.post('/deck/:deckId/card', async (req, res) => {
  const deckId = req.params.deckId;
  const { frontText, backText } = req.body;

  try {
    const cardId = await getNextCardId();
    const cardRef = doc(db, 'decks', deckId, 'cards', cardId.toString());
    await setDoc(cardRef, {
      id: cardId,
      frontText,
      backText,
    });
    res.status(201).json({ cardId, message: "Card created successfully" });
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ error: "Failed to create card" });
  }
});

// Route to update a card by ID within a specific deck
app.put('/deck/:deckId/card/:cardId', async (req, res) => {
  const { deckId, cardId } = req.params;
  const { frontText, backText } = req.body;

  try {
    const cardRef = doc(db, 'decks', deckId, 'cards', cardId);
    await updateDoc(cardRef, { frontText, backText });
    res.status(200).json({ message: `Card ${cardId} updated successfully` });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Failed to update card" });
  }
});

// Route to delete a card by ID within a specific deck
app.delete('/deck/:deckId/card/:cardId', async (req, res) => {
  const { deckId, cardId } = req.params;

  try {
    const cardRef = doc(db, 'decks', deckId, 'cards', cardId);
    await deleteDoc(cardRef);
    res.status(200).json({ message: `Card ${cardId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

// Route to get a card by ID within a specific deck
app.get('/deck/:deckId/card/:cardId', async (req, res) => {
  const { deckId, cardId } = req.params;

  try {
    const cardRef = doc(db, 'decks', deckId, 'cards', cardId);
    const cardSnapshot = await getDoc(cardRef);

    if (cardSnapshot.exists()) {
      res.status(200).json(cardSnapshot.data());
    } else {
      res.status(404).json({ error: `Card with ID ${cardId} not found in deck ${deckId}` });
    }
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ error: "Failed to retrieve card" });
  }
});

// Route to create a new deck with an auto-incremented ID
app.post('/deck', async (req, res) => {
  try {
    const deckId = await getNextDeckId();
    await setDoc(doc(db, 'decks', deckId.toString()), {
      id: deckId,
      title: "Untitled Deck",
      description: "This is a blank deck.",
      cards: [],
    });
    res.status(201).json({ deckId, message: "Blank deck created successfully" });
  } catch (error) {
    console.error("Error creating deck:", error);
    res.status(500).json({ error: "Failed to create deck" });
  }
});

// Route to get all decks
app.get('/decks', async (req, res) => {
  try {
    const decksCollection = collection(db, 'decks');
    const decksSnapshot = await getDocs(decksCollection);
    const decks = decksSnapshot.docs.map(doc => ({
      id: doc.data().id,
      ...doc.data(),
    }));
    res.status(200).json(decks);
  } catch (error) {
    console.error("Error fetching decks:", error);
    res.status(500).json({ error: "Failed to retrieve decks" });
  }
});

// Route to get a deck by ID
app.get('/deck/:id', async (req, res) => {
  const deckId = req.params.id;

  try {
    const deckRef = doc(db, 'decks', deckId);
    const deckSnapshot = await getDoc(deckRef);

    if (deckSnapshot.exists()) {
      res.status(200).json(deckSnapshot.data());
    } else {
      res.status(404).json({ error: `Deck with ID ${deckId} not found` });
    }
  } catch (error) {
    console.error("Error fetching deck:", error);
    res.status(500).json({ error: "Failed to retrieve deck" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
