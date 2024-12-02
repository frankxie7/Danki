export type Flashcard = {
    front: string;
    back: string;
};

export type Deck = {
    id: string;
    title: string;
    description: string;
    contents: Flashcard[];
};

export type DeckList = Deck[];
