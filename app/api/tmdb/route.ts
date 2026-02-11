import { NextRequest, NextResponse } from "next/server";
import {
  discoverMovies,
  getMovieDetail,
  getGenres,
  getMovieWatchProviders,
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "discover": {
        const filters: Record<string, string | number> = {};
        searchParams.forEach((value, key) => {
          if (key !== "action") filters[key] = value;
        });
        const movies = await discoverMovies(filters);
        return NextResponse.json({ results: movies });
      }

      case "detail": {
        const movieId = searchParams.get("id");
        if (!movieId)
          return NextResponse.json({ error: "Missing id" }, { status: 400 });
        const movie = await getMovieDetail(parseInt(movieId));
        return NextResponse.json(movie);
      }

      case "genres": {
        const genres = await getGenres();
        return NextResponse.json({ genres });
      }

      case "providers": {
        const movieId = searchParams.get("id");
        if (!movieId)
          return NextResponse.json({ error: "Missing id" }, { status: 400 });
        const providers = await getMovieWatchProviders(parseInt(movieId));
        return NextResponse.json(providers);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("TMDB proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from TMDB" },
      { status: 500 },
    );
  }
}
