import express from 'express';
import cors from 'cors';
import { db } from './server/firebase.js';
import { collection, setDoc, getDoc, getDocs, doc, updateDoc, increment, deleteDoc, query, where } from 'firebase/firestore';

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

// Helper function to get the next unique deck ID using Firestore counters
async function getNextDeckId() {
  const counterRef = doc(db, 'counters', 'deckCounter');
  try {
    const counterSnapshot = await getDoc(counterRef);

    if (counterSnapshot.exists()) {
      // Increment the counter for the next deck ID
      await updateDoc(counterRef, { count: increment(1) });
      return counterSnapshot.data().count + 1;
    } else {
      // Initialize the counter if it doesn't exist
      await setDoc(counterRef, { count: 1 });
      return 1;
    }
  } catch (error) {
    console.error("Error updating deck counter:", error);
    throw new Error("Failed to generate deck ID");
  }
}

// Helper function to get the next unique card ID using Firestore counters
async function getNextCardId() {
  const counterRef = doc(db, 'counters', 'cardCounter');
  try {
    const counterSnapshot = await getDoc(counterRef);

    if (counterSnapshot.exists()) {
      // Increment the counter for the next card ID
      await updateDoc(counterRef, { count: increment(1) });
      return counterSnapshot.data().count + 1;
    } else {
      // Initialize the counter if it doesn't exist
      await setDoc(counterRef, { count: 1 });
      return 1;
    }
  } catch (error) {
    console.error("Error updating card counter:", error);
    throw new Error("Failed to generate card ID");
  }
}

app.get('/', (req, res) => {
  res.send('Welcome to the Flashcard API!');
});

// Route to get all decks
app.get('/decks', async (req, res) => {
  try {
    const decksCollection = collection(db, 'decks');
    const decksSnapshot = await getDocs(decksCollection);

    const decks = await Promise.all(decksSnapshot.docs.map(async (deckDoc) => {
      const deckData = deckDoc.data();
      const cardsRef = collection(db, 'cards');
      const cardsQuery = query(cardsRef, where("deckId", "==", deckData.id.toString()));
      const cardsSnapshot = await getDocs(cardsQuery);

      const cards = cardsSnapshot.docs.map(cardDoc => ({
        id: cardDoc.data().id,
        ...cardDoc.data(),
      }));

      return {
        ...deckData,
        cards,
      };
    }));

    res.status(200).json(decks);
  } catch (error) {
    console.error("Error fetching decks:", error);
    res.status(500).json({ error: "Failed to retrieve decks" });
  }
});

// Route to create a new deck with title and description
app.post('/deck', async (req, res) => {
  const { title, description } = req.body;

  try {
    const deckId = await getNextDeckId();
    await setDoc(doc(db, 'decks', deckId.toString()), {
      id: deckId,
      title: title || "Untitled Deck",
      description: description || "No description provided.",
    });
    res.status(201).json({ deckId, message: "Deck created successfully" });
  } catch (error) {
    console.error("Error creating deck:", error);
    res.status(500).json({ error: "Failed to create deck" });
  }
});

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

// Route to create a card within a specific deck
app.post('/deck/:deckId/card', async (req, res) => {
  const deckId = req.params.deckId;
  const { frontText, backText } = req.body;

  try {
    const cardId = await getNextCardId();
    const cardRef = doc(db, 'cards', cardId.toString());
    await setDoc(cardRef, {
      id: cardId,
      deckId: deckId, 
      frontText,
      backText,
    });
    res.status(201).json({ cardId, message: "Card created successfully" });
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ error: "Failed to create card" });
  }
});

// Route to get all cards associated with a specific deck
app.get('/deck/:deckId/cards', async (req, res) => {
  const deckId = req.params.deckId;

  try {
    const cardsRef = collection(db, 'cards');
    const cardsQuery = query(cardsRef, where("deckId", "==", deckId));
    const cardsSnapshot = await getDocs(cardsQuery);

    const cards = cardsSnapshot.docs.map(doc => ({
      id: doc.data().id,
      ...doc.data(),
    }));

    res.status(200).json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: "Failed to retrieve cards" });
  }
});

// Route to delete a card by ID
app.delete('/card/:cardId', async (req, res) => {
  const cardId = req.params.cardId;
  try {
    const cardRef = doc(db, 'cards', cardId);
    await deleteDoc(cardRef);
    res.status(200).json({ message: `Card ${cardId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ error: "Failed to delete card" });
  }
});

// Route to get a card by ID
app.get('/card/:cardId', async (req, res) => {
  const cardId = req.params.cardId;

  try {
    const cardRef = doc(db, 'cards', cardId);
    const cardSnapshot = await getDoc(cardRef);

    if (cardSnapshot.exists()) {
      res.status(200).json(cardSnapshot.data());
    } else {
      res.status(404).json({ error: `Card with ID ${cardId} not found` });
    }
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ error: "Failed to retrieve card" });
  }
});

// Route to update a card by ID
app.put('/card/:cardId', async (req, res) => {
  const cardId = req.params.cardId;
  const { frontText, backText } = req.body;

  try {
    const cardRef = doc(db, 'cards', cardId);
    const cardSnapshot = await getDoc(cardRef);

    if (!cardSnapshot.exists()) {
      return res.status(404).json({ error: `Card with ID ${cardId} not found` });
    }

    await updateDoc(cardRef, {
      ...(frontText && { frontText }),
      ...(backText && { backText }),
    });

    res.status(200).json({ message: `Card ${cardId} updated successfully` });
  } catch (error) {
    console.error("Error updating card:", error);
    res.status(500).json({ error: "Failed to update card" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
