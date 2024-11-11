import { useState } from "react";
import "./App.css";

type Flashcard = {
    front: string;
    back: string;
};

const FlashcardComponent = ({ card }: { card: Flashcard }) => {
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div
            onClick={handleFlip}
            className={`flashcard ${isFlipped ? "flipped" : ""}`}
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
    const sampleCard: Flashcard = {
        front: "What is the capital of France?",
        back: "Paris",
    };

    return (
        <div className="app">
            <FlashcardComponent card={sampleCard} />
        </div>
    );
}

export default App;
