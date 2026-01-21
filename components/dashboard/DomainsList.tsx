"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DomainsTable } from "@/components/dashboard/DomainsTable";
import { Search } from "lucide-react";

interface Domain {
  id: string;
  url: string;
  provider: string;
  expiration_date: string;
  status: string;
  clients: {
    name: string;
    unique_client_id?: string;
  } | null;
}

interface DomainsListProps {
  initialDomains: Domain[];
}

export function DomainsList({ initialDomains }: DomainsListProps) {
  const [search, setSearch] = useState("");

  const filteredDomains = initialDomains.filter(
    (d) =>
      d.url.toLowerCase().includes(search.toLowerCase()) ||
      d.clients?.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por dominio o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <DomainsTable domains={filteredDomains} />
    </div>
  );
}
