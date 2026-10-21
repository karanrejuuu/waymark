import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import { db, LocalShop } from "@/lib/db/dexie";
import { enqueueWrite } from "@/lib/db/sync";

export const UrgentButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<LocalShop[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      db.shops.toArray().then(setShops);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredShops = search.trim()
    ? shops.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : shops.slice(0, 10);

  const handleMarkUrgent = async (shop: LocalShop) => {
    const updated = {
      ...shop,
      is_urgent: true,
      updated_at: new Date().toISOString(),
    };

    // Update in Dexie and queue sync
    await enqueueWrite("shops", "upsert", updated);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-xs text-text-secondary hover:text-text-primary font-medium py-1 px-2 rounded hover:bg-bg-subtle inline-flex items-center gap-1 transition-colors"
        >
          <Plus size={14} />
          <span>Mark shop urgent</span>
        </button>
      ) : (
        <div className="absolute left-0 top-0 z-30 w-72 bg-bg border border-border rounded-lg shadow-sm p-2 text-sm">
          <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-border mb-1.5">
            <div className="flex items-center gap-1.5 flex-1 px-1 text-text-secondary">
              <Search size={14} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search shop name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-text-tertiary hover:text-text-primary rounded"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredShops.length === 0 ? (
              <div className="py-3 text-center text-xs text-text-tertiary">
                No shops found
              </div>
            ) : (
              filteredShops.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleMarkUrgent(s)}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-bg-subtle rounded flex items-center justify-between group"
                >
                  <span className="font-medium text-text-primary truncate">
                    {s.name}
                  </span>
                  <span className="text-[11px] text-text-tertiary group-hover:text-accent">
                    {s.is_urgent ? "Already urgent" : "Mark urgent →"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
