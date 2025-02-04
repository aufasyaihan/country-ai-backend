export interface Message {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface CountryContext {
    name: string;
    capital: string;
    currency: string;
    languages?: { name: string }[];
}

export interface Languages {
    name: string;
}