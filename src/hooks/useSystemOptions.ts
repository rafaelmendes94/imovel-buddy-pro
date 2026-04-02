import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SystemOption {
  id: string;
  category: string;
  value: string;
  sort_order: number;
}

export function useSystemOptions(category: string) {
  const [options, setOptions] = useState<SystemOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("system_options")
      .select("*")
      .eq("category", category)
      .order("sort_order");
    if (data) setOptions(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [category]);

  const values = options.map(o => o.value);

  return { options, values, loading, reload: load };
}
