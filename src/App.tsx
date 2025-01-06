import { useState, useEffect } from "react";
import "./App.css";

type Flashcard = {
    id: string;
    front: string;
    back: string;
};

type Deck = {
    id: string;
    title: string;
    cards: Flashcard[];
};

interface FlashcardStatus {
    card: Flashcard;
    isNavigating: boolean;
    onDelete: (cardId: string) => void;
}

const FlashcardComponent: React.FC<FlashcardStatus> = ({ card, isNavigating, onDelete }) => {
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
        <div className="flashcard-container">
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
            <button
                className="delete-card"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                }}
            >
                Delete Card
            </button>
        </div>
    );
};

const App: React.FC = () => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    type DeckStatus = {
        id: string;
        title: string;
        cards: {
            id: string;
            frontText: string;
            backText: string;
        }[];
    };

    const fetchDecks = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("http://localhost:3000/decks");
            if (!response.ok) {
                throw new Error("Failed to fetch decks");
            }

            const data: DeckStatus[] = await response.json();

            const fetchedDecks: Deck[] = data.map((deck) => ({
                id: deck.id,
                title: deck.title || `Deck ${deck.id}`,
                cards: deck.cards.map((card) => ({
                    id: card.id,
                    front: card.frontText,
                    back: card.backText,
                })),
            }));

            setDecks(fetchedDecks);

            if (!selectedDeckId && fetchedDecks.length > 0) {
                setSelectedDeckId(fetchedDecks[0].id);
                setCurrentIndex(0);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while fetching decks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDecks();
    }, []);

    const goToPrevious = () => {
        if (!selectedDeckId) return;

        const currentDeck = decks.find((deck) => deck.id === selectedDeckId);
        if (!currentDeck) return;

        if (currentDeck.cards.length === 0) return;

        setIsNavigating(true);
        setCurrentIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : currentDeck.cards.length - 1
        );
        setTimeout(() => setIsNavigating(false), 500);
    };

    const goToNext = () => {
        if (!selectedDeckId) return;

        const currentDeck = decks.find((deck) => deck.id === selectedDeckId);
        if (!currentDeck) return;

        if (currentDeck.cards.length === 0) return;

        setIsNavigating(true);
        setCurrentIndex((prevIndex) =>
            prevIndex < currentDeck.cards.length - 1 ? prevIndex + 1 : 0
        );
        setTimeout(() => setIsNavigating(false), 500);
    };

    const addCardToDeck = async (deckId: string, frontText: string, backText: string) => {
        const newCard: Flashcard = { id: "", front: frontText, back: backText };
        setDecks((prevDecks) =>
            prevDecks.map((deck) =>
                deck.id === deckId ? { ...deck, cards: [...deck.cards, newCard] } : deck
            )
        );

        try {
            const response = await fetch(`http://localhost:3000/deck/${deckId}/card`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frontText, backText }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Card added:", result);
                await fetchDecks();
            } else {
                console.error("Error adding card:", response.statusText);
                alert("Failed to add the card. Please try again.");
            }
        } catch (error) {
            console.error("Error adding card:", error);
            alert("An error occurred while adding the card. Please try again.");
        }
    };

    const deleteCard = async (cardId: string) => {
        try {
            const response = await fetch(`http://localhost:3000/card/${cardId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setDecks((prevDecks) =>
                    prevDecks.map((deck) => ({
                        ...deck,
                        cards: deck.cards.filter((card) => card.id !== cardId),
                    }))
                );
                console.log(`Card ${cardId} deleted.`);
            } else {
                console.error("Error deleting card:", response.statusText);
                alert("Failed to delete card. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting card:", error);
            alert("An error occurred while deleting the card. Please try again.");
        }
    };

    const createNewDeck = async () => {
        const title = prompt("Enter the title for your new deck:");
        if (!title) return;

        try {
            const response = await fetch("http://localhost:3000/deck", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Deck created:", result);
                await fetchDecks();
            } else {
                console.error("Error creating deck:", response.statusText);
                alert("Failed to create deck. Please try again.");
            }
        } catch (error) {
            console.error("Error creating deck:", error);
            alert("An error occurred while creating the deck. Please try again.");
        }
    };

    const deleteDeck = async (deckId: string, deckTitle: string) => {
        if (!window.confirm(`Are you sure you want to delete the deck "${deckTitle}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/deck/${deckId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                console.log(`Deck "${deckTitle}" deleted.`);
                setDecks((prevDecks) => prevDecks.filter((deck) => deck.id !== deckId));

                if (selectedDeckId === deckId) {
                    if (decks.length > 1) {
                        const remainingDecks = decks.filter((deck) => deck.id !== deckId);
                        setSelectedDeckId(remainingDecks[0].id);
                        setCurrentIndex(0);
                    } else {
                        setSelectedDeckId("");
                        setCurrentIndex(0);
                    }
                }
            } else {
                console.error("Error deleting deck:", response.statusText);
                alert("Failed to delete the deck. Please try again.");
            }
        } catch (error) {
            console.error("Error deleting deck:", error);
            alert("An error occurred while deleting the deck. Please try again.");
        }
    };

    const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

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
                        {decks.map((deck) => (
                            <button
                                key={deck.id}
                                onClick={() => {
                                    setSelectedDeckId(deck.id);
                                    setCurrentIndex(0);
                                }}
                                className={selectedDeckId === deck.id ? "selected" : ""}
                            >
                                {deck.title}
                            </button>
                        ))}
                    </div>

                    {selectedDeck ? (
                        selectedDeck.cards.length > 0 ? (
                            <FlashcardComponent
                                card={selectedDeck.cards[currentIndex]}
                                isNavigating={isNavigating}
                                onDelete={deleteCard}
                            />
                        ) : (
                            <p>This deck has no cards. Add some!</p>
                        )
                    ) : (
                        <p>Please select or create a deck.</p>
                    )}

                    <div className="navigation">
                        <button onClick={goToPrevious} disabled={!selectedDeck || selectedDeck.cards.length === 0}>
                            ⬅️ Previous
                        </button>
                        <button onClick={goToNext} disabled={!selectedDeck || selectedDeck.cards.length === 0}>
                            Next ➡️
                        </button>
                    </div>

                    <div className="actions">
                        <button className="create-deck" onClick={createNewDeck}>Create New Deck</button>
                        {selectedDeck && (
                            <>
                                <button className="delete-deck" onClick={() => deleteDeck(selectedDeck.id, selectedDeck.title)}>
                                    Delete Deck
                                </button>
                                <button className="add-card"
                                    onClick={() => {
                                        const frontText = prompt("Enter the front text for your new card:");
                                        const backText = prompt("Enter the back text for your new card:");
                                        if (frontText && backText) addCardToDeck(selectedDeck.id, frontText, backText);
                                    }}
                                >
                                    Add Card
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default App;
