"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { quickCreateClient } from "@/app/dashboard/clients/actions";

interface Client {
  id: string;
  name: string;
}

interface ClientComboboxProps {
  clients: Client[];
  value?: string;
  onChange: (value: string) => void;
}

export function ClientCombobox({
  clients: initialClients,
  value,
  onChange,
}: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [clients, setClients] = React.useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  // Sincronizar clientes si llegan nuevos props (ej: revalidación externa)
  React.useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  // Encontrar el nombre del seleccionado
  const selectedClient = clients.find((c) => c.id === value);

  // Función de creación robusta
  const handleCreate = async () => {
    if (!searchTerm.trim()) return;

    setIsCreating(true);
    try {
      const result = await quickCreateClient(searchTerm);

      if (result.error) {
        toast.error("Error: " + result.error);
      } else if (result.client) {
        // 1. Agregamos el nuevo cliente a la lista local inmediatamente
        const newClient = result.client;
        setClients((prev) => [...prev, newClient]);

        // 2. Lo seleccionamos
        onChange(newClient.id);

        // 3. Cerramos y limpiamos
        setOpen(false);
        setSearchTerm("");
        toast.success(`Cliente "${newClient.name}" creado y seleccionado`);
      }
    } catch (error) {
      toast.error("Error de conexión al crear cliente");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {selectedClient ? (
            <span className="font-medium">{selectedClient.name}</span>
          ) : (
            <span className="text-muted-foreground">
              Seleccionar cliente...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cliente..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {/* ESTADO VACÍO CON BOTÓN DE ACCIÓN EXPLÍCITO */}
            {clients.length === 0 ||
            (searchTerm &&
              !clients.some((c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()),
              )) ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No se encontró "{searchTerm}"
                </p>
                {searchTerm && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Crear "{searchTerm}"
                  </Button>
                )}
              </div>
            ) : null}

            {/* LISTA DE CLIENTES FILTRADA MANUALMENTE */}
            <CommandGroup>
              {clients
                .filter(
                  (c) =>
                    !searchTerm ||
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name} // Importante para cmdk
                    onSelect={() => {
                      onChange(client.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {client.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
