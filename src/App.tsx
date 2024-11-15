import { useState, useEffect } from "react";
import { db } from "./server/firebase.js";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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

    useEffect(() => {
        const fetchDecks = async () => {
            const decksCollectionRef = collection(db, "decks");

            onSnapshot(decksCollectionRef, (decksSnapshot) => {
                const newDecks: { [key: string]: Flashcard[] } = {};

                decksSnapshot.forEach((deckDoc) => {
                    const deckData = deckDoc.data();
                    const deckId = deckDoc.id;
                    const deckTitle = deckData.title || `Deck ${deckId}`;

                    const cardsQuery = query(collection(db, "cards"), where("deckId", "==", deckId));
                    onSnapshot(cardsQuery, (cardsSnapshot) => {
                        const cards = cardsSnapshot.docs.map((cardDoc) => ({
                            front: cardDoc.data().frontText,
                            back: cardDoc.data().backText,
                        }));

                        newDecks[deckTitle] = cards;
                        setDecks(newDecks);

                        if (!selectedDeck) setSelectedDeck(deckTitle);
                    });
                });
            });
        };

        fetchDecks();
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
            <header className="header">
                <h1 className="title">Danki</h1>
            </header>
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
