"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [queVende, setQueVende] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [error, setError] = useState("");
  const [sugerencias, setSugerencias] = useState<string[]>([]);

  async function sugerirNombres() {
    if (!queVende.trim()) {
      setError("Primero escribe qué vas a vender");
      return;
    }
    setLoadingIA(true);
    setError("");
    setSugerencias([]);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockTitle: "Nombre del emprendimiento",
          questions: [
            `Sugiere 3 nombres creativos y cortos para un emprendimiento de repostería en Cochabamba que vende: ${queVende}. Solo responde con los 3 nombres, uno por línea, sin numeración ni explicación.`,
          ],
        }),
      });

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const nombres = data.suggestions
          .join("\n")
          .split("\n")
          .map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 3);
        setSugerencias(nombres.length ? nombres : data.suggestions);
      } else {
        setError("No se pudieron generar nombres");
      }
    } catch {
      setError("Error al conectar con la IA");
    } finally {
      setLoadingIA(false);
    }
  }

    async function handleContinuar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión no encontrada. Vuelve a iniciar sesión.");
      setLoading(false);
      router.push("/login");
      return;
    }

    const { data: creado, error: insertError } = await supabase
      .from("proyectos")
      .insert({
        user_id: user.id,
        nombre: nombreNegocio.trim() || "Mi emprendimiento",
        lienzo: {
          _meta: {
            queVende: queVende.trim(),
            descripcion: descripcion.trim(),
          },
        },
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Proyecto nuevo = lienzo vacío (no hereda el anterior)
    if (creado?.id) {
      localStorage.setItem("lienzoia-current-project-id", String(creado.id));
      localStorage.setItem(
        `lienzoia-canvas-answers-${creado.id}`,
        JSON.stringify({})
      );
    }
    localStorage.removeItem("lienzoia-canvas-answers");

    router.push("/dashboard/lienzo");
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xl mx-auto">
            L
          </div>
          <h1 className="mt-3 text-xl sm:text-2xl font-bold text-stone-800">
            Cuéntanos de tu emprendimiento
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Esto nos ayuda a personalizar tu Lienzo Canvas
          </p>
        </div>

        <form onSubmit={handleContinuar} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              ¿Qué vas a vender o en qué se basa tu negocio?
            </label>
            <textarea
              value={queVende}
              onChange={(e) => setQueVende(e.target.value)}
              required
              rows={2}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 bg-white outline-none focus:border-emerald-500 resize-none"
              placeholder="Ej: tortas personalizadas, galletas, postres sin gluten..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Nombre de tu emprendimiento
            </label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 bg-white outline-none focus:border-emerald-500"
              placeholder="Ej: Dulce Sur"
            />
            <button
              type="button"
              onClick={sugerirNombres}
              disabled={loadingIA}
              className="mt-2 text-sm text-emerald-800 font-medium hover:underline disabled:opacity-50"
            >
              {loadingIA ? "Generando nombres..." : "✨ Sugerir nombre con IA"}
            </button>

            {sugerencias.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sugerencias.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNombreNegocio(n)}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 hover:bg-emerald-100"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Descripción breve (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 bg-white outline-none focus:border-emerald-500 resize-none"
              placeholder="Ej: Repostería artesanal en la Zona Sur de Cochabamba"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-800 text-white font-medium hover:bg-emerald-900 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Continuar al dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}