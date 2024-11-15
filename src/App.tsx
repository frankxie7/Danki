import { useState, useEffect } from "react";
import { db } from "./firebase"; // Import Firestore setup
import { collection, onSnapshot } from "firebase/firestore";
import "./App.css";

type Flashcard = {
  front: string;
  back: string;
};

const FlashcardComponent = ({ card, isNavigating }: { card: Flashcard; isNavigating: boolean }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!isNavigating) {
      setIsFlipped(!isFlipped);
    }
  };

  useEffect(() => {
    setIsFlipped(false);
  }, [card]);

  return (
    <div
      onClick={handleFlip}
      className={`flashcard ${isFlipped ? "flipped" : ""} ${isNavigating ? "no-flip" : ""}`}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <p>{card.front}</p>
        </div>
        <div className="flashcard-back">
          <p>{card.back}</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [decks, setDecks] = useState<{ [key: string]: Flashcard[] }>({});
  const [selectedDeck, setSelectedDeck] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Set up real-time listener for decks and cards from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "decks"), (snapshot) => {
      const deckData: { [key: string]: Flashcard[] } = {};
      
      snapshot.forEach((deckDoc) => {
        const deck = deckDoc.data();
        const deckTitle = deck.title;

        // Set up real-time listener for cards within each deck
        onSnapshot(collection(db, "cards"), (cardSnapshot) => {
          const cards = cardSnapshot.docs
            .filter(cardDoc => cardDoc.data().deckId === deckDoc.id) // Filter cards by deckId
            .map(cardDoc => ({
              front: cardDoc.data().frontText,
              back: cardDoc.data().backText,
            }));
          
          deckData[deckTitle] = cards;
          setDecks(deckData);
          if (!selectedDeck && deckTitle) setSelectedDeck(deckTitle); // Set default deck
        });
      });
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [selectedDeck]);

  const goToPrevious = () => {
    setIsNavigating(true);
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : decks[selectedDeck].length - 1
    );
    setTimeout(() => setIsNavigating(false), 500);
  };

  const goToNext = () => {
    setIsNavigating(true);
    setCurrentIndex((prevIndex) =>
      prevIndex < decks[selectedDeck].length - 1 ? prevIndex + 1 : 0
    );
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <div className="app">
      <h1 className="title">Danki</h1>

      <div className="navbar">
        {Object.keys(decks).map((deckName) => (
          <button
            key={deckName}
            onClick={() => {
              setSelectedDeck(deckName);
              setCurrentIndex(0);
            }}
            className={selectedDeck === deckName ? "selected" : ""}
          >
            {deckName}
          </button>
        ))}
      </div>

      {decks[selectedDeck] && decks[selectedDeck][currentIndex] && (
        <FlashcardComponent
          card={decks[selectedDeck][currentIndex]}
          isNavigating={isNavigating}
        />
      )}

      <div className="navigation">
        <button onClick={goToPrevious}>⬅️ Previous</button>
        <button onClick={goToNext}>Next ➡️</button>
      </div>
    </div>
  );
}

export default App;
