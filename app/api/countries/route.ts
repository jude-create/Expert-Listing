import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.restcountries.com/countries/v5/name";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { message: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    // Keep the API key on the server so it is never exposed to the browser.
    const response = await fetch(
      `${API_URL}?q=${encodeURIComponent(
        query
      )}&response_fields=names.common,codes.alpha_2,flag.emoji`,
      {
        headers: {
          Authorization: `Bearer ${process.env.REST_COUNTRIES_API_KEY}`,
        },
        signal: request.signal,
      }
    );

    if (!response.ok) {
      // REST Countries returns 404 when no country matches the search.
      // Normalize that response to the same shape expected by the client.
      if (response.status === 404) {
        return NextResponse.json({
          data: {
            objects: [],
          },
        });
      }

      throw new Error("Failed to fetch countries");
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    // The client may cancel an older request when a newer search begins.
    if (error instanceof Error && error.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }

    console.error("Country API error:", error);

    return NextResponse.json(
      { message: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}