import CountryAutocomplete from "./components/CountryAutocomplete";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Country Search
      </h1>

      <CountryAutocomplete />
    </main>
  );
}