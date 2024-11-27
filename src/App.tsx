import { useState, useEffect } from "react";
import "./App.css";

type Flashcard = {
    front: string;
    back: string;
};

const FlashcardComponent = ({
    card,
    isNavigating,
}: {
    card: Flashcard;
    isNavigating: boolean;
}) => {
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch decks from the backend
    const fetchDecks = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("http://localhost:3000/decks");
            if (!response.ok) {
                throw new Error("Failed to fetch decks");
            }

            const data = await response.json();
            const formattedDecks: { [key: string]: Flashcard[] } = {};
            data.forEach((deck: any) => {
                const deckTitle = deck.title || `Deck ${deck.id}`;
                formattedDecks[deckTitle] = deck.cards.map((card: any) => ({
                    front: card.frontText,
                    back: card.backText,
                }));
            });

            setDecks(formattedDecks);
            if (!selectedDeck && Object.keys(formattedDecks).length > 0) {
                setSelectedDeck(Object.keys(formattedDecks)[0]); // Default to the first deck
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    // Navigation between cards
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

    // Add a card to a deck
    const addCardToDeck = async (deckName: string, frontText: string, backText: string) => {
        const deckId = Object.keys(decks).find((key) => key === deckName);
        if (!deckId) {
            console.error("Deck not found!");
            return;
        }

        // Optimistic UI update: Add the new card locally first
        const newCard: Flashcard = { front: frontText, back: backText };
        setDecks((prevDecks) => ({
            ...prevDecks,
            [deckName]: [...prevDecks[deckName], newCard], // Add the new card to the selected deck
        }));

        try {
            const response = await fetch(`http://localhost:3000/deck/${deckId}/card`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frontText, backText }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Card added:", result);
            } else {
                console.error("Error adding card:", response.statusText);
            }
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    // Create a new deck
    const createNewDeck = async () => {
        const title = prompt("Enter the title for your new deck:");
        if (!title) return; // Cancelled or empty title

        try {
            const response = await fetch("http://localhost:3000/deck", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Deck created:", result);
                fetchDecks(); // Refresh decks to include the new deck
            } else {
                console.error("Error creating deck:", response.statusText);
            }
        } catch (error) {
            console.error("Error creating deck:", error);
        }
    };

    // Handle adding a card (prompt user for front/back text)
    const handleAddCard = () => {
        const frontText = prompt("Enter the front text for your new card:");
        if (!frontText) return; // Cancelled or empty front text

        const backText = prompt("Enter the back text for your new card:");
        if (!backText) return; // Cancelled or empty back text

        addCardToDeck(selectedDeck, frontText, backText);
    };

    // Delete a deck
    const deleteDeck = async (deckName: string) => {
        const deckId = Object.keys(decks).find((key) => key === deckName);
        if (!deckId) {
            console.error("Deck not found!");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/deck/${deckId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                console.log(`Deck ${deckName} deleted.`);
                const updatedDecks = { ...decks };
                delete updatedDecks[deckName];
                setDecks(updatedDecks);

                if (selectedDeck === deckName) {
                    setSelectedDeck("");
                    setCurrentIndex(0);
                }
            } else {
                console.error("Error deleting deck:", response.statusText);
            }
        } catch (error) {
            console.error("Error deleting deck:", error);
        }
    };

    return (
        <div className="app">
            <header className="header">
                <h1 className="title">Danki</h1>
            </header>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p>Error: {error}</p>
            ) : (
                <>
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

                    <div className="actions">
                        <button onClick={createNewDeck}>Create New Deck</button>
                        <button onClick={handleAddCard}>Add Card</button>
                        {selectedDeck && (
                            <button onClick={() => deleteDeck(selectedDeck)}>Delete Deck</button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
