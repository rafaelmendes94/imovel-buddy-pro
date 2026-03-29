import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type TableName = "construtoras" | "construtora_empreendimentos" | "imoveis";

interface QuickValuesConfig {
  table: TableName;
  column: string;
}

/**
 * Hook that fetches distinct non-empty values from a Supabase column
 * to use as quick-fill suggestions in forms.
 */
export function useQuickValues(configs: QuickValuesConfig[]) {
  const [values, setValues] = useState<Record<string, string[]>>({});

  const fetchValues = useCallback(async () => {
    const results: Record<string, string[]> = {};

    await Promise.all(
      configs.map(async ({ table, column }) => {
        const key = `${table}.${column}`;
        try {
          const { data } = await supabase
            .from(table)
            .select(column)
            .not(column, "is", null)
            .not(column, "eq", "")
            .order(column)
            .limit(100);

          if (data) {
            const unique = [...new Set(
              data
                .map((row: any) => String(row[column] || "").trim())
                .filter((v: string) => v.length > 0)
            )];
            results[key] = unique;
          }
        } catch {
          results[key] = [];
        }
      })
    );

    setValues(results);
  }, []);

  useEffect(() => {
    fetchValues();
  }, [fetchValues]);

  const getValues = (table: TableName, column: string): string[] => {
    return values[`${table}.${column}`] || [];
  };

  return { getValues, refresh: fetchValues };
}
