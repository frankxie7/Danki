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
        <div onClick={handleFlip} className="flashcard">
            <p>{isFlipped ? card.back : card.front}</p>
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

// const styles = {
//     container: {
//       display: 'flex',
//       flexDirection: 'column' as 'column',
//       alignItems: 'center',
//       justifyContent: 'center',
//       minHeight: '100vh',
//       fontFamily: 'Arial, sans-serif',
//     },
//     card: {
//       border: '2px solid #333',
//       borderRadius: '8px',
//       padding: '20px',
//       width: '300px',
//       textAlign: 'center' as 'center',
//       cursor: 'pointer',
//       boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
//     },
//     text: {
//       fontSize: '1.5rem',
//     },
//   };

export default App;
