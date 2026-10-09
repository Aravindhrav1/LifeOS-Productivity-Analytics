"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestSupabase() {
  const [message, setMessage] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        const timeout = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timed out after 10 seconds")),
            10000
          )
        );

        const request = supabase
          .from("categories")
          .select("id")
          .limit(1);

        const result: any = await Promise.race([request, timeout]);

        if (result.error) {
          setMessage(`❌ Supabase error: ${result.error.message}`);
        } else {
          setMessage("✅ LifeOS successfully connected to Supabase!");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        setMessage(`❌ Connection failed: ${message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">LifeOS Database Test</h1>
      <p className="mt-4">{message}</p>
    </main>
  );
}