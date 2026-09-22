import { Country } from "../types/country";

interface CountriesResponse {
  data: {
    objects: Country[];
  };
}

export async function searchCountries(
  search: string,
  signal?: AbortSignal
): Promise<Country[]> {
  const response = await fetch(
    `/api/countries?q=${encodeURIComponent(search)}`,
    {
      // Allows React Query to cancel outdated requests.
      signal,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch countries");
  }

  const data: CountriesResponse = await response.json();

  return data.data.objects;
}