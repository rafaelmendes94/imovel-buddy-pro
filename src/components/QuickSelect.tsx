import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface QuickSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  className?: string;
}

/**
 * Input field with quick-select suggestion chips.
 * Shows previously used values as clickable buttons below the input.
 */
export function QuickSelect({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  icon,
  type = "text",
  className,
}: QuickSelectProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setFiltered(
        suggestions.filter(
          (s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
        )
      );
    } else {
      setFiltered(suggestions);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleSuggestions = filtered.slice(0, 8);
  const hasSuggestions = suggestions.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
        {icon}
        {label}
        {hasSuggestions && (
          <span className="ml-auto text-[9px] font-normal text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded-full">
            {suggestions.length} sugestões
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
        />
        {hasSuggestions && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showSuggestions && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Suggestion Chips */}
      {showSuggestions && visibleSuggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 animate-fade-in">
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setShowSuggestions(false);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border",
                value === s
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-muted hover:border-primary/30"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface QuickSelectDropdownProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  suggestions?: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Select dropdown that also shows quick-fill suggestions from DB data.
 */
export function QuickSelectDropdown({
  label,
  value,
  onChange,
  options,
  suggestions = [],
  placeholder,
  icon,
  className,
}: QuickSelectDropdownProps) {
  // Merge options with unique suggestions
  const allOptions = [...new Set([...options, ...suggestions])];

  return (
    <div className={className}>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
        {icon}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{placeholder || "Selecione"}</option>
        {allOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
