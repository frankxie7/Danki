import { useState, useEffect } from "react";
import "./App.css";

// Define the Flashcard type
type Flashcard = {
    front: string;
    back: string;
};

// Define the Deck type
type Deck = {
    id: string;
    title: string;
    cards: Flashcard[];
};

// FlashcardComponent Props
interface FlashcardComponentProps {
    card: Flashcard;
    isNavigating: boolean;
}

// FlashcardComponent
const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ card, isNavigating }) => {
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

// App Component
const App: React.FC = () => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
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

            // Assuming the API returns an array of decks with id, title, and cards
            const fetchedDecks: Deck[] = data.map((deck: any) => ({
                id: deck.id,
                title: deck.title || `Deck ${deck.id}`,
                cards: deck.cards.map((card: any) => ({
                    front: card.frontText,
                    back: card.backText,
                })),
            }));

            setDecks(fetchedDecks);

            // If no deck is selected, default to the first deck
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Navigation between cards
    const goToPrevious = () => {
        if (!selectedDeckId) return;

        const currentDeck = decks.find(deck => deck.id === selectedDeckId);
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

        const currentDeck = decks.find(deck => deck.id === selectedDeckId);
        if (!currentDeck) return;

        if (currentDeck.cards.length === 0) return;

        setIsNavigating(true);
        setCurrentIndex((prevIndex) =>
            prevIndex < currentDeck.cards.length - 1 ? prevIndex + 1 : 0
        );
        setTimeout(() => setIsNavigating(false), 500);
    };

    // Add a card to a deck
    const addCardToDeck = async (deckId: string, frontText: string, backText: string) => {
        // Optimistic UI update: Add the new card locally first
        const newCard: Flashcard = { front: frontText, back: backText };
        setDecks((prevDecks) =>
            prevDecks.map(deck =>
                deck.id === deckId
                    ? { ...deck, cards: [...deck.cards, newCard] }
                    : deck
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
            } else {
                console.error("Error adding card:", response.statusText);
                // Revert the optimistic update
                setDecks((prevDecks) =>
                    prevDecks.map(deck =>
                        deck.id === deckId
                            ? { ...deck, cards: deck.cards.slice(0, -1) }
                            : deck
                    )
                );
                alert("Failed to add the card. Please try again.");
            }
        } catch (error) {
            console.error("Error adding card:", error);
            // Revert the optimistic update
            setDecks((prevDecks) =>
                prevDecks.map(deck =>
                    deck.id === deckId
                        ? { ...deck, cards: deck.cards.slice(0, -1) }
                        : deck
                )
            );
            alert("An error occurred while adding the card. Please try again.");
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
                await fetchDecks(); // Refresh decks to include the new deck

                // Optionally, select the newly created deck
                if (result.id) {
                    setSelectedDeckId(result.id);
                    setCurrentIndex(0);
                }
            } else {
                console.error("Error creating deck:", response.statusText);
                alert("Failed to create deck. Please try again.");
            }
        } catch (error) {
            console.error("Error creating deck:", error);
            alert("An error occurred while creating the deck. Please try again.");
        }
    };

    // Handle adding a card (prompt user for front/back text)
    const handleAddCard = () => {
        if (!selectedDeckId) {
            alert("Please select a deck first.");
            return;
        }

        const frontText = prompt("Enter the front text for your new card:");
        if (!frontText) return; // Cancelled or empty front text

        const backText = prompt("Enter the back text for your new card:");
        if (!backText) return; // Cancelled or empty back text

        addCardToDeck(selectedDeckId, frontText, backText);
    };

    // Delete a deck
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
                // Remove the deck from the state
                setDecks((prevDecks) => prevDecks.filter(deck => deck.id !== deckId));

                // If the deleted deck was selected, clear selection or select another deck
                if (selectedDeckId === deckId) {
                    if (decks.length > 1) {
                        const remainingDecks = decks.filter(deck => deck.id !== deckId);
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

    // Get the currently selected deck
    const selectedDeck = decks.find(deck => deck.id === selectedDeckId);

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
                        <button onClick={createNewDeck}>Create New Deck</button>
                        <button onClick={handleAddCard} disabled={!selectedDeck}>
                            Add Card
                        </button>
                        {selectedDeck && (
                            <button onClick={() => deleteDeck(selectedDeck.id, selectedDeck.title)}>
                                Delete Deck
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default App;
