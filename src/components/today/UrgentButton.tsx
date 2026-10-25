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
          className="text-xs text-[#F43F5E] font-bold py-1.5 px-3 rounded-xl border border-[#F43F5E]/30 bg-[#F43F5E]/10 hover:bg-[#F43F5E]/20 inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
        >
          <Plus size={14} />
          <span>Mark Shop Urgent</span>
        </button>
      ) : (
        <div className="absolute right-0 top-0 z-40 w-80 bg-[#131316] border border-white/[0.12] rounded-2xl shadow-float p-3 text-xs">
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-white/[0.08] mb-2">
            <div className="flex items-center gap-1.5 flex-1 px-1 text-[#8C8C96]">
              <Search size={14} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search kirana store name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-[#F4F4F6] placeholder:text-[#54545E]"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#8C8C96] hover:text-[#F4F4F6] rounded-lg"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredShops.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#8C8C96]">
                No shops found
              </div>
            ) : (
              filteredShops.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleMarkUrgent(s)}
                  className="w-full text-left px-2.5 py-2 text-xs hover:bg-[#1B1B20] rounded-xl flex items-center justify-between group transition-colors"
                >
                  <span className="font-bold text-[#F4F4F6] truncate">
                    {s.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#8C8C96] group-hover:text-[#B5F23D]">
                    {s.is_urgent ? "Urgent" : "+ Add to round"}
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
