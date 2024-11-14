// src/types/types.ts

// Flashcard type definition
export type Flashcard = {
    front: string;
    back: string;
};

// Deck type definition
export type Deck = {
    id: string; // or number if ID is a number
    title: string;
    description: string;
    contents: Flashcard[];
};

// Optional DeckList alias if needed
export type DeckList = Deck[];
