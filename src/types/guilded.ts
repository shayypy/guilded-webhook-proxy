export interface APIEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface APIEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface APIEmbedMedia {
  url: string;
}

export interface APIEmbedFooter {
  text: string;
  icon_url?: string;
}

export interface APIEmbed {
  title?: string;
  url?: string;
  color?: number;
  description?: string;
  timestamp?: string;
  fields?: APIEmbedField[];
  author?: APIEmbedAuthor;
  footer?: APIEmbedFooter;
  image?: APIEmbedMedia;
  thumbnail?: APIEmbedMedia;
}
