import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import CountryAutocomplete from "../components/CountryAutocomplete";
import { searchCountries } from "../lib/countries";
import { Country } from "../types/country";

vi.mock("../lib/countries", () => ({
  searchCountries: vi.fn(),
}));

function renderAutocomplete() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CountryAutocomplete />
    </QueryClientProvider>
  );
}

const canada: Country = {
  names: {
    common: "Canada",
  },
  codes: {
    alpha_2: "CA",
  },
  flag: {
    emoji: "🇨🇦",
  },
};

const cameroon: Country = {
  names: {
    common: "Cameroon",
  },
  codes: {
    alpha_2: "CM",
  },
  flag: {
    emoji: "🇨🇲",
  },
};

describe("CountryAutocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input", () => {
    renderAutocomplete();

    expect(
      screen.getByPlaceholderText("Search for a country...")
    ).toBeInTheDocument();
  });

  it("shows country results after searching", async () => {
    vi.mocked(searchCountries).mockResolvedValue([
      canada,
      cameroon,
    ]);

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "ca");

    await waitFor(() => {
      expect(screen.getByText("Canada")).toBeInTheDocument();
      expect(screen.getByText("Cameroon")).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation and selection", async () => {
    vi.mocked(searchCountries).mockResolvedValue([
      canada,
      cameroon,
    ]);

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "ca");

    await waitFor(() => {
      expect(screen.getByText("Canada")).toBeInTheDocument();
      expect(screen.getByText("Cameroon")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}");

    expect(
      screen.getByRole("option", { name: /Canada/ })
    ).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");

    expect(
      screen.getByRole("option", { name: /Cameroon/ })
    ).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Cameroon");
  });

  it("closes the dropdown when Escape is pressed", async () => {
    vi.mocked(searchCountries).mockResolvedValue([canada]);

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "ca");

    await waitFor(() => {
      expect(screen.getByText("Canada")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("listbox")
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("listbox")
    ).not.toBeInTheDocument();

    expect(input).toHaveValue("ca");
  });

  it("shows a no results message when no countries are found", async () => {
    vi.mocked(searchCountries).mockResolvedValue([]);

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "xyz");

    await waitFor(() => {
      expect(
        screen.getByText("No countries found.")
      ).toBeInTheDocument();
    });
  });

  it("shows an error message when the country search fails", async () => {
    vi.mocked(searchCountries).mockRejectedValue(
      new Error("API failed")
    );

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "ca");

    await waitFor(() => {
      expect(
        screen.getByText(
          "Something went wrong. Please try again."
        )
      ).toBeInTheDocument();
    });
  });

  it("does not allow a stale response to replace newer results", async () => {
    let resolveCa!: (value: Country[]) => void;
    let resolveCam!: (value: Country[]) => void;

    const caPromise = new Promise<Country[]>((resolve) => {
      resolveCa = resolve;
    });

    const camPromise = new Promise<Country[]>((resolve) => {
      resolveCam = resolve;
    });

    vi.mocked(searchCountries).mockImplementation((search) => {
      if (search === "ca") {
        return caPromise;
      }

      if (search === "cam") {
        return camPromise;
      }

      return Promise.resolve([]);
    });

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "ca");

    await waitFor(() => {
      expect(searchCountries).toHaveBeenCalledWith(
        "ca",
        expect.any(AbortSignal)
      );
    });

    await user.type(input, "m");

    await waitFor(() => {
      expect(searchCountries).toHaveBeenCalledWith(
        "cam",
        expect.any(AbortSignal)
      );
    });

    // Resolve the newer request first.
    resolveCam([cameroon]);

    await waitFor(() => {
      expect(
        screen.getByText("Cameroon")
      ).toBeInTheDocument();
    });

    // The older request resolves afterwards and must be ignored.
    resolveCa([canada]);

    await waitFor(() => {
      expect(
        screen.getByText("Cameroon")
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Canada")
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while search is in progress", async () => {
    let resolveSearch!: (value: Country[]) => void;

    const pendingPromise = new Promise<Country[]>((resolve) => {
      resolveSearch = resolve;
    });

    vi.mocked(searchCountries).mockReturnValue(
      pendingPromise
    );

    renderAutocomplete();

    const input = screen.getByPlaceholderText(
      "Search for a country..."
    );

    const user = userEvent.setup();

    await user.type(input, "ca");

    await waitFor(() => {
      expect(
        screen.getByText("Searching...")
      ).toBeInTheDocument();
    });

    resolveSearch([]);
  });
});