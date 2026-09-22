"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useDebounce } from "../hooks/useDebounce";
import { searchCountries } from "../lib/countries";

export default function CountryAutocomplete() {
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  // Wait 300ms after the user stops typing before searching.
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: countries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["countries", debouncedSearch],
    queryFn: ({ signal }) =>
      searchCountries(debouncedSearch, signal),
    enabled: debouncedSearch.trim().length >= 2,
  });

  useEffect(() => {
    // Reset the highlighted option whenever new results arrive.
    setHighlightedIndex(-1);
  }, [countries]);

  const selectCountry = (index: number) => {
    const country = countries[index];

    if (!country) {
      return;
    }

    setSearch(country.names.common);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();

      setIsOpen(false);
      setHighlightedIndex(-1);

      return;
    }

    if (countries.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setIsOpen(true);

      setHighlightedIndex((currentIndex) =>
        currentIndex < countries.length - 1
          ? currentIndex + 1
          : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setIsOpen(true);

      setHighlightedIndex((currentIndex) =>
        currentIndex > 0
          ? currentIndex - 1
          : countries.length - 1
      );
    }

    if (event.key === "Enter") {
      if (highlightedIndex >= 0) {
        event.preventDefault();
        selectCountry(highlightedIndex);
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <input
        type="text"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search for a country..."
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && countries.length > 0}
        aria-controls="country-listbox"
        aria-activedescendant={
          highlightedIndex >= 0
            ? `country-option-${countries[highlightedIndex]?.codes.alpha_2}`
            : undefined
        }
        className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
      />

      {isLoading && (
        <p className="mt-2 text-sm text-gray-500">
          Searching...
        </p>
      )}

      {isError && (
        <p className="mt-2 text-sm text-red-600">
          Something went wrong. Please try again.
        </p>
      )}

      {!isLoading &&
        !isError &&
        debouncedSearch.trim().length >= 2 &&
        countries.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No countries found.
          </p>
        )}

      {isOpen && countries.length > 0 && (
        <ul
          id="country-listbox"
          role="listbox"
          className="mt-2 overflow-hidden rounded-lg border bg-white shadow-sm"
        >
          {countries.map((country, index) => (
            <li
              key={country.codes.alpha_2}
              id={`country-option-${country.codes.alpha_2}`}
              role="option"
              aria-selected={highlightedIndex === index}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectCountry(index)}
              className={`cursor-pointer border-b px-4 py-3 last:border-b-0 ${
                highlightedIndex === index
                  ? "bg-gray-100"
                  : ""
              }`}
            >
              <span className="mr-2">
                {country.flag.emoji}
              </span>

              {country.names.common}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}