import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { NextRequest, NextResponse } from 'next/server';

// type Episode = {
//   title: string;
//   url: string;
// };

type Season = {
  title: string;
  url: string;
};

export async function POST(req: NextRequest) {
  try {
    const { url, seasonUrl = 'https://megogo.net/ua/view/68751' } =
      await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "url"' },
        { status: 400 },
      );
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch main page' },
        { status: 500 },
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // --- STEP 1: Parse all seasons ---
    const seasons: Season[] = [];

    const seasonsList = $('ul.seasons-list');
    seasonsList.find('li a').each((_, el) => {
      const seasonHref = $(el).attr('href');
      const seasonTitle = $(el).text().trim();

      if (seasonHref && seasonTitle) {
        const fullUrl = new URL(seasonHref, url).toString();
        seasons.push({ title: seasonTitle, url: fullUrl });
      }
    });

    // Якщо не передано конкретний seasonUrl — просто повертаємо сезони
    if (!seasonUrl || typeof seasonUrl !== 'string') {
      return NextResponse.json({ seasons });
    }

    // --- STEP 2: Parse episodes from given seasonUrl ---
    const seasonRes = await fetch(seasonUrl);
    if (!seasonRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch season page' },
        { status: 500 },
      );
    }

    const seasonHtml = await seasonRes.text();
    const $$ = cheerio.load(seasonHtml);

    const episodesContainer = $$('div.episodes-container');
    if (!episodesContainer.length) {
      return NextResponse.json(
        { error: 'No episodes container found on season page' },
        { status: 404 },
      );
    }

    // Можуть бути різні div.season-container (один з них буде "is-loaded")
    let seasonContainer = episodesContainer.find(
      'div.season-container.is-loaded',
    );

    // Якщо is-loaded немає, fallback на перший season-container
    if (!seasonContainer.length) {
      seasonContainer = episodesContainer.find('div.season-container').first();
    }

    if (!seasonContainer.length) {
      return NextResponse.json(
        { error: 'No valid season container found' },
        { status: 404 },
      );
    }

    const parsed = parseEpisodes(seasonContainer, seasonUrl);

    return NextResponse.json({
      seasonUrl,
      episodesCount: parsed.episodesCount,
      episodes: parsed.episodes,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseEpisodes(container: cheerio.Cheerio<AnyNode>, baseUrl: string) {
  const episodes: Array<{ title: string; url: string }> = [];

  container.find('div.cards-list > div').each((_, el) => {
    const $el = cheerio.load(el);
    const episodeTitle =
      $el('[data-episode-title]').attr('data-episode-title') ??
      $el('div[data-episode-title]').attr('data-episode-title');

    const href = $el('a').attr('href');

    if (episodeTitle && href) {
      episodes.push({
        title: episodeTitle.trim(),
        url: new URL(href, baseUrl).toString(),
      });
    }
  });

  return {
    episodesCount: episodes.length,
    episodes,
  };
}
