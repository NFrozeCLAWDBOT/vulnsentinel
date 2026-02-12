import { useState } from "react";
import { useStats } from "@/hooks/useApi";
import { HeroSection } from "@/components/HeroSection";
import { DashboardSection } from "@/components/DashboardSection";
import { CveTableSection } from "@/components/CveTableSection";
import { Footer } from "@/components/Footer";

function App() {
  const { stats, loading } = useStats();
  const [searchQuery, setSearchQuery] = useState<string | undefined>();

  const handleSearch = (query: string) => {
    setSearchQuery(query || undefined);
    if (query) {
      document.getElementById("cve-table")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep">
      <HeroSection stats={stats} loading={loading} onSearch={handleSearch} />
      <DashboardSection stats={stats} loading={loading} />
      <CveTableSection stats={stats} initialSearch={searchQuery} />
      <Footer />
    </div>
  );
}

export default App;
