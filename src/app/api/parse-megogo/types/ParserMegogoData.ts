// Results object type: key — season name (string), value — array of episode

export type Episode = {
  title: string;
  url: string;
  fileName: string;
};

export type Results = Record<string, Episode[]>;

export type ParserMegogoData = {
  pageTitle: string;
  results: Results;
};
