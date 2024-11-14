import { useState, useEffect} from "react";
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
    const decks: { [key: string]: Flashcard[] } = {
        "Geography": [
            { front: "What is the capital of France?", back: "Paris" },
            { front: "What is the capital of Germany?", back: "Berlin" },
            { front: "What is the capital of Italy?", back: "Rome" },
        ],
        "Math": [
            { front: "What is 2 + 2?", back: "4" },
            { front: "What is 5 * 6?", back: "30" },
            { front: "What is 12 / 3?", back: "4" },
        ],
        "Science": [
            { front: "What is the chemical symbol for water?", back: "H2O" },
            { front: "What is the atomic number of carbon?", back: "6" },
            { front: "What planet is known as the Red Planet?", back: "Mars" },
        ],
    };

    const [selectedDeck, setSelectedDeck] = useState("Geography");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false); 
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
            <header className = "header">
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

            <FlashcardComponent card={decks[selectedDeck][currentIndex]} isNavigating={isNavigating} />
            
            <div className="navigation">
                <button onClick={goToPrevious}>⬅️ Previous</button>
                <button onClick={goToNext}>Next ➡️</button>
            </div>
        </div>
    );
}

export default App;
